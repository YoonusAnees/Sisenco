import {
  NOTIFICATION_TYPES,
} from "../constants/constant.notification.js";

import {
  USER_ROLES,
} from "../constants/constant.roles.js";

import {Notification , Project , User} from
  "../models/index.js";



import AppError from "../utils/AppError.js";

const notificationPopulation = [
  {
    path: "actor",
    select: "name email role",
  },
  {
    path: "report",
    select:
      "owner weekStart weekEnd status currentVersion",
  },
  {
    path: "review",
    select:
      "action comment versionNumber reviewedAt",
  },
];

export const createNotifications = async ({
  notifications,
  session = null,
}) => {
  if (
    !notifications ||
    notifications.length === 0
  ) {
    return [];
  }

  /*
   * Remove duplicate recipients for the
   * same notification.
   */
  const uniqueNotifications = [];
  const notificationKeys = new Set();

  notifications.forEach((notification) => {
    const key = [
      notification.recipient.toString(),
      notification.type,
      notification.report?.toString() || "",
      notification.review?.toString() || "",
    ].join(":");

    if (!notificationKeys.has(key)) {
      notificationKeys.add(key);
      uniqueNotifications.push(notification);
    }
  });

  const created =
    await Notification.insertMany(
      uniqueNotifications,
      {
        session,
      }
    );

  return created;
};

const collectReportProjectIds = (report) => {
  const projectIds = new Set();

  const sections = [
    report.completedTasks || [],
    report.nextWeekTasks || [],
    report.blockers || [],
    report.achievements || [],
    report.hoursBreakdown || [],
  ];

  sections.forEach((section) => {
    section.forEach((entry) => {
      const projectId =
        entry.project?._id ||
        entry.project;

      if (projectId) {
        projectIds.add(
          projectId.toString()
        );
      }
    });
  });

  return [...projectIds];
};

export const getReportReviewerIds = async ({
  report,
  session = null,
}) => {
  const projectIds =
    collectReportProjectIds(report);

  const projectQuery = Project.find({
    _id: {
      $in: projectIds,
    },

    manager: {
      $ne: null,
    },
  }).distinct("manager");

  const adminQuery = User.find({
    role: USER_ROLES.ADMIN,
    isActive: true,
  }).distinct("_id");

  if (session) {
    projectQuery.session(session);
    adminQuery.session(session);
  }

  const [managerIds, adminIds] =
    await Promise.all([
      projectQuery,
      adminQuery,
    ]);

  const recipientIds = new Set([
    ...managerIds.map((id) =>
      id.toString()
    ),

    ...adminIds.map((id) =>
      id.toString()
    ),
  ]);

  /*
   * Do not notify the person about their own
   * action when they also happen to be an admin.
   */
  recipientIds.delete(
    report.owner.toString()
  );

  return [...recipientIds];
};

export const createSubmissionNotifications =
  async ({
    report,
    actorId,
    isResubmission,
    session,
  }) => {
    const recipientIds =
      await getReportReviewerIds({
        report,
        session,
      });

    const type = isResubmission
      ? NOTIFICATION_TYPES
          .REPORT_RESUBMITTED
      : NOTIFICATION_TYPES
          .REPORT_SUBMITTED;

    const title = isResubmission
      ? "Weekly report resubmitted"
      : "New weekly report submitted";

    const message = isResubmission
      ? `A corrected weekly report for ${report.weekStart.toISOString().slice(0, 10)} has been resubmitted.`
      : `A weekly report for ${report.weekStart.toISOString().slice(0, 10)} is ready for review.`;

    return createNotifications({
      notifications: recipientIds.map(
        (recipient) => ({
          recipient,
          actor: actorId,
          type,
          title,
          message,
          report: report._id,
        })
      ),

      session,
    });
  };

export const createChangesRequestedNotification =
  async ({
    report,
    review,
    actorId,
    session,
  }) => {
    return createNotifications({
      notifications: [
        {
          recipient: report.owner,
          actor: actorId,

          type:
            NOTIFICATION_TYPES
              .CHANGES_REQUESTED,

          title:
            "Changes requested for your report",

          message:
            review.comment ||
            "Your manager requested changes to your weekly report.",

          report: report._id,
          review: review._id,
        },
      ],

      session,
    });
  };

export const createApprovalNotification =
  async ({
    report,
    review,
    actorId,
    session,
  }) => {
    return createNotifications({
      notifications: [
        {
          recipient: report.owner,
          actor: actorId,

          type:
            NOTIFICATION_TYPES
              .REPORT_APPROVED,

          title:
            "Weekly report approved",

          message:
            review.comment ||
            "Your weekly report has been approved.",

          report: report._id,
          review: review._id,
        },
      ],

      session,
    });
  };

export const getUserNotifications =
  async ({
    currentUserId,
    page,
    limit,
    isRead,
    type,
    sortOrder,
  }) => {
    const filter = {
      recipient: currentUserId,
    };

    if (
      typeof isRead === "boolean"
    ) {
      filter.isRead = isRead;
    }

    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const sortDirection =
      sortOrder === "asc" ? 1 : -1;

    const [notifications, totalNotifications] =
      await Promise.all([
        Notification.find(filter)
          .populate(
            notificationPopulation
          )
          .sort({
            createdAt: sortDirection,
            _id: 1,
          })
          .skip(skip)
          .limit(limit),

        Notification.countDocuments(
          filter
        ),
      ]);

    const totalPages = Math.ceil(
      totalNotifications / limit
    );

    return {
      notifications,

      pagination: {
        page,
        limit,
        totalNotifications,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  };

export const getUnreadNotificationCount =
  async (currentUserId) => {
    return Notification.countDocuments({
      recipient: currentUserId,
      isRead: false,
    });
  };

export const markNotificationAsRead =
  async ({
    notificationId,
    currentUserId,
  }) => {
    const notification =
      await Notification.findOne({
        _id: notificationId,
        recipient: currentUserId,
      });

    if (!notification) {
      throw new AppError(
        "Notification not found",
        404
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    await notification.populate(
      notificationPopulation
    );

    return notification;
  };

export const markAllNotificationsAsRead =
  async (currentUserId) => {
    const result =
      await Notification.updateMany(
        {
          recipient: currentUserId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

    return {
      modifiedCount:
        result.modifiedCount,
    };
  };