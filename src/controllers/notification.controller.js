import {
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service.js";

import asyncHandler from
  "../utils/asyncHandler.js";

export const getNotifications =
  asyncHandler(
    async (request, response) => {
      const result =
        await getUserNotifications({
          currentUserId:
            request.user.id,

          ...request.validated.query,
        });

      response.status(200).json({
        success: true,
        data: {
          notifications:
            result.notifications,

          pagination:
            result.pagination,
        },
      });
    }
  );

export const getUnreadCount =
  asyncHandler(
    async (request, response) => {
      const count =
        await getUnreadNotificationCount(
          request.user.id
        );

      response.status(200).json({
        success: true,
        data: {
          unreadCount: count,
        },
      });
    }
  );

export const markOneAsRead =
  asyncHandler(
    async (request, response) => {
      const { notificationId } =
        request.validated.params;

      const notification =
        await markNotificationAsRead({
          notificationId,
          currentUserId:
            request.user.id,
        });

      response.status(200).json({
        success: true,
        message:
          "Notification marked as read",
        data: {
          notification,
        },
      });
    }
  );

export const markAllAsRead =
  asyncHandler(
    async (request, response) => {
      const result =
        await markAllNotificationsAsRead(
          request.user.id
        );

      response.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
        data: result,
      });
    }
  );