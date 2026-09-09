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
                .max(2000, "Comment cannot exceed 2000 characters")
                .optional(),
            note: z
                .string()
                .trim()
                .max(2000, "Note cannot exceed 2000 characters")
                .optional(),
            correctionNote: z
                .string()
                .trim()
                .max(2000, "Correction note cannot exceed 2000 characters")
                .optional(),
        })
        .refine(
            (data) => {
                const text = data.comment || data.note || data.correctionNote;
                return Boolean(text && text.trim().length >= 3);
            },
            {
                message: "A correction comment or note of at least 3 characters is required",
                path: ["comment"],
            }
        ),
});

export const approveReportSchema = z.object({
    params: reportParamsSchema,

    body: z
        .object({
            comment: z
                .string()
                .trim()
                .max(2000, "Comment cannot exceed 2000 characters")
                .optional()
                .default(""),
            note: z
                .string()
                .trim()
                .max(2000, "Note cannot exceed 2000 characters")
                .optional(),
        })
        .optional()
        .default({}),
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