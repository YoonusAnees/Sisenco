import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { validateEnvironment } from "../config/environment.js";
import { seedUsers } from "./helpers/seedUsers.js";
import { seedProjects } from "./helpers/seedProjects.js";
import { seedReports } from "./helpers/seedReports.js";
import { seedReviews } from "./helpers/seedReviews.js";
import { seedNotifications } from "./helpers/seedNotifications.js";
import mongoose from "mongoose";

/**
 * Main seeding script.
 * Executed via `npm run seed` or `node src/seed/seedDatabase.js`.
 */
export const runSeed = async () => {
  // Ensure email sending is disabled during seeding
  process.env.EMAIL_ENABLED = "false";

  try {
    validateEnvironment();
    await connectDatabase();

    const dbName = mongoose.connection.name;

    console.log("==========================================");
    console.log(`Starting Database Seeding [Target DB: ${dbName}]`);
    console.log("==========================================");

    // 1. Seed Users
    const { userMap, count: userCount } = await seedUsers();

    // 2. Seed Projects & Memberships
    const { projectMap, projectCount, memberCount } = await seedProjects(userMap);

    // 3. Seed Reports
    const { reportMap, count: reportCount } = await seedReports(userMap, projectMap);

    // 4. Seed Version History & Reviews
    const { versionCount, reviewCount } = await seedReviews(userMap, reportMap);

    // 5. Seed Notifications
    const notificationCount = await seedNotifications(userMap, reportMap);

    console.log("\nSeeding Completed Successfully!\n");
    console.table({
      "Database Name": dbName,
      "Users Created/Updated": userCount,
      "Projects Created/Updated": projectCount,
      "Memberships Created/Updated": memberCount,
      "Reports Created/Updated": reportCount,
      "Versions Created/Updated": versionCount,
      "Reviews Created/Updated": reviewCount,
      "Notifications Created/Updated": notificationCount,
      "Email Dispatches": "Disabled",
    });

    console.log("\nDemonstration Login Accounts:");
    console.log("------------------------------------------");
    console.log("  Admin:    admin@weeklyreport.test");
    console.log("  Manager:  manager.engineering@weeklyreport.test");
    console.log("  Manager:  manager.product@weeklyreport.test");
    console.log("  Member:   member.one@weeklyreport.test");
    console.log("  Member:   member.two@weeklyreport.test");
    console.log("  Inactive: inactive.member@weeklyreport.test");
    console.log("  Password: Uses SEED_USER_PASSWORD (default: Password123)\n");

  } catch (error) {
    console.error("Database Seeding Failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  runSeed();
}
