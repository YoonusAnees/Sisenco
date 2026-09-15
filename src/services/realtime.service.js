import {
    SOCKET_EVENTS,
} from "../constants/constent.socket.events.js";

import {
    getSocketServer,
} from "../socket/socket.server.js";

import {
    getRoleRoom,
    getUserRoom,
} from "../socket/socket.rooms.js";

const normalizeId = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === "object") {
        return (
            value.id?.toString() ||
            value._id?.toString() ||
            value.toString()
        );
    }

    return value.toString();
};

const serializeNotification = (
    notification
) => {
    if (
        typeof notification.toObject ===
        "function"
    ) {
        return notification.toObject({
            virtuals: true,
        });
    }

    return notification;
};

export const emitNotification = (
    notification
) => {
    const io = getSocketServer();
    if (!io) return;

    const recipientId = normalizeId(
        notification.recipient
    );

    if (!recipientId) {
        return;
    }

    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATION_NEW,
        {
            notification:
                serializeNotification(notification),
        }
    );

    /*
     * Tell the frontend to refresh its unread count.
     */
    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATION_COUNT_CHANGED
    );
};

export const emitNotifications = (
    notifications
) => {
    notifications.forEach((notification) => {
        emitNotification(notification);
    });
};

export const emitNotificationRead = ({
    recipientId,
    notification,
}) => {
    const io = getSocketServer();
    if (!io) return;

    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATION_READ,
        {
            notification:
                serializeNotification(notification),
        }
    );

    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATION_COUNT_CHANGED
    );
};

export const emitAllNotificationsRead = ({
    recipientId,
    updatedCount,
}) => {
    const io = getSocketServer();
    if (!io) return;

    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATIONS_READ_ALL,
        {
            updatedCount,
        }
    );

    io.to(
        getUserRoom(recipientId)
    ).emit(
        SOCKET_EVENTS.NOTIFICATION_COUNT_CHANGED
    );
};

export const emitReportSubmitted = ({
    report,
    recipientIds = [],
    isResubmission = false,
}) => {
    const io = getSocketServer();
    if (!io) return;

    const eventName = isResubmission
        ? SOCKET_EVENTS.REPORT_RESUBMITTED
        : SOCKET_EVENTS.REPORT_SUBMITTED;

    const uniqueRecipientIds = [
        ...new Set(
            recipientIds
                .map(normalizeId)
                .filter(Boolean)
        ),
    ];

    uniqueRecipientIds.forEach(
        (recipientId) => {
            io.to(
                getUserRoom(recipientId)
            ).emit(eventName, {
                report,
            });
        }
    );

    /*
     * Managers and admins can refresh their
     * dashboard/review queue.
     */
    io.to(
        getRoleRoom("manager")
    )
        .to(getRoleRoom("admin"))
        .emit(
            SOCKET_EVENTS.DASHBOARD_REFRESH,
            {
                reason: isResubmission
                    ? "report_resubmitted"
                    : "report_submitted",

                reportId: normalizeId(report),
            }
        );
};

export const emitChangesRequested = ({
    report,
    ownerId,
    review,
}) => {
    const io = getSocketServer();
    if (!io) return;

    io.to(
        getUserRoom(ownerId)
    ).emit(
        SOCKET_EVENTS.REPORT_CHANGES_REQUESTED,
        {
            report,
            review,
        }
    );

    io.to(
        getRoleRoom("manager")
    )
        .to(getRoleRoom("admin"))
        .emit(
            SOCKET_EVENTS.DASHBOARD_REFRESH,
            {
                reason: "changes_requested",
                reportId: normalizeId(report),
            }
        );
};

export const emitReportApproved = ({
    report,
    ownerId,
    review,
}) => {
    const io = getSocketServer();
    if (!io) return;

    io.to(
        getUserRoom(ownerId)
    ).emit(
        SOCKET_EVENTS.REPORT_APPROVED,
        {
            report,
            review,
        }
    );

    io.to(
        getRoleRoom("manager")
    )
        .to(getRoleRoom("admin"))
        .emit(
            SOCKET_EVENTS.DASHBOARD_REFRESH,
            {
                reason: "report_approved",
                reportId: normalizeId(report),
            }
        );
};