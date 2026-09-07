import mongoose from "mongoose";

import {
  REPORT_STATUSES,
} from "../constants/constant.reports.js";

import {
  REVIEW_ACTIONS,
} from "../constants/constant.reviews.js";

import {
  USER_ROLES,
} from "../constants/constant.roles.js";

import {Project, ReportVersion, Review, WeeklyReport} from "../models/index.js";

import AppError from "../utils/AppError.js";

import {
  getWeeklyReportById,
} from "./report.service.js";

import {
  createApprovalNotification,
  createChangesRequestedNotification,
} from "./notification.service.js";

import {
  emitChangesRequested,
  emitReportApproved,
} from "./realtime.service.js";

import {
  sendChangesRequestedEmail,
  sendReportApprovedEmail,
} from "./workflow.email.service.js";

const queuePopulation = [
  {
    path: "owner",
    select:
      "name email role department jobTitle",
  },
  {
    path: "completedTasks.project",
    select:
      "name code category status manager",
  },
  {
    path: "nextWeekTasks.project",
    select:
      "name code category status manager",
  },
  {
    path: "blockers.project",
    select:
      "name code category status manager",
  },
  {
    path: "achievements.project",
    select:
      "name code category status manager",
  },
  {
    path: "hoursBreakdown.project",
    select:
      "name code category status manager",
  },
];

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

const verifyReviewPermission = async ({
  report,
  currentUser,
  session,
}) => {
  if (currentUser.role === USER_ROLES.ADMIN) {
    return;
  }

  if (
    currentUser.role !== USER_ROLES.MANAGER
  ) {
    throw new AppError(
      "Only managers and admins can review reports",
      403
    );
  }

  const projectIds =
    collectReportProjectIds(report);

  if (projectIds.length === 0) {
    throw new AppError(
      "This report is not connected to a managed project",
      403
    );
  }

  const query = Project.exists({
    _id: {
      $in: projectIds,
    },
    manager: currentUser.id,
  });

  if (session) {
    query.session(session);
  }

  const managedProjectExists =
    await query;

  if (!managedProjectExists) {
    throw new AppError(
      "You can only review reports for projects you manage",
      403
    );
  }
};

const findCurrentVersion = async ({
  report,
  session,
}) => {
  if (!report.currentVersion) {
    throw new AppError(
      "The submitted report does not have a saved version",
      409
    );
  }

  const versionQuery =
    ReportVersion.findOne({
      report: report._id,
      versionNumber:
        report.currentVersion,
    });

  if (session) {
    versionQuery.session(session);
  }

  const version = await versionQuery;

  if (!version) {
    throw new AppError(
      "The submitted report version was not found",
      409
    );
  }

  return version;
};

