import { z } from "zod";

import {
    PROJECT_CATEGORY_VALUES,
    PROJECT_MEMBER_ROLE_VALUES,
    PROJECT_STATUS_VALUES,
} from "../constants/constant.projects.js";

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB identifier"
    );

const optionalDateSchema = z
    .string()
    .trim()
    .date("Date must use YYYY-MM-DD format")
    .nullable()
    .optional();

const projectParamsSchema = z.object({
    projectId: objectIdSchema,
});

const projectMemberParamsSchema = z.object({
    projectId: objectIdSchema,
    userId: objectIdSchema,
});

export const createProjectSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(
                    2,
                    "Project name must contain at least 2 characters"
                )
                .max(
                    150,
                    "Project name cannot exceed 150 characters"
                ),

            code: z
                .string()
                .trim()
                .min(
                    2,
                    "Project code must contain at least 2 characters"
                )
                .max(
                    20,
                    "Project code cannot exceed 20 characters"
                )
                .regex(
                    /^[a-zA-Z0-9-]+$/,
                    "Project code may only contain letters, numbers and hyphens"
                )
                .transform((value) => value.toUpperCase()),

            description: z
                .string()
                .trim()
                .max(
                    2000,
                    "Description cannot exceed 2000 characters"
                )
                .optional()
                .default(""),

            category: z
                .enum(PROJECT_CATEGORY_VALUES)
                .optional()
                .default("other"),

            managerId: objectIdSchema.optional(),
            manager: objectIdSchema.optional(),

            startDate: optionalDateSchema,

            endDate: optionalDateSchema,
        })
        .strict()
        .refine(
            (body) => Boolean(body.managerId || body.manager),
            {
                message:
                    "A project manager must be assigned when creating a project",
                path: ["managerId"],
            }
        )
        .refine(
            (body) => {
                if (!body.startDate || !body.endDate) {
                    return true;
                }

                return (
                    new Date(body.endDate) >=
                    new Date(body.startDate)
                );
            },
            {
                message:
                    "End date cannot be earlier than start date",
                path: ["endDate"],
            }
        ),
});

export const getProjectsSchema = z.object({
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

        search: z
            .string()
            .trim()
            .max(150)
            .optional(),

        category: z
            .enum(PROJECT_CATEGORY_VALUES)
            .optional(),

        status: z
            .enum(PROJECT_STATUS_VALUES)
            .optional(),

        managerId: objectIdSchema.optional(),

        sortBy: z
            .enum([
                "name",
                "code",
                "createdAt",
                "startDate",
                "endDate",
            ])
            .optional()
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .optional()
            .default("desc"),
    }),
});

export const getProjectByIdSchema = z.object({
    params: projectParamsSchema,
});

export const updateProjectSchema = z.object({
    params: projectParamsSchema,

    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2)
                .max(150)
                .optional(),

            code: z
                .string()
                .trim()
                .min(2)
                .max(20)
                .regex(/^[a-zA-Z0-9-]+$/)
                .transform((value) => value.toUpperCase())
                .optional(),

            description: z
                .string()
                .trim()
                .max(2000)
                .optional(),

            category: z
                .enum(PROJECT_CATEGORY_VALUES)
                .optional(),

            managerId: objectIdSchema
                .nullable()
                .optional(),

            startDate: optionalDateSchema,

            endDate: optionalDateSchema,
        })
        .strict()
        .refine(
            (body) => Object.keys(body).length > 0,
            {
                message:
                    "At least one project field must be provided",
            }
        ),
});

export const updateProjectStatusSchema =
    z.object({
        params: projectParamsSchema,

        body: z
            .object({
                status: z.enum(PROJECT_STATUS_VALUES),
            })
            .strict(),
    });

export const addProjectMemberSchema = z.object({
    params: projectParamsSchema,

    body: z
        .object({
            userId: objectIdSchema,

            projectRole: z
                .enum(PROJECT_MEMBER_ROLE_VALUES)
                .optional()
                .default("member"),
        })
        .strict(),
});

export const getProjectMembersSchema = z.object({
    params: projectParamsSchema,

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

export const removeProjectMemberSchema = z.object({
    params: projectMemberParamsSchema,
});