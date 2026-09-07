import {
    connectDatabase,
    disconnectDatabase,
} from "../config/database.js";

import {
    validateEnvironment,
} from "../config/environment.js";

import {
    NOTIFICATION_TYPES,
} from "../constants/constant.notification.js";

import {
    PROJECT_STATUSES,
} from "../constants/constant.projects.js";

import {
    Notification,
    ProjectMember,
    WeeklyReport,
} from "../models/index.js";

import {
    sendOverdueReportEmail,
} from "../services/workflow.email.service.js";

const getPreviousMonday = () => {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Get UTC day (0 = Sunday, 1 = Monday, ...)
    const day = date.getUTCDay();

    // Calculate days back to previous Monday
    const diffToMonday = day === 0 ? 6 : day - 1;

    // If today is Monday, previous reporting week started 7 days ago
    const daysToSubtract = diffToMonday === 0 ? 7 : diffToMonday;

    date.setUTCDate(date.getUTCDate() - daysToSubtract);
    date.setUTCHours(0, 0, 0, 0);

    return date;
};

export const runOverdueReportReminders = async () => {
    validateEnvironment();
    await connectDatabase();

    try {
        const weekStart = getPreviousMonday();
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);

        console.log(
            `Checking overdue reports for week: ${weekStart.toISOString().slice(0, 10)} to ${weekEnd.toISOString().slice(0, 10)}`
        );

        // Fetch active project memberships with populated active user & active project
        const memberships = await ProjectMember.find()
            .populate({
                path: "user",
                match: { isActive: true },
                select: "name email isActive",
            })
            .populate({
                path: "project",
                match: { status: PROJECT_STATUSES.ACTIVE },
                select: "name status",
            });

        // Filter out memberships where user or project is inactive or missing
        const activeMemberships = memberships.filter(
            (m) => m.user && m.project
        );

        let sentCount = 0;
        let skippedCount = 0;

        for (const membership of activeMemberships) {
            const user = membership.user;
            const project = membership.project;

            // Check if user has ANY report created for this week
            const reportExists = await WeeklyReport.exists({
                owner: user._id,
                weekStart,
            });

            if (reportExists) {
                skippedCount++;
                continue;
            }

            // Check if reminder was already sent for this user & week to prevent duplicate emails
            const reminderExists = await Notification.exists({
                recipient: user._id,
                type: NOTIFICATION_TYPES.SYSTEM,
                message: { $regex: weekStart.toISOString().slice(0, 10) },
            });

            if (reminderExists) {
                skippedCount++;
                continue;
            }

            // Send overdue email
            await sendOverdueReportEmail({
                member: user,
                project,
                weekEndDate: weekEnd,
            });

            // Create persistent notification record for deduplication
            await Notification.create({
                recipient: user._id,
                type: NOTIFICATION_TYPES.SYSTEM,
                title: "Overdue Weekly Report Reminder",
                message: `Reminder sent for week ending ${weekEnd.toISOString().slice(0, 10)} for project "${project.name}".`,
            });

            sentCount++;
            console.log(`Overdue reminder sent to ${user.email} for project "${project.name}"`);
        }

        console.log(
            `Overdue reminders job completed. Sent: ${sentCount}, Skipped: ${skippedCount}`
        );

        return { sentCount, skippedCount };
    } finally {
        await disconnectDatabase();
    }
};

// If run directly from terminal
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
    runOverdueReportReminders()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Overdue reminders job failed:", err);
            process.exit(1);
        });
}