export const getManagerReviewQueue = async ({
  queryData,
  currentUser,
}) => {
  const {
    page,
    limit,
    ownerId,
    projectId,
    sortOrder,
  } = queryData;

  const filter = {
    status: REPORT_STATUSES.SUBMITTED,
  };

  if (ownerId) {
    filter.owner = ownerId;
  }

  const projectPaths = [
    "completedTasks.project",
    "nextWeekTasks.project",
    "blockers.project",
    "achievements.project",
    "hoursBreakdown.project",
  ];

  if (currentUser.role === USER_ROLES.MANAGER) {
    const managedProjects =
      await Project.find({
        manager: currentUser.id,
      }).distinct("_id");

    if (managedProjects.length === 0) {
      return {
        reports: [],

        pagination: {
          page,
          limit,
          totalReports: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    filter.$or = projectPaths.map((path) => ({
      [path]: {
        $in: managedProjects,
      },
    }));
  }

  if (projectId) {
    /*
     * If a manager supplies projectId, verify
     * that they manage the selected project.
     */
    if (
      currentUser.role === USER_ROLES.MANAGER
    ) {
      const managesSelectedProject =
        await Project.exists({
          _id: projectId,
          manager: currentUser.id,
        });

      if (!managesSelectedProject) {
        throw new AppError(
          "You do not manage the selected project",
          403
        );
      }
    }

    const projectConditions =
      projectPaths.map((path) => ({
        [path]: projectId,
      }));

    if (filter.$or) {
      filter.$and = [
        {
          $or: filter.$or,
        },
        {
          $or: projectConditions,
        },
      ];

      delete filter.$or;
    } else {
      filter.$or = projectConditions;
    }
  }

  const skip = (page - 1) * limit;

  const sortDirection =
    sortOrder === "asc" ? 1 : -1;

  const [reports, totalReports] =
    await Promise.all([
      WeeklyReport.find(filter)
        .populate(queuePopulation)
        .sort({
          submittedAt: sortDirection,
          _id: 1,
        })
        .skip(skip)
        .limit(limit),

      WeeklyReport.countDocuments(filter),
    ]);

  const totalPages = Math.ceil(
    totalReports / limit
  );

  return {
    reports,

    pagination: {
      page,
      limit,
      totalReports,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const requestReportChanges = async ({
  reportId,
  comment,
  currentUser,
}) => {
  const session =
    await mongoose.startSession();

  let updatedReport;
  let createdReview;

  try {
    await session.withTransaction(
      async () => {
        const report =
          await WeeklyReport.findById(
            reportId
          ).session(session);

        if (!report) {
          throw new AppError(
            "Weekly report not found",
            404
          );
        }

        if (
          report.status !==
          REPORT_STATUSES.SUBMITTED
        ) {
          throw new AppError(
            "Only submitted reports can be reviewed",
            400
          );
        }

        await verifyReviewPermission({
          report,
          currentUser,
          session,
        });

        const version =
          await findCurrentVersion({
            report,
            session,
          });

        const reviewedAt = new Date();

        const [review] =
          await Review.create(
            [
              {
                report: report._id,
                version: version._id,
                versionNumber:
                  version.versionNumber,
                reviewer: currentUser.id,
                action:
                  REVIEW_ACTIONS
                    .CHANGES_REQUESTED,
                comment,
                reviewedAt,
              },
            ],
            {
              session,
            }
          );

        report.status =
          REPORT_STATUSES
            .NEEDS_CORRECTION;

        report.approvedAt = null;
        report.updatedBy = currentUser.id;

        await report.save({
          session,
        });

        /*
         * Notify the report owner that changes
         * have been requested.
         */
        await createChangesRequestedNotification({
          report,
          review,
          actorId: currentUser.id,
          session,
        });

        createdReview = review;
        updatedReport = report;
      }
    );
  } finally {
    await session.endSession();
  }

  await Promise.all([
    updatedReport.populate(
      queuePopulation
    ),

    createdReview.populate([
      {
        path: "reviewer",
        select: "name email role",
      },
      {
        path: "version",
        select:
          "versionNumber submittedAt sourceStatus",
      },
    ]),
  ]);

  emitChangesRequested({
    report: updatedReport,
    ownerId: updatedReport.owner,
    review: createdReview,
  });

  const primaryProject =
    updatedReport.completedTasks?.[0]?.project ||
    updatedReport.nextWeekTasks?.[0]?.project ||
    updatedReport.blockers?.[0]?.project ||
    updatedReport.hoursBreakdown?.[0]?.project ||
    null;

  sendChangesRequestedEmail({
    report: updatedReport,
    owner: updatedReport.owner,
    manager: createdReview.reviewer,
    project: primaryProject,
    review: createdReview,
  });

  return {
    report: updatedReport,
    review: createdReview,
  };
};

export const approveReport = async ({
  reportId,
  comment,
  currentUser,
}) => {
  const session =
    await mongoose.startSession();

  let updatedReport;
  let createdReview;

  try {
    await session.withTransaction(
      async () => {
        const report =
          await WeeklyReport.findById(
            reportId
          ).session(session);

        if (!report) {
          throw new AppError(
            "Weekly report not found",
            404
          );
        }

        if (
          report.status !==
          REPORT_STATUSES.SUBMITTED
        ) {
          throw new AppError(
            "Only submitted reports can be approved",
            400
          );
        }

        await verifyReviewPermission({
          report,
          currentUser,
          session,
        });

        const version =
          await findCurrentVersion({
            report,
            session,
          });

        const reviewedAt = new Date();

        const [review] =
          await Review.create(
            [
              {
                report: report._id,
                version: version._id,
                versionNumber:
                  version.versionNumber,
                reviewer: currentUser.id,
                action:
                  REVIEW_ACTIONS.APPROVED,
                comment,
                reviewedAt,
              },
            ],
            {
              session,
            }
          );

        report.status =
          REPORT_STATUSES.APPROVED;

        report.approvedAt = reviewedAt;
        report.updatedBy = currentUser.id;

        await report.save({
          session,
        });
        
        await createApprovalNotification({
          report,
          review,
          actorId: currentUser.id,
          session,
        });

        createdReview = review;
        updatedReport = report;
      }
    );
  } finally {
    await session.endSession();
  }

  await Promise.all([
    updatedReport.populate(
      queuePopulation
    ),

    createdReview.populate([
      {
        path: "reviewer",
        select: "name email role",
      },
      {
        path: "version",
        select:
          "versionNumber submittedAt sourceStatus",
      },
    ]),
  ]);

  emitReportApproved({
    report: updatedReport,
    ownerId: updatedReport.owner,
    review: createdReview,
  });

  const primaryProject =
    updatedReport.completedTasks?.[0]?.project ||
    updatedReport.nextWeekTasks?.[0]?.project ||
    updatedReport.blockers?.[0]?.project ||
    updatedReport.hoursBreakdown?.[0]?.project ||
    null;

  sendReportApprovedEmail({
    report: updatedReport,
    owner: updatedReport.owner,
    manager: createdReview.reviewer,
    project: primaryProject,
    review: createdReview,
  });

  return {
    report: updatedReport,
    review: createdReview,
  };
};

export const getReportReviewHistory = async ({
  reportId,
  page,
  limit,
  currentUser,
}) => {
  /*
   * Reuse existing report viewing permission:
   * owner, assigned manager or admin.
   */
  await getWeeklyReportById({
    reportId,
    currentUser,
  });

  const skip = (page - 1) * limit;

  const filter = {
    report: reportId,
  };

  const [history, totalReviews] =
    await Promise.all([
      Review.find(filter)
        .populate({
          path: "reviewer",
          select:
            "name email role department jobTitle",
        })
        .populate({
          path: "version",
          select:
            "versionNumber sourceStatus submittedAt",
        })
        .sort({
          reviewedAt: 1,
          _id: 1,
        })
        .skip(skip)
        .limit(limit),

      Review.countDocuments(filter),
    ]);

  const totalPages = Math.ceil(
    totalReviews / limit
  );

  return {
    history,

    pagination: {
      page,
      limit,
      totalReviews,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};