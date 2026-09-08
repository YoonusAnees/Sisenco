import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";

describe("User Management Endpoints (/api/v1/users)", () => {
  let admin, manager, member, adminCookie, managerCookie, memberCookie;

  beforeEach(async () => {
    admin = await createAdmin({ email: "admin@test.com" });
    manager = await createManager({ email: "manager@test.com" });
    member = await createMember({ email: "member@test.com" });

    adminCookie = getAuthCookie(admin);
    managerCookie = getAuthCookie(manager);
    memberCookie = getAuthCookie(member);
  });

  describe("GET /api/v1/users", () => {
    it("allows admin to list users with pagination and search", async () => {
      const response = await request(app)
        .get("/api/v1/users?page=1&limit=10&search=member")
        .set("Cookie", [adminCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it("allows manager to list users", async () => {
      const response = await request(app)
        .get("/api/v1/users")
        .set("Cookie", [managerCookie]);

      expect(response.status).toBe(200);
    });

    it("forbids normal member from listing users", async () => {
      const response = await request(app)
        .get("/api/v1/users")
        .set("Cookie", [memberCookie]);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/v1/users", () => {
    it("allows admin to create a new user with specific role", async () => {
      const response = await request(app)
        .post("/api/v1/users")
        .set("Cookie", [adminCookie])
        .send({
          name: "Created Manager",
          email: "created.mgr@test.com",
          password: "Password123",
          role: "manager",
          department: "Engineering",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe("manager");
    });
  });

  describe("PATCH /api/v1/users/:id/role", () => {
    it("allows admin to update user role", async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${member._id}/role`)
        .set("Cookie", [adminCookie])
        .send({ role: "manager" });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe("manager");
    });

    it("prevents demoting the last active admin", async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${admin._id}/role`)
        .set("Cookie", [adminCookie])
        .send({ role: "member" });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/users/:id/status", () => {
    it("allows admin to deactivate a member", async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${member._id}/status`)
        .set("Cookie", [adminCookie])
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.user.isActive).toBe(false);
    });

    it("prevents admin from deactivating themselves if last active admin", async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${admin._id}/status`)
        .set("Cookie", [adminCookie])
        .send({ isActive: false });

      expect(response.status).toBe(400);
    });
  });
});
