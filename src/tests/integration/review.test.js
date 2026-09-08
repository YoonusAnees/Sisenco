import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject, createProjectMembership } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";
import { getReportingWeek } from "../../seed/helpers/seedDates.js";

describe("Manager Review Queue Endpoints (/api/v1/reviews)", () => {
  let admin, mgr1, mgr2, member, project1, project2, mgr1Cookie, mgr2Cookie, memberCookie;

  beforeEach(async () => {
    admin = await createAdmin();
    mgr1 = await createManager({ email: "mgr1@test.com" });
    mgr2 = await createManager({ email: "mgr2@test.com" });
    member = await createMember({ email: "member@test.com" });

    project1 = await createProject(admin, mgr1, { code: "PRJ-MGR1" });
    project2 = await createProject(admin, mgr2, { code: "PRJ-MGR2" });

    await createProjectMembership(project1, member, admin);
    await createProjectMembership(project2, member, admin);

    mgr1Cookie = getAuthCookie(mgr1);
    mgr2Cookie = getAuthCookie(mgr2);
    memberCookie = getAuthCookie(member);

    // Create and submit report for project1
    const week = getReportingWeek(-1);
    const repRes = await request(app)
      .post("/api/v1/reports")
      .set("Cookie", [memberCookie])
      .send({
        weekStart: week.weekStartStr,
        summary: "Report for review queue",
        completedTasks: [{ title: "Task 1", project: project1._id.toString(), hoursSpent: 10 }],
        hoursBreakdown: [{ project: project1._id.toString(), category: "development", hours: 10 }],
      });

    const reportId = repRes.body.data.report.id || repRes.body.data.report._id;

    await request(app)
      .post(`/api/v1/reports/${reportId}/submit`)
      .set("Cookie", [memberCookie]);
  });

  it("lists pending reports in assigned manager's review queue", async () => {
    const response = await request(app)
      .get("/api/v1/reviews/queue")
      .set("Cookie", [mgr1Cookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.reports.length).toBeGreaterThanOrEqual(1);
  });

  it("forbids normal members from accessing manager review queue", async () => {
    const response = await request(app)
      .get("/api/v1/reviews/queue")
      .set("Cookie", [memberCookie]);

    expect(response.status).toBe(403);
  });
});
