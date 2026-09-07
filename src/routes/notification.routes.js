import { Router } from "express";

import {
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markOneAsRead,
} from "../controllers/notification.controller.js";

import authenticate from
    "../middlewares/middleware.authenticate.js";

import validate from
    "../middlewares/middleware.validate.js";

import {
    getNotificationsSchema,
    notificationIdSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    validate(getNotificationsSchema),
    getNotifications
);

router.get(
    "/unread-count",
    getUnreadCount
);

/*
 * Keep this before "/:notificationId/read"
 * for clearer route organization.
 */
router.patch(
    "/read-all",
    markAllAsRead
);

router.patch(
    "/:notificationId/read",
    validate(notificationIdSchema),
    markOneAsRead
);

export default router;