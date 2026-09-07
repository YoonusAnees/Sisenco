import { z } from "zod";

import {
    NOTIFICATION_TYPE_VALUES,
} from "../constants/constant.notification.js";

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB identifier"
    );

export const getNotificationsSchema =
    z.object({
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

            isRead: z
                .enum(["true", "false"])
                .transform(
                    (value) => value === "true"
                )
                .optional(),

            type: z
                .enum(NOTIFICATION_TYPE_VALUES)
                .optional(),

            sortOrder: z
                .enum(["asc", "desc"])
                .optional()
                .default("desc"),
        }),
    });

export const notificationIdSchema =
    z.object({
        params: z.object({
            notificationId: objectIdSchema,
        }),
    });