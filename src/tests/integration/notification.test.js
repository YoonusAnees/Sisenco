import request from "supertest";
import app from "../../app.js";
import { createMember, createNotification } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";

describe("Persistent Notification Endpoints (/api/v1/notifications)", () => {
  let user1, user2, cookie1, cookie2;

  beforeEach(async () => {
    user1 = await createMember({ email: "user1@test.com" });
    user2 = await createMember({ email: "user2@test.com" });
    cookie1 = getAuthCookie(user1);
    cookie2 = getAuthCookie(user2);
  });

  it("lists notifications for authenticated user only", async () => {
    await createNotification(user1, "system", { title: "User 1 Notif" });
    await createNotification(user2, "system", { title: "User 2 Notif" });

    const response = await request(app)
      .get("/api/v1/notifications")
      .set("Cookie", [cookie1]);

    expect(response.status).toBe(200);
    expect(response.body.data.notifications.length).toBe(1);
    expect(response.body.data.notifications[0].title).toBe("User 1 Notif");
  });

  it("returns unread notification count", async () => {
    await createNotification(user1, "system", { isRead: false });
    await createNotification(user1, "system", { isRead: false });
    await createNotification(user1, "system", { isRead: true });

    const response = await request(app)
      .get("/api/v1/notifications/unread-count")
      .set("Cookie", [cookie1]);

    expect(response.status).toBe(200);
    expect(response.body.data.unreadCount).toBe(2);
  });

  it("marks a single notification as read", async () => {
    const notif = await createNotification(user1, "system", { isRead: false });

    const response = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set("Cookie", [cookie1]);

    expect(response.status).toBe(200);
    expect(response.body.data.notification.isRead).toBe(true);
    expect(response.body.data.notification.readAt).toBeDefined();
  });

  it("marks all notifications as read", async () => {
    await createNotification(user1, "system", { isRead: false });
    await createNotification(user1, "system", { isRead: false });

    const response = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Cookie", [cookie1]);

    expect(response.status).toBe(200);
    expect(response.body.data.updatedCount).toBe(2);
  });

  it("forbids user from marking another user's notification as read", async () => {
    const notif = await createNotification(user2, "system", { isRead: false });

    const response = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set("Cookie", [cookie1]);

    expect(response.status).toBe(404);
  });
});
