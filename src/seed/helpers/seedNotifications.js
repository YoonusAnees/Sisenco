import Notification from "../../models/model.notification.js";
import { NOTIFICATION_TYPES } from "../../constants/constant.notification.js";

/**
 * Seeds read and unread notifications for seeded reports and reviews.
 *
 * @param {Map<string, object>} userMap - Map of email to User document
 * @param {Map<string, object>} reportMap - Map of key to WeeklyReport document
 * @returns {Promise<number>} - Count of notifications seeded
 */
export const seedNotifications = async (userMap, reportMap) => {
  const m1 = userMap.get("member.one@weeklyreport.test");
  const m2 = userMap.get("member.two@weeklyreport.test");
  const m4 = userMap.get("member.four@weeklyreport.test");
  const mgrEng = userMap.get("manager.engineering@weeklyreport.test");

  const r1 = reportMap.get("m1_3w_ago");
  const r2 = reportMap.get("m2_2w_ago");
  const r3 = reportMap.get("m3_prev");
  const r4 = reportMap.get("m4_prev");

  const notificationsData = [
    // 1. Read notification for Member One: Report Approved
    {
      recipient: m1._id,
      actor: mgrEng._id,
      type: NOTIFICATION_TYPES.REPORT_APPROVED,
      title: "Weekly Report Approved",
      message: "Your weekly report has been reviewed and approved by Engineering Manager.",
      report: r1 ? r1._id : null,
      isRead: true,
      readAt: r1 ? r1.approvedAt : new Date(),
    },
    // 2. Read notification for Member Two: Changes Requested
    {
      recipient: m2._id,
      actor: mgrEng._id,
      type: NOTIFICATION_TYPES.CHANGES_REQUESTED,
      title: "Changes Requested on Weekly Report",
      message: "Engineering Manager requested corrections on your weekly report.",
      report: r2 ? r2._id : null,
      isRead: true,
      readAt: r2 ? r2.correctionRequestedAt : new Date(),
    },
    // 3. Read notification for Member Two: Report Approved
    {
      recipient: m2._id,
      actor: mgrEng._id,
      type: NOTIFICATION_TYPES.REPORT_APPROVED,
      title: "Weekly Report Approved",
      message: "Your resubmitted weekly report has been approved.",
      report: r2 ? r2._id : null,
      isRead: true,
      readAt: r2 ? r2.approvedAt : new Date(),
    },
    // 4. Unread notification for Manager: New Report Submitted
    {
      recipient: mgrEng._id,
      actor: userMap.get("member.three@weeklyreport.test")._id,
      type: NOTIFICATION_TYPES.REPORT_SUBMITTED,
      title: "New Weekly Report Submitted",
      message: "Member Three submitted a weekly report for review.",
      report: r3 ? r3._id : null,
      isRead: false,
      readAt: null,
    },
    // 5. Unread notification for Member Four: Changes Requested
    {
      recipient: m4._id,
      actor: mgrEng._id,
      type: NOTIFICATION_TYPES.CHANGES_REQUESTED,
      title: "Changes Requested on Weekly Report",
      message: "Engineering Manager requested corrections: Please clarify the blocker assistance needed details.",
      report: r4 ? r4._id : null,
      isRead: false,
      readAt: null,
    },
    // 6. System notification for Admin
    {
      recipient: userMap.get("admin@weeklyreport.test")._id,
      actor: null,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "System Maintenance Notice",
      message: "Weekly analytics snapshot completed successfully.",
      report: null,
      isRead: true,
      readAt: new Date(),
    },
  ];

  let count = 0;
  for (const notif of notificationsData) {
    let existing = await Notification.findOne({
      recipient: notif.recipient,
      type: notif.type,
      title: notif.title,
    });

    if (existing) {
      existing.isRead = notif.isRead;
      existing.readAt = notif.readAt;
      await existing.save();
    } else {
      existing = new Notification(notif);
      await existing.save();
    }
    count++;
  }

  return count;
};
