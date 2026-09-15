import {
  changesRequestedEmailTemplate,
  overdueReportEmailTemplate,
  projectAssignedEmailTemplate,
  reportApprovedEmailTemplate,
  reportSubmittedEmailTemplate,
  welcomeEmailTemplate,
} from "../emails/email.templates.js";

import {
  env,
} from "../config/environment.js";

import {
  sendEmailSafely,
} from "./email.service.js";

const getReportUrl = (reportId) => {
  return `${env.clientUrl}/reports/${reportId}`;
};

export const sendWelcomeEmail = async (
  user
) => {
  const template =
    welcomeEmailTemplate({
      name: user.name,
      loginUrl:
        `${env.clientUrl}/login`,
    });

  return sendEmailSafely({
    to: {
      name: user.name,
      email: user.email,
    },

    ...template,

    tags: ["welcome"],
  });
};

export const sendReportSubmittedEmails =
  async ({
    recipients,
    report,
    owner,
    project,
    isResubmission = false,
  }) => {
    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        const template =
          reportSubmittedEmailTemplate({
            recipientName:
              recipient.name || "Reviewer",

            ownerName: owner?.name || "Team Member",

            projectName:
              project?.name || "Assigned Projects",

            weekStartDate:
              report.weekStart || report.weekStartDate,

            weekEndDate:
              report.weekEnd || report.weekEndDate,

            reportUrl:
              getReportUrl(report._id),

            isResubmission,
          });

        return sendEmailSafely({
          to: {
            name: recipient.name,
            email: recipient.email,
          },

          ...template,

          tags: [
            isResubmission
              ? "report-resubmitted"
              : "report-submitted",
          ],
        });
      })
    );

    return results;
  };

export const sendChangesRequestedEmail =
  async ({
    report,
    owner,
    manager,
    project,
    review,
  }) => {
    const template =
      changesRequestedEmailTemplate({
        ownerName: owner?.name || "Team Member",
        managerName: manager?.name || "Your Manager",
        projectName: project?.name || "Weekly Report",
        comment: review?.comment || "",
        reportUrl:
          getReportUrl(report._id),
      });

    return sendEmailSafely({
      to: {
        name: owner.name,
        email: owner.email,
      },

      ...template,

      ...(manager?.email
        ? {
            replyTo: {
              name: manager.name,
              email: manager.email,
            },
          }
        : {}),

      tags: ["changes-requested"],
    });
  };

export const sendReportApprovedEmail =
  async ({
    report,
    owner,
    manager,
    project,
    review,
  }) => {
    const template =
      reportApprovedEmailTemplate({
        ownerName: owner?.name || "Team Member",
        managerName: manager?.name || "Manager/Admin",
        projectName: project?.name || "Weekly Report",
        comment: review?.comment || "",
        reportUrl:
          getReportUrl(report._id),
      });

    return sendEmailSafely({
      to: {
        name: owner.name,
        email: owner.email,
      },

      ...template,

      tags: ["report-approved"],
    });
  };

export const sendOverdueReportEmail =
  async ({
    member,
    project,
    weekEndDate,
  }) => {
    const template =
      overdueReportEmailTemplate({
        memberName: member?.name || "Team Member",
        projectName: project?.name || "Assigned Project",
        weekEndDate,
        reportsUrl:
          `${env.clientUrl}/reports`,
      });

    return sendEmailSafely({
      to: {
        name: member.name,
        email: member.email,
      },

      ...template,

      tags: ["report-overdue"],
    });
  };

export const sendProjectAssignedEmail = async ({
  member,
  assigner,
  project,
  projectRole,
}) => {
  const projectUrl = `${env.clientUrl}/projects/${project._id}`;

  const template = projectAssignedEmailTemplate({
    memberName: member?.name || "Team Member",
    assignerName: assigner?.name || "A manager",
    projectName: project?.name || "Project",
    projectCode: project?.code || "",
    projectRole: projectRole || "member",
    projectUrl,
  });

  return sendEmailSafely({
    to: {
      name: member.name,
      email: member.email,
    },

    ...template,

    tags: ["project-assigned"],
  });
};
