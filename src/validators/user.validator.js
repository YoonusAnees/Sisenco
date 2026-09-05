import { z } from "zod";

import {
    USER_ROLE_VALUES,
} from "../constants/constant.roles.js";

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid user identifier"
    );

const emailSchema = z
    .string()
    .trim()
    .email("A valid email address is required")
    .max(254, "Email cannot exceed 254 characters")
    .transform((email) => email.toLowerCase());

const passwordSchema = z
    .string()
    .min(
        8,
        "Password must contain at least 8 characters"
    )
    .max(
        128,
        "Password cannot exceed 128 characters"
    )
    .regex(
        /[a-z]/,
        "Password must contain a lowercase letter"
    )
    .regex(
        /[A-Z]/,
        "Password must contain an uppercase letter"
    )
    .regex(
        /[0-9]/,
        "Password must contain a number"
    );

const userParamsSchema = z.object({
    userId: objectIdSchema,
});

export const createUserSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(
                    2,
                    "Name must contain at least 2 characters"
                )
                .max(
                    100,
                    "Name cannot exceed 100 characters"
                ),

            email: emailSchema,

            password: passwordSchema,

            role: z.enum(USER_ROLE_VALUES),

            department: z
                .string()
                .trim()
                .max(
                    100,
                    "Department cannot exceed 100 characters"
                )
                .optional()
                .default(""),

            jobTitle: z
                .string()
                .trim()
                .max(
                    100,
                    "Job title cannot exceed 100 characters"
                )
                .optional()
                .default(""),
        })
        .strict(),
});

export const getUsersSchema = z.object({
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
            .max(100)
            .optional(),

        role: z
            .enum(USER_ROLE_VALUES)
            .optional(),

        department: z
            .string()
            .trim()
            .max(100)
            .optional(),

        isActive: z
            .enum(["true", "false"])
            .transform((value) => value === "true")
            .optional(),

        sortBy: z
            .enum([
                "name",
                "email",
                "createdAt",
                "lastLoginAt",
            ])
            .optional()
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .optional()
            .default("desc"),
    }),
});

export const getUserByIdSchema = z.object({
    params: userParamsSchema,
});

export const updateUserSchema = z.object({
    params: userParamsSchema,

    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            department: z
                .string()
                .trim()
                .max(100)
                .optional(),

            jobTitle: z
                .string()
                .trim()
                .max(100)
                .optional(),
        })
        .strict()
        .refine(
            (body) => Object.keys(body).length > 0,
            {
                message:
                    "At least one field must be provided",
            }
        ),
});

export const updateUserRoleSchema = z.object({
    params: userParamsSchema,

    body: z
        .object({
            role: z.enum(USER_ROLE_VALUES),
        })
        .strict(),
});

export const updateUserStatusSchema = z.object({
    params: userParamsSchema,

    body: z
        .object({
            isActive: z.boolean(),
        })
        .strict(),
});