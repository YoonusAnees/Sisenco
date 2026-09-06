import {
  REPORT_STATUSES,
} from "../constants/constant.reports.js";

import {
  USER_ROLES,
} from "../constants/constant.roles.js";

import {Project} from "../models/index.js";
import {WeeklyReport} from "../models/index.js";
import {ReportVersion} from "../models/index.js";
import AppError from "../utils/AppError.js";

const workflowPopulation = [
  {
    path: "owner",
    select:
      "name email role department jobTitle isActive",
  },
  {
    path: "createdBy",
    select: "name email role",
  },
  {
    path: "updatedBy",
    select: "name email role",
  },
  {
    path: "approvedBy",
    select: "name email role",
  },
  {
    path: "correctionRequestedBy",
    select: "name email role",
  },
  {
    path: "completedTasks.project",
    select: "name code category status manager",
  },
  {
    path: "nextWeekTasks.project",
    select: "name code category status manager",
  },
  {
    path: "blockers.project",
    select: "name code category status manager",
  },
  {
    path: "achievements.project",
    select: "name code category status manager",
  },
  {
    path: "hoursBreakdown.project",
    select: "name code category status manager",
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
      if (!entry.project) {
        return;
      }

      const projectId =
        entry.project._id?.toString() ||
        entry.project.toString();

      projectIds.add(projectId);
    });
  });

  return [...projectIds];
};

const ensureReportIsComplete = (report) => {
  if (!report.summary?.trim()) {
    throw new AppError(
      "A report summary is required before submission",
      400
    );
  }

  const hasReportContent =
    report.completedTasks.length > 0 ||
    report.nextWeekTasks.length > 0 ||
    report.blockers.length > 0 ||
    report.achievements.length > 0;

  if (!hasReportContent) {
    throw new AppError(
      "Add at least one task, blocker or achievement before submission",
      400
    );
  }

  if (report.hoursBreakdown.length === 0) {
    throw new AppError(
      "An hours breakdown is required before submission",
      400
    );
  }
};

const ensureReviewerPermission = async ({
  report,
  currentUser,
}) => {
  if (currentUser.role === USER_ROLES.ADMIN) {
    return;
  }

  if (currentUser.role !== USER_ROLES.MANAGER) {
    throw new AppError(
      "Only a project manager or administrator can review reports",
      403
    );
  }

  const projectIds =
    collectReportProjectIds(report);

  if (projectIds.length === 0) {
    throw new AppError(
      "This report does not contain a reviewable project",
      400
    );
  }

  /*
   * Find every project referenced by the report.
   */
  const projects = await Project.find({
    _id: {
      $in: projectIds,
    },
  }).select("_id manager");

  if (projects.length !== projectIds.length) {
    throw new AppError(
      "One or more report projects no longer exist",
      400
    );
  }

  /*
   * The manager must manage every project
   * referenced in this report.
   *
   * Admins are not affected by this restriction.
   */
  const unauthorisedProject =
    projects.find((project) => {
      return (
        project.manager?.toString() !==
        currentUser.id.toString()
      );
    });

  if (unauthorisedProject) {
    throw new AppError(
      "You cannot review a report containing projects you do not manage",
      403
    );
  }
};

export const submitWeeklyReport = async ({
  reportId,
  currentUser,
}) => {
  const session =
    await mongoose.startSession();

  let submittedReport;

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
          report.owner.toString() !==
          currentUser.id.toString()
        ) {
          throw new AppError(
            "You can only submit your own report",
            403
          );
        }

        const allowedStatuses = [
          REPORT_STATUSES.DRAFT,
          REPORT_STATUSES.NEEDS_CORRECTION,
        ];

        if (
          !allowedStatuses.includes(
            report.status
          )
        ) {
          throw new AppError(
            "Only draft or corrected reports can be submitted",
            400
          );
        }

        /*
         * Prevent empty weekly reports from
         * being submitted.
         */
        const hasReportContent =
          report.summary ||
          report.completedTasks.length > 0 ||
          report.nextWeekTasks.length > 0 ||
          report.blockers.length > 0 ||
          report.achievements.length > 0 ||
          report.hoursBreakdown.length > 0;

        if (!hasReportContent) {
          throw new AppError(
            "An empty weekly report cannot be submitted",
            400
          );
        }

        const sourceStatus = report.status;

        const nextVersion =
          (report.currentVersion || 0) + 1;

        const submittedAt = new Date();

        /*
         * Change the main report state.
         */
        report.status =
          REPORT_STATUSES.SUBMITTED;

        report.currentVersion =
          nextVersion;

        report.submittedAt =
          submittedAt;

        /*
         * A corrected resubmission must clear
         * the old approval information.
         */
        report.approvedAt = null;
        report.updatedBy = currentUser.id;

        await report.save({
          session,
        });

        /*
         * Convert the report into an independent
         * plain object for historical storage.
         */
        const snapshot = report.toObject({
          depopulate: true,
          virtuals: false,
          versionKey: false,
        });

        delete snapshot._id;

        await ReportVersion.create(
          [
            {
              report: report._id,
              owner: report.owner,
              versionNumber:
                nextVersion,
              sourceStatus,
              snapshot,
              submittedBy:
                currentUser.id,
              submittedAt,
            },
          ],
          {
            session,
          }
        );

        submittedReport = report;
      }
    );
  } finally {
    await session.endSession();
  }

  await submittedReport.populate([
    {
      path: "owner",
      select:
        "name email role department jobTitle",
    },
    {
      path: "completedTasks.project",
      select: "name code category status",
    },
    {
      path: "nextWeekTasks.project",
      select: "name code category status",
    },
    {
      path: "blockers.project",
      select: "name code category status",
    },
    {
      path: "achievements.project",
      select: "name code category status",
    },
    {
      path: "hoursBreakdown.project",
      select: "name code category status",
    },
  ]);

  return submittedReport;
};

export const requestReportCorrection =
  async ({
    reportId,
    correctionNote,
    currentUser,
  }) => {
    const report =
      await WeeklyReport.findById(reportId);

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
        "Only submitted reports can be returned for correction",
        400
      );
    }

    await ensureReviewerPermission({
      report,
      currentUser,
    });

    report.status =
      REPORT_STATUSES.NEEDS_CORRECTION;

    report.latestCorrectionNote =
      correctionNote;

    report.correctionRequestedAt =
      new Date();

    report.correctionRequestedBy =
      currentUser.id;

    report.updatedBy = currentUser.id;

    await report.save();

    await report.populate(
      workflowPopulation
    );

    return report;
  };

export const approveWeeklyReport = async ({
  reportId,
  currentUser,
}) => {
  const report = await WeeklyReport.findById(
    reportId
  );

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

  await ensureReviewerPermission({
    report,
    currentUser,
  });

  report.status =
    REPORT_STATUSES.APPROVED;

  report.approvedAt = new Date();
  report.approvedBy = currentUser.id;
  report.updatedBy = currentUser.id;

  await report.save();

  await report.populate(workflowPopulation);

  return report;
};