import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject, createProjectMembership } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";
import { getReportingWeek } from "../../seed/helpers/seedDates.js";

describe("Weekly Report Endpoints (/api/v1/reports)", () => {
  let admin, manager, member1, member2, project, member1Cookie, member2Cookie;

  beforeEach(async () => {
    admin = await createAdmin();
    manager = await createManager();
    member1 = await createMember({ email: "m1@test.com" });
    member2 = await createMember({ email: "m2@test.com" });

    project = await createProject(admin, manager);
    await createProjectMembership(project, member1, admin);

    member1Cookie = getAuthCookie(member1);
    member2Cookie = getAuthCookie(member2);
  });

  describe("POST /api/v1/reports", () => {
    it("creates a valid draft weekly report for assigned project member", async () => {
      const week = getReportingWeek(0);

      const response = await request(app)
        .post("/api/v1/reports")
        .set("Cookie", [member1Cookie])
        .send({
          weekStart: week.weekStartStr,
          summary: "Draft report summary",
          completedTasks: [
            {
              title: "Task 1",
              description: "Desc 1",
              project: project._id.toString(),
              hoursSpent: 8,
            },
          ],
          hoursBreakdown: [
            {
              project: project._id.toString(),
              category: "development",
              hours: 8,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.report.status).toBe("draft");
      expect(response.body.data.report.totalHours).toBe(8);
    });

    it("rejects report creation if member is not assigned to the project", async () => {
      const week = getReportingWeek(0);

      const response = await request(app)
        .post("/api/v1/reports")
        .set("Cookie", [member2Cookie])
        .send({
          weekStart: week.weekStartStr,
          summary: "Unassigned draft",
          completedTasks: [
            {
              title: "Task 1",
              project: project._id.toString(),
              hoursSpent: 5,
            },
          ],
          hoursBreakdown: [
            {
              project: project._id.toString(),
              category: "development",
              hours: 5,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it("rejects creation if total hours exceed 168", async () => {
      const week = getReportingWeek(0);

      const response = await request(app)
        .post("/api/v1/reports")
        .set("Cookie", [member1Cookie])
        .send({
          weekStart: week.weekStartStr,
          hoursBreakdown: [
            {
              project: project._id.toString(),
              category: "development",
              hours: 170,
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/reports/:id", () => {
    it("allows owner to view their report", async () => {
      const week = getReportingWeek(0);
      const resCreate = await request(app)
        .post("/api/v1/reports")
        .set("Cookie", [member1Cookie])
        .send({
          weekStart: week.weekStartStr,
          summary: "Owner Report",
        });

      const reportId = resCreate.body.data.report.id || resCreate.body.data.report._id;

      const response = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set("Cookie", [member1Cookie]);

      expect(response.status).toBe(200);
      expect(response.body.data.report.summary).toBe("Owner Report");
    });

    it("forbids non-owner member from viewing another member's private draft", async () => {
      const week = getReportingWeek(0);
      const resCreate = await request(app)
        .post("/api/v1/reports")
        .set("Cookie", [member1Cookie])
        .send({
          weekStart: week.weekStartStr,
          summary: "Private Draft",
        });

      const reportId = resCreate.body.data.report.id || resCreate.body.data.report._id;

      const response = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set("Cookie", [member2Cookie]);

      expect(response.status).toBe(403);
    });
  });
});
