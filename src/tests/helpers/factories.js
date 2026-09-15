import User from "../../models/model.user.js";
import Project from "../../models/model.project.js";
import ProjectMember from "../../models/model.project.member.js";
import WeeklyReport from "../../models/model.weekly.report.js";
import ReportVersion from "../../models/model.report.version.js";
import Review from "../../models/model.review.js";
import Notification from "../../models/model.notification.js";
import { USER_ROLES } from "../../constants/constant.roles.js";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, PROJECT_MEMBER_ROLES } from "../../constants/constant.projects.js";
import { REPORT_STATUSES, HOURS_CATEGORIES, TASK_PRIORITIES } from "../../constants/constant.reports.js";
import { REVIEW_ACTIONS } from "../../constants/constant.reviews.js";
import { NOTIFICATION_TYPES } from "../../constants/constant.notification.js";
import { getReportingWeek } from "../../seed/helpers/seedDates.js";

export const createUser = async (override = {}) => {
  const uniqueId = Math.random().toString(36).substring(2, 8);
  const user = new User({
    name: `Test User ${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    passwordHash: "Password123",
    role: USER_ROLES.MEMBER,
    department: "Engineering",
    jobTitle: "Developer",
    isActive: true,
    ...override,
  });
  await user.save();
  return user;
};

export const createAdmin = (override = {}) => createUser({ role: USER_ROLES.ADMIN, ...override });
export const createManager = (override = {}) => createUser({ role: USER_ROLES.MANAGER, ...override });
export const createMember = (override = {}) => createUser({ role: USER_ROLES.MEMBER, ...override });
export const createInactiveUser = (override = {}) => createUser({ isActive: false, ...override });

export const createProject = async (creatorUser, managerUser, override = {}) => {
  const uniqueCode = `PRJ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const project = new Project({
    name: `Project ${uniqueCode}`,
    code: uniqueCode,
    description: "Test project description",
    category: PROJECT_CATEGORIES.DEVELOPMENT,
    status: PROJECT_STATUSES.ACTIVE,
    manager: managerUser ? managerUser._id : null,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    createdBy: creatorUser._id,
    updatedBy: creatorUser._id,
    ...override,
  });
  await project.save();
  return project;
};

export const createProjectMembership = async (project, user, assigner, role = PROJECT_MEMBER_ROLES.MEMBER) => {
  const membership = new ProjectMember({
    project: project._id,
    user: user._id,
    projectRole: role,
    assignedBy: assigner._id,
  });
  await membership.save();
  return membership;
};

export const createWeeklyReport = async (ownerUser, project, override = {}) => {
  const week = getReportingWeek(0);
  const report = new WeeklyReport({
    owner: ownerUser._id,
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    summary: "Weekly summary test text",
    completedTasks: [
      {
        title: "Test Task Completed",
        description: "Task description",
        project: project._id,
        hoursSpent: 10,
        completedAt: new Date(),
      },
    ],
    nextWeekTasks: [
      {
        title: "Test Task Next Week",
        description: "Next task description",
        project: project._id,
        priority: TASK_PRIORITIES.MEDIUM,
      },
    ],
    blockers: [],
    achievements: [],
    hoursBreakdown: [
      { project: project._id, category: HOURS_CATEGORIES.DEVELOPMENT, hours: 10, notes: "Dev work" },
    ],
    links: [],
    status: REPORT_STATUSES.DRAFT,
    createdBy: ownerUser._id,
    updatedBy: ownerUser._id,
    ...override,
  });
  await report.save();
  return report;
};

export const createReportVersion = async (report, ownerUser, versionNumber = 1, override = {}) => {
  const version = new ReportVersion({
    report: report._id,
    owner: ownerUser._id,
    versionNumber,
    sourceStatus: REPORT_STATUSES.DRAFT,
    snapshot: report.toObject(),
    submittedBy: ownerUser._id,
    submittedAt: new Date(),
    ...override,
  });
  await version.save();
  return version;
};

export const createReview = async (report, version, reviewerUser, action = REVIEW_ACTIONS.APPROVED, override = {}) => {
  const review = new Review({
    report: report._id,
    version: version._id,
    versionNumber: version.versionNumber,
    reviewer: reviewerUser._id,
    action,
    comment: "Test review comment",
    reviewedAt: new Date(),
    ...override,
  });
  await review.save();
  return review;
};

export const createNotification = async (recipientUser, type = NOTIFICATION_TYPES.SYSTEM, override = {}) => {
  const notification = new Notification({
    recipient: recipientUser._id,
    type,
    title: "Test Notification",
    message: "Test message",
    isRead: false,
    ...override,
  });
  await notification.save();
  return notification;
};
