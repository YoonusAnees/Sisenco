import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject, createProjectMembership } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";
import { getReportingWeek } from "../../seed/helpers/seedDates.js";

describe("Report Version History Endpoints (/api/v1/reports/:id/versions)", () => {
  let admin, manager, owner, unrelated, project, ownerCookie, managerCookie, adminCookie, unrelatedCookie, reportId;

  beforeEach(async () => {
    admin = await createAdmin();
    manager = await createManager();
    owner = await createMember({ email: "owner@test.com" });
    unrelated = await createMember({ email: "unrelated@test.com" });

    project = await createProject(admin, manager);
    await createProjectMembership(project, owner, admin);

    ownerCookie = getAuthCookie(owner);
    managerCookie = getAuthCookie(manager);
    adminCookie = getAuthCookie(admin);
    unrelatedCookie = getAuthCookie(unrelated);

    const week = getReportingWeek(-1);
    const createRes = await request(app)
      .post("/api/v1/reports")
      .set("Cookie", [ownerCookie])
      .send({
        weekStart: week.weekStartStr,
        summary: "Version 1 Summary",
      });
    reportId = createRes.body.data.report.id || createRes.body.data.report._id;

    // Submit V1
    await request(app)
      .post(`/api/v1/reports/${reportId}/submit`)
      .set("Cookie", [ownerCookie]);
  });

  it("allows owner to list report versions", async () => {
    const response = await request(app)
      .get(`/api/v1/reports/${reportId}/versions`)
      .set("Cookie", [ownerCookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.versions.length).toBe(1);
    expect(response.body.data.versions[0].versionNumber).toBe(1);
  });

  it("allows assigned manager and admin to list report versions", async () => {
    const mgrRes = await request(app)
      .get(`/api/v1/reports/${reportId}/versions`)
      .set("Cookie", [managerCookie]);
    expect(mgrRes.status).toBe(200);

    const adminRes = await request(app)
      .get(`/api/v1/reports/${reportId}/versions`)
      .set("Cookie", [adminCookie]);
    expect(adminRes.status).toBe(200);
  });

  it("forbids unrelated user from viewing report versions", async () => {
    const response = await request(app)
      .get(`/api/v1/reports/${reportId}/versions`)
      .set("Cookie", [unrelatedCookie]);

    expect(response.status).toBe(403);
  });

  it("returns specific version snapshot by version number", async () => {
    const response = await request(app)
      .get(`/api/v1/reports/${reportId}/versions/1`)
      .set("Cookie", [ownerCookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.version.versionNumber).toBe(1);
    expect(response.body.data.version.snapshot.summary).toBe("Version 1 Summary");
  });

  it("returns 404 for non-existent version number", async () => {
    const response = await request(app)
      .get(`/api/v1/reports/${reportId}/versions/99`)
      .set("Cookie", [ownerCookie]);

    expect(response.status).toBe(404);
  });
});
