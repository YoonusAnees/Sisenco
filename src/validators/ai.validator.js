import { z } from "zod";
import { AI_OPERATION_VALUES } from "../constants/constant.ai.js";
import {
    HOURS_CATEGORY_VALUES,
    TASK_PRIORITY_VALUES,
} from "../constants/constant.reports.js";

const objectIdSchema = z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB identifier");

const dateStringSchema = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

export const sendAiMessageSchema = z.object({
    body: z
        .object({
            operation: z.enum(AI_OPERATION_VALUES, {
                errorMap: () => ({ message: "Invalid AI operation" }),
            }),
            message: z
                .string({
                    required_error: "Message is required",
                })
                .trim()
                .min(1, "Message cannot be empty")
                .max(10000, "Message cannot exceed 10,000 characters"),
            conversationId: objectIdSchema.optional(),
            context: z
                .object({
                    page: z.string().trim().max(100).optional(),
                    projectId: objectIdSchema.optional(),
                    reportId: objectIdSchema.optional(),
                    weekStart: dateStringSchema.optional(),
                    weekEnd: dateStringSchema.optional(),
                })
                .strict()
                .optional(),
        })
        .strict(),
});

export const conversationIdSchema = z.object({
    params: z
        .object({
            conversationId: objectIdSchema,
        })
        .strict(),
});

export const listConversationsSchema = z.object({
    query: z
        .object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(50).default(10),
        })
        .strict(),
});

export const aiStructuredReportSchema = z.object({
    summary: z.string().trim().max(3000).optional().default(""),
    completedTasks: z
        .array(
            z.object({
                title: z.string().trim().min(1).max(200),
                description: z.string().trim().max(2000).optional().default(""),
                project: z.string().trim().optional().nullable(),
                projectName: z.string().trim().optional(),
                hoursSpent: z.coerce.number().min(0).max(168).optional().default(0),
            })
        )
        .optional()
        .default([]),
    nextWeekTasks: z
        .array(
            z.object({
                title: z.string().trim().min(1).max(200),
                description: z.string().trim().max(2000).optional().default(""),
                project: z.string().trim().optional().nullable(),
                projectName: z.string().trim().optional(),
                priority: z
                    .enum(TASK_PRIORITY_VALUES)
                    .optional()
                    .default("medium"),
                dueDate: dateStringSchema.optional().nullable(),
            })
        )
        .optional()
        .default([]),
    blockers: z
        .array(
            z.object({
                title: z.string().trim().min(1).max(200),
                description: z.string().trim().min(1).max(2000),
                project: z.string().trim().optional().nullable(),
                projectName: z.string().trim().optional(),
                impact: z.string().trim().max(1000).optional().default(""),
                assistanceNeeded: z
                    .string()
                    .trim()
                    .max(1000)
                    .optional()
                    .default(""),
            })
        )
        .optional()
        .default([]),
    achievements: z
        .array(
            z.object({
                title: z.string().trim().min(1).max(200),
                description: z.string().trim().max(2000).optional().default(""),
                project: z.string().trim().optional().nullable(),
                projectName: z.string().trim().optional(),
            })
        )
        .optional()
        .default([]),
    hoursBreakdown: z
        .array(
            z.object({
                project: z.string().trim().optional().nullable(),
                projectName: z.string().trim().optional(),
                category: z.enum(HOURS_CATEGORY_VALUES).default("development"),
                hours: z.coerce.number().min(0).max(168),
                notes: z.string().trim().max(500).optional().default(""),
            })
        )
        .optional()
        .default([]),
});
