import emailLayout from "./email.layout.js";

import {
    escapeHtml,
    formatEmailDate,
} from "../utils/emailHelpers.js";

export const welcomeEmailTemplate = ({
    name,
    loginUrl,
}) => {
    return {
        subject:
            "Welcome to the Sisenco Weekly Report System",

        htmlContent: emailLayout({
            previewText:
                "Your Weekly Report account is ready",

            heading: "Welcome!",

            body: `
        <p>Hello ${escapeHtml(name)},</p>

        <p>
          Your account for the Weekly Report
          System has been created successfully.
        </p>

        <p>
          You can now sign in, view your assigned
          projects and prepare your weekly reports.
        </p>
      `,

            actionText: "Sign in",
            actionUrl: loginUrl,
        }),
    };
};

export const reportSubmittedEmailTemplate =
    ({
        recipientName,
        ownerName,
        projectName,
        weekStartDate,
        weekEndDate,
        reportUrl,
        isResubmission = false,
    }) => {
        const actionText = isResubmission
            ? "resubmitted"
            : "submitted";

        return {
            subject: isResubmission
                ? `Corrected report resubmitted by ${ownerName}`
                : `New weekly report submitted by ${ownerName}`,

            htmlContent: emailLayout({
                previewText:
                    `A weekly report has been ${actionText}`,

                heading: isResubmission
                    ? "Corrected report resubmitted"
                    : "New report submitted",

                body: `
          <p>
            Hello ${escapeHtml(recipientName)},
          </p>

          <p>
            <strong>${escapeHtml(ownerName)}</strong>
            has ${actionText} a weekly report.
          </p>

          <p>
            <strong>Project:</strong>
            ${escapeHtml(projectName)}
            <br />

            <strong>Reporting period:</strong>
            ${formatEmailDate(weekStartDate)}
            –
            ${formatEmailDate(weekEndDate)}
          </p>

          <p>
            Please open the report and complete
            the required review.
          </p>
        `,

                actionText: "Review report",
                actionUrl: reportUrl,
            }),
        };
    };

export const changesRequestedEmailTemplate =
    ({
        ownerName,
        managerName,
        projectName,
        comment,
        reportUrl,
    }) => {
        return {
            subject:
                "Changes requested for your weekly report",

            htmlContent: emailLayout({
                previewText:
                    "Your manager requested changes",

                heading: "Report changes requested",

                body: `
          <p>Hello ${escapeHtml(ownerName)},</p>

          <p>
            ${escapeHtml(managerName)} requested
            changes to your weekly report for
            <strong>${escapeHtml(
                    projectName
                )}</strong>.
          </p>

          <p>
            <strong>Manager comment:</strong>
          </p>

          <div
            style="
              padding: 14px;
              border-left: 4px solid #541A1A;
              background-color: #f8f4f4;
              border-radius: 4px;
            "
          >
            ${escapeHtml(comment)}
          </div>

          <p>
            Update the report and resubmit it
            when the corrections are complete.
          </p>
        `,

                actionText: "Correct report",
                actionUrl: reportUrl,
            }),
        };
    };

export const reportApprovedEmailTemplate =
    ({
        ownerName,
        managerName,
        projectName,
        comment,
        reportUrl,
    }) => {
        return {
            subject:
                "Your weekly report has been approved",

            htmlContent: emailLayout({
                previewText:
                    "Your weekly report was approved",

                heading: "Report approved",

                body: `
          <p>Hello ${escapeHtml(ownerName)},</p>

          <p>
            Your weekly report for
            <strong>${escapeHtml(
                    projectName
                )}</strong>
            has been approved by
            ${escapeHtml(managerName)}.
          </p>

          ${comment
                        ? `
                <p>
                  <strong>Approval comment:</strong>
                </p>

                <div
                  style="
                    padding: 14px;
                    background-color: #f1f8f3;
                    border-left: 4px solid #238636;
                    border-radius: 4px;
                  "
                >
                  ${escapeHtml(comment)}
                </div>
              `
                        : ""
                    }

          <p>
            The approved report is now read-only.
          </p>
        `,

                actionText: "View report",
                actionUrl: reportUrl,
            }),
        };
    };

export const overdueReportEmailTemplate = ({
    memberName,
    projectName,
    weekEndDate,
    reportsUrl,
}) => {
    return {
        subject:
            "Weekly report submission overdue",

        htmlContent: emailLayout({
            previewText:
                "Your weekly report is overdue",

            heading: "Weekly report overdue",

            body: `
        <p>Hello ${escapeHtml(memberName)},</p>

        <p>
          Your weekly report for
          <strong>${escapeHtml(
                projectName
            )}</strong>
          has not been submitted.
        </p>

        <p>
          <strong>Reporting week ended:</strong>
          ${formatEmailDate(weekEndDate)}
        </p>

        <p>
          Please prepare and submit the report
          as soon as possible.
        </p>
      `,

            actionText: "Create report",
            actionUrl: reportsUrl,
        }),
    };
};

export const projectAssignedEmailTemplate = ({
    memberName,
    assignerName,
    projectName,
    projectCode,
    projectRole,
    projectUrl,
}) => {
    return {
        subject: `You have been assigned to project: ${projectName}`,

        htmlContent: emailLayout({
            previewText:
                `You have been added to the ${projectName} project`,

            heading: "Project Assignment",

            body: `
        <p>Hello ${escapeHtml(memberName)},</p>

        <p>
          You have been assigned to a project by
          <strong>${escapeHtml(assignerName)}</strong>.
        </p>

        <p>
          <strong>Project:</strong>
          ${escapeHtml(projectName)}
          (${escapeHtml(projectCode)})
          <br />

          <strong>Your role:</strong>
          ${escapeHtml(projectRole)}
        </p>

        <p>
          You can now submit weekly reports for this project.
          Please head to the project page to get started.
        </p>
      `,

            actionText: "View project",
            actionUrl: projectUrl,
        }),
    };
};