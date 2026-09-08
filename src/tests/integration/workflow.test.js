import request from "supertest";
import app from "../../app.js";
import { createAdmin, createManager, createMember, createProject, createProjectMembership } from "../helpers/factories.js";
import { getAuthCookie } from "../helpers/authHelper.js";
import { getReportingWeek } from "../../seed/helpers/seedDates.js";

describe("Report Workflow Transitions (/api/v1/reports/:id/submit & reviews)", () => {
  let admin, manager, member, project, memberCookie, managerCookie;

  beforeEach(async () => {
    admin = await createAdmin();
    manager = await createManager();
    member = await createMember();
    project = await createProject(admin, manager);
    await createProjectMembership(project, member, admin);

    memberCookie = getAuthCookie(member);
    managerCookie = getAuthCookie(manager);
  });

  it("executes complete lifecycle: draft -> submit -> request changes -> resubmit -> approve", async () => {
    const week = getReportingWeek(-1);

    // 1. Create Draft
    const createRes = await request(app)
      .post("/api/v1/reports")
      .set("Cookie", [memberCookie])
      .send({
        weekStart: week.weekStartStr,
        summary: "Initial Draft v1",
        completedTasks: [{ title: "Task 1", project: project._id.toString(), hoursSpent: 5 }],
        hoursBreakdown: [{ project: project._id.toString(), category: "development", hours: 5 }],
      });
    const reportId = createRes.body.data.report.id || createRes.body.data.report._id;
    expect(createRes.body.data.report.status).toBe("draft");

    // 2. Submit Draft (V1)
    const submitRes1 = await request(app)
      .post(`/api/v1/reports/${reportId}/submit`)
      .set("Cookie", [memberCookie]);
    expect(submitRes1.status).toBe(200);
    expect(submitRes1.body.data.report.status).toBe("submitted");
    expect(submitRes1.body.data.report.currentVersion).toBe(1);

    // 3. Manager Requests Corrections on V1
    const reviewRes1 = await request(app)
      .post(`/api/v1/reports/${reportId}/request-correction`)
      .set("Cookie", [managerCookie])
      .send({
        correctionNote: "Please add description to Task 1",
      });
    expect(reviewRes1.status).toBe(200);
    expect(reviewRes1.body.data.report.status).toBe("needs_correction");

    // 4. Owner updates report in needs_correction state
    const updateRes = await request(app)
      .put(`/api/v1/reports/${reportId}`)
      .set("Cookie", [memberCookie])
      .send({
        summary: "Corrected Summary v2",
        completedTasks: [{ title: "Task 1", description: "Detailed description added", project: project._id.toString(), hoursSpent: 5 }],
        hoursBreakdown: [{ project: project._id.toString(), category: "development", hours: 5 }],
      });
    expect(updateRes.status).toBe(200);

    // 5. Owner Resubmits (V2)
    const submitRes2 = await request(app)
      .post(`/api/v1/reports/${reportId}/submit`)
      .set("Cookie", [memberCookie]);
    expect(submitRes2.status).toBe(200);
    expect(submitRes2.body.data.report.status).toBe("submitted");
    expect(submitRes2.body.data.report.currentVersion).toBe(2);

    // 6. Manager Approves V2
    const reviewRes2 = await request(app)
      .post(`/api/v1/reports/${reportId}/approve`)
      .set("Cookie", [managerCookie]);
    expect(reviewRes2.status).toBe(200);
    expect(reviewRes2.body.data.report.status).toBe("approved");

    // 7. Verify Approved Report is Permanently Read-Only
    const editApproved = await request(app)
      .put(`/api/v1/reports/${reportId}`)
      .set("Cookie", [memberCookie])
      .send({ summary: "Try to edit approved" });
    expect(editApproved.status).toBe(400);

    // 8. Verify Approved Report Cannot Be Resubmitted
    const resubmitApproved = await request(app)
      .post(`/api/v1/reports/${reportId}/submit`)
      .set("Cookie", [memberCookie]);
    expect(resubmitApproved.status).toBe(400);
  });
});
