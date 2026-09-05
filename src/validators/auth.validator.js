import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(254, "Email cannot exceed 254 characters")
    .transform((email) => email.toLowerCase());

const passwordSchema = z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2, "Name must contain at least 2 characters")
                .max(100, "Name cannot exceed 100 characters"),

            email: emailSchema,

            password: passwordSchema,

            department: z
                .string()
                .trim()
                .max(100, "Department cannot exceed 100 characters")
                .optional()
                .default(""),

            jobTitle: z
                .string()
                .trim()
                .max(100, "Job title cannot exceed 100 characters")
                .optional()
                .default(""),
        })
        .strict(),
});

export const loginSchema = z.object({
    body: z
        .object({
            email: emailSchema,

            password: z
                .string()
                .min(1, "Password is required")
                .max(128, "Password cannot exceed 128 characters"),
        })
        .strict(),
});

export const registerAdminSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(100, "Name cannot exceed 100 characters"),

      email: z
        .string()
        .trim()
        .email("A valid email address is required")
        .max(254, "Email cannot exceed 254 characters")
        .transform((email) => email.toLowerCase()),

      password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(128, "Password cannot exceed 128 characters")
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
        ),

      department: z
        .string()
        .trim()
        .max(100)
        .optional()
        .default("Administration"),

      jobTitle: z
        .string()
        .trim()
        .max(100)
        .optional()
        .default("System Administrator"),
    })
    .strict(),
});