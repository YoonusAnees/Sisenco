import { z } from "zod";

import {
    HOURS_CATEGORY_VALUES,
    REPORT_STATUS_VALUES,
    TASK_PRIORITY_VALUES,
} from "../constants/constant.reports.js";

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB identifier"
    );

const dateSchema = z
    .string()
    .trim()
    .date("Date must use YYYY-MM-DD format");

const optionalDateSchema =
    dateSchema.nullable().optional();

const completedTaskSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Completed-task title is required")
            .max(200),

        description: z
            .string()
            .trim()
            .max(2000)
            .optional()
            .default(""),

        project: objectIdSchema,

        hoursSpent: z.coerce
            .number()
            .min(0)
            .max(168),

        completedAt: optionalDateSchema,
    })
    .strict();

const nextWeekTaskSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Next-week task title is required")
            .max(200),

        description: z
            .string()
            .trim()
            .max(2000)
            .optional()
            .default(""),

        project: objectIdSchema,

        priority: z
            .enum(TASK_PRIORITY_VALUES)
            .optional()
            .default("medium"),

        dueDate: optionalDateSchema,
    })
    .strict();

const blockerSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Blocker title is required")
            .max(200),

        description: z
            .string()
            .trim()
            .min(1, "Blocker description is required")
            .max(2000),

        project: objectIdSchema,

        impact: z
            .string()
            .trim()
            .max(1000)
            .optional()
            .default(""),

        assistanceNeeded: z
            .string()
            .trim()
            .max(1000)
            .optional()
            .default(""),

        isResolved: z
            .boolean()
            .optional()
            .default(false),
    })
    .strict();

const achievementSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Achievement title is required")
            .max(200),

        description: z
            .string()
            .trim()
            .max(2000)
            .optional()
            .default(""),

        project: objectIdSchema
            .nullable()
            .optional(),
    })
    .strict();

const hoursBreakdownSchema = z
    .object({
        project: objectIdSchema,

        category: z.enum(
            HOURS_CATEGORY_VALUES
        ),

        hours: z.coerce
            .number()
            .min(0)
            .max(168),

        notes: z
            .string()
            .trim()
            .max(500)
            .optional()
            .default(""),
    })
    .strict();

const linkSchema = z
    .object({
        label: z
            .string()
            .trim()
            .min(1, "Link label is required")
            .max(100),

        url: z
            .string()
            .trim()
            .url("A valid link URL is required")
            .max(2000),
    })
    .strict();


const updateCompletedTasksSchema = z
    .array(completedTaskSchema)
    .max(100)
    .optional();

const updateNextWeekTasksSchema = z
    .array(nextWeekTaskSchema)
    .max(100)
    .optional();

const updateBlockersSchema = z
    .array(blockerSchema)
    .max(50)
    .optional();

const updateAchievementsSchema = z
    .array(achievementSchema)
    .max(50)
    .optional();

const updateHoursBreakdownSchema = z
    .array(hoursBreakdownSchema)
    .max(100)
    .optional();

const updateLinksSchema = z
    .array(linkSchema)
    .max(50)
    .optional();

const reportContentSchema = {
    summary: z
        .string()
        .trim()
        .max(3000)
        .optional()
        .default(""),

    completedTasks: z
        .array(completedTaskSchema)
        .max(100)
        .optional()
        .default([]),

    nextWeekTasks: z
        .array(nextWeekTaskSchema)
        .max(100)
        .optional()
        .default([]),

    blockers: z
        .array(blockerSchema)
        .max(50)
        .optional()
        .default([]),

    achievements: z
        .array(achievementSchema)
        .max(50)
        .optional()
        .default([]),

    hoursBreakdown: z
        .array(hoursBreakdownSchema)
        .max(100)
        .optional()
        .default([]),

    links: z
        .array(linkSchema)
        .max(50)
        .optional()
        .default([]),
};


const reportWorkflowParamsSchema = z.object({
  reportId: objectIdSchema,
});

export const createReportSchema = z.object({
    body: z
        .object({
            weekStart: dateSchema,
            ...reportContentSchema,
        })
        .strict(),
});

export const getMyReportsSchema = z.object({
    query: z.object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .optional()
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .default(10),

        status: z
            .enum(REPORT_STATUS_VALUES)
            .optional(),

        year: z.coerce
            .number()
            .int()
            .min(2000)
            .max(2100)
            .optional(),

        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        sortOrder: z
            .enum(["asc", "desc"])
            .optional()
            .default("desc"),
    }),
});

export const getReportByIdSchema = z.object({
    params: z.object({
        reportId: objectIdSchema,
    }),
});

export const updateReportSchema = z.object({
    params: z.object({
        reportId: objectIdSchema,
    }),

    body: z
        .object({
            summary: z
                .string()
                .trim()
                .max(3000)
                .optional(),

            completedTasks:
                updateCompletedTasksSchema,

            nextWeekTasks:
                updateNextWeekTasksSchema,

            blockers:
                updateBlockersSchema,

            achievements:
                updateAchievementsSchema,

            hoursBreakdown:
                updateHoursBreakdownSchema,

            links:
                updateLinksSchema,
        })
        .strict()
        .refine(
            (body) => Object.keys(body).length > 0,
            {
                message:
                    "At least one report field must be provided",
            }
        ),
});




export const submitReportSchema = z.object({
  params: reportWorkflowParamsSchema,
});

export const requestCorrectionSchema = z.object({
  params: reportWorkflowParamsSchema,

  body: z
    .object({
      correctionNote: z
        .string()
        .trim()
        .min(
          5,
          "Correction note must contain at least 5 characters"
        )
        .max(
          2000,
          "Correction note cannot exceed 2000 characters"
        ),
    })
    .strict(),
});

export const getReportVersionsSchema = z.object({
  params: z.object({
    reportId: objectIdSchema,
  }),

  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10),
  }),
});

export const getReportVersionSchema = z.object({
  params: z.object({
    reportId: objectIdSchema,

    versionNumber: z.coerce
      .number()
      .int()
      .min(
        1,
        "Version number must be at least 1"
      ),
  }),
});

export const approveReportSchema = z.object({
  params: reportWorkflowParamsSchema,
});