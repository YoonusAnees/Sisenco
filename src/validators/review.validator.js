import { z } from "zod";

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB identifier"
    );

const reportParamsSchema = z.object({
    reportId: objectIdSchema,
});

export const getReviewQueueSchema = z.object({
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

        ownerId: objectIdSchema.optional(),

        projectId: objectIdSchema.optional(),

        sortOrder: z
            .enum(["asc", "desc"])
            .optional()
            .default("asc"),
    }),
});

export const requestChangesSchema = z.object({
    params: reportParamsSchema,

    body: z
        .object({
            comment: z
                .string()
                .trim()
                .min(
                    3,
                    "A correction comment is required"
                )
                .max(
                    2000,
                    "Comment cannot exceed 2000 characters"
                ),
        })
        .strict(),
});

export const approveReportSchema = z.object({
    params: reportParamsSchema,

    body: z
        .object({
            comment: z
                .string()
                .trim()
                .max(
                    2000,
                    "Comment cannot exceed 2000 characters"
                )
                .optional()
                .default(""),
        })
        .strict(),
});

export const getReviewHistorySchema =
    z.object({
        params: reportParamsSchema,

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
                .default(20),
        }),
    });