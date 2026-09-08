import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";

describe("Project Management Endpoints (/api/v1/projects)", () => {
  let admin, manager, member, adminCookie, managerCookie, memberCookie;

  beforeEach(async () => {
    admin = await createAdmin();
    manager = await createManager();
    member = await createMember();

    adminCookie = getAuthCookie(admin);
    managerCookie = getAuthCookie(manager);
    memberCookie = getAuthCookie(member);
  });

  describe("POST /api/v1/projects", () => {
    it("allows admin to create a new project", async () => {
      const response = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [adminCookie])
        .send({
          name: "New Portal",
          code: "NEW-PORTAL",
          description: "Description",
          category: "development",
          managerId: manager._id.toString(),
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.project.code).toBe("NEW-PORTAL");
    });

    it("rejects duplicate project code", async () => {
      await createProject(admin, manager, { code: "DUP-CODE" });

      const response = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [adminCookie])
        .send({
          name: "Another Project",
          code: "DUP-CODE",
        });

      expect(response.status).toBe(409);
    });

    it("rejects invalid date range (endDate before startDate)", async () => {
      const response = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [adminCookie])
        .send({
          name: "Invalid Dates",
          code: "BAD-DATES",
          startDate: "2026-12-31",
          endDate: "2026-01-01",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/projects/:id/members", () => {
    it("allows manager/admin to assign member to project", async () => {
      const project = await createProject(admin, manager);

      const response = await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set("Cookie", [adminCookie])
        .send({
          userId: member._id.toString(),
          projectRole: "member",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.membership.user.id || response.body.data.membership.user._id).toBe(member._id.toString());
    });

    it("rejects assigning the same member twice", async () => {
      const project = await createProject(admin, manager);

      await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set("Cookie", [adminCookie])
        .send({ userId: member._id.toString() });

      const response = await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set("Cookie", [adminCookie])
        .send({ userId: member._id.toString() });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /api/v1/projects/:id/members/:userId", () => {
    it("allows admin/manager to remove member from project", async () => {
      const project = await createProject(admin, manager);

      await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set("Cookie", [adminCookie])
        .send({ userId: member._id.toString() });

      const response = await request(app)
        .delete(`/api/v1/projects/${project._id}/members/${member._id}`)
        .set("Cookie", [adminCookie]);

      expect(response.status).toBe(200);
    });
  });
});
