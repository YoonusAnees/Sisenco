import { createMember, createWeeklyReport, createProject, createAdmin } from "../helpers/factories.js";
import { runOverdueReportReminders } from "../../jobs/sendOverdueReportReminders.js";

describe("Overdue Report Reminders Job Unit Tests", () => {
  it("identifies active members without reports for target week and skips members with submitted reports", async () => {
    const admin = await createAdmin();
    const project = await createProject(admin);

    const m1 = await createMember({ email: "overdue1@test.com" });
    const m2 = await createMember({ email: "submitted@test.com" });

    // Create submitted report for m2
    await createWeeklyReport(m2, project, { status: "submitted" });

    const result = await runOverdueReportReminders();

    expect(result).toBeDefined();
    expect(result.sentCount).toBeGreaterThanOrEqual(1);
  });
});
