import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { validateEnvironment } from "../config/environment.js";
import Notification from "../models/model.notification.js";
import Review from "../models/model.review.js";
import ReportVersion from "../models/model.report.version.js";
import WeeklyReport from "../models/model.weekly.report.js";
import ProjectMember from "../models/model.project.member.js";
import Project from "../models/model.project.js";
import User from "../models/model.user.js";
import mongoose from "mongoose";

/**
 * Destructive database reset script.
 * Executed via `npm run seed:reset` or `node src/seed/resetDatabase.js`.
 */
export const resetDatabase = async () => {
  // Safety Rule 1: Never reset in production environment
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL ERROR: Database reset is strictly forbidden when NODE_ENV=production!");
    process.exit(1);
  }

  // Safety Rule 2: Require explicit ALLOW_DATABASE_RESET environment variable
  if (process.env.ALLOW_DATABASE_RESET !== "true") {
    console.error(
      "SAFETY BLOCK: Database reset cancelled. Set ALLOW_DATABASE_RESET=true to confirm database reset."
    );
    process.exit(1);
  }

  try {
    validateEnvironment();
    await connectDatabase();

    const dbName = mongoose.connection.name;

    // Safety Rule 3: Reject if database name contains 'production' or 'prod'
    if (dbName.toLowerCase().includes("prod")) {
      console.error(
        `CRITICAL ERROR: Database name '${dbName}' appears to be production. Reset operation aborted!`
      );
      process.exit(1);
    }

    console.log("==========================================");
    console.log(`Starting Safe Database Reset [Target DB: ${dbName}]`);
    console.log("==========================================");

    // Delete in safe dependency order
    const notificationsDeleted = await Notification.deleteMany({});
    const reviewsDeleted = await Review.deleteMany({});
    const versionsDeleted = await ReportVersion.deleteMany({});
    const reportsDeleted = await WeeklyReport.deleteMany({});
    const membersDeleted = await ProjectMember.deleteMany({});
    const projectsDeleted = await Project.deleteMany({});
    const usersDeleted = await User.deleteMany({});

    console.log("\nDatabase Cleared Successfully!\n");
    console.table({
      "Target Database": dbName,
      "Notifications Deleted": notificationsDeleted.deletedCount,
      "Reviews Deleted": reviewsDeleted.deletedCount,
      "Versions Deleted": versionsDeleted.deletedCount,
      "Reports Deleted": reportsDeleted.deletedCount,
      "Project Members Deleted": membersDeleted.deletedCount,
      "Projects Deleted": projectsDeleted.deletedCount,
      "Users Deleted": usersDeleted.deletedCount,
    });
  } catch (error) {
    console.error("Database Reset Failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  resetDatabase();
}
