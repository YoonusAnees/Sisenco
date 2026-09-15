import request from "supertest";
import app from "../../app.js";
import { createMember, createAdmin, createInactiveUser } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";

describe("Authentication & Authorization Endpoints", () => {
  describe("GET /health", () => {
    it("returns 200 OK with healthy message", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("healthy");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("successfully registers a new user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Register",
          email: "john.register@example.com",
          password: "Password123",
          department: "Engineering",
          jobTitle: "Developer",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("john.register@example.com");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("rejects registration with duplicate email", async () => {
      await createMember({ email: "duplicate@example.com" });

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Another User",
          email: "duplicate@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("rejects weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Weak Pass",
          email: "weak@example.com",
          password: "123",
        });

      expect(response.status).toBe(400);
    });

    it("rejects role-injection attempts via strict Zod validation", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Hacker User",
          email: "hacker@example.com",
          password: "Password123",
          role: "admin",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("successfully logs in with valid credentials", async () => {
      const user = await createMember({ email: "login@example.com" });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "login@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id || response.body.data.user._id).toBeDefined();
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("rejects login with wrong password", async () => {
      await createMember({ email: "login2@example.com" });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "login2@example.com",
          password: "WrongPassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("rejects inactive user login", async () => {
      await createInactiveUser({ email: "inactive@example.com" });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "inactive@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns current authenticated user profile", async () => {
      const user = await createMember();
      const cookie = getAuthCookie(user);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", [cookie]);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it("returns 401 when unauthenticated", async () => {
      const response = await request(app).get("/api/v1/auth/me");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("clears authentication cookie", async () => {
      const user = await createMember();
      const cookie = getAuthCookie(user);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", [cookie]);

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();
    });
  });
});
