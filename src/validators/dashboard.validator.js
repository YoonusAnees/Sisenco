import { z } from "zod";

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

const dashboardFilterShape = {
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    projectId: objectIdSchema.optional(),
    ownerId: objectIdSchema.optional(),
};

const validateDateRange = (query) => {
    if (!query.startDate || !query.endDate) {
        return true;
    }

    return (
        new Date(query.endDate) >=
        new Date(query.startDate)
    );
};

const dashboardQuerySchema = z
    .object({
        ...dashboardFilterShape,
    })
    .refine(validateDateRange, {
        message:
            "End date cannot be earlier than start date",
        path: ["endDate"],
    });

export const dashboardSummarySchema =
    z.object({
        query: dashboardQuerySchema,
    });

export const taskTrendsSchema = z.object({
    query: z
        .object({
            ...dashboardFilterShape,

            limit: z.coerce
                .number()
                .int()
                .min(1)
                .max(52)
                .optional()
                .default(12),
        })
        .refine(validateDateRange, {
            message:
                "End date cannot be earlier than start date",
            path: ["endDate"],
        }),
});

export const statusByMemberSchema =
    z.object({
        query: dashboardQuerySchema,
    });

export const projectWorkloadSchema =
    z.object({
        query: dashboardQuerySchema,
    });

export const timeDistributionSchema =
    z.object({
        query: dashboardQuerySchema,
    });

export const activitySchema = z.object({
    query: z
        .object({
            ...dashboardFilterShape,

            limit: z.coerce
                .number()
                .int()
                .min(1)
                .max(100)
                .optional()
                .default(20),
        })
        .refine(validateDateRange, {
            message:
                "End date cannot be earlier than start date",
            path: ["endDate"],
        }),
});

export const sectionComparisonSchema =
    z.object({
        query: dashboardQuerySchema,
    });