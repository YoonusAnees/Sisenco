import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";

describe("Dashboard Analytics Endpoints (/api/v1/dashboard)", () => {
  let admin, manager, member, adminCookie, managerCookie, memberCookie;

  beforeEach(async () => {
    admin = await createAdmin();
    manager = await createManager();
    member = await createMember();
    await createProject(admin, manager);

    adminCookie = getAuthCookie(admin);
    managerCookie = getAuthCookie(manager);
    memberCookie = getAuthCookie(member);
  });

  it("returns dashboard summary metrics for admin", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Cookie", [adminCookie]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("totalReports");
    expect(response.body.data).toHaveProperty("approved");
  });

  it("returns dashboard summary metrics for manager", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Cookie", [managerCookie]);

    expect(response.status).toBe(200);
  });

  it("allows member to access their own dashboard summary", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Cookie", [memberCookie]);

    expect(response.status).toBe(200);
  });
});
