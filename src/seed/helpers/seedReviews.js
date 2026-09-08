import ReportVersion from "../../models/model.report.version.js";
import ReviewModel from "../../models/model.review.js";
import { REVIEW_ACTIONS } from "../../constants/constant.reviews.js";
import { REPORT_STATUSES } from "../../constants/constant.reports.js";

/**
 * Seeds immutable report version snapshots and manager review records.
 *
 * @param {Map<string, object>} userMap - Map of email to User document
 * @param {Map<string, object>} reportMap - Map of key to WeeklyReport document
 * @returns {Promise<{ versionCount: number, reviewCount: number }>}
 */
export const seedReviews = async (userMap, reportMap) => {
  let versionCount = 0;
  let reviewCount = 0;

  const mgrEng = userMap.get("manager.engineering@weeklyreport.test");

  // 1. Report: m1_3w_ago (Approved V1)
  const r1 = reportMap.get("m1_3w_ago");
  if (r1) {
    let v1 = await ReportVersion.findOne({ report: r1._id, versionNumber: 1 });
    if (!v1) {
      v1 = new ReportVersion({
        report: r1._id,
        owner: r1.owner,
        versionNumber: 1,
        sourceStatus: REPORT_STATUSES.DRAFT,
        snapshot: r1.toObject(),
        submittedBy: r1.owner,
        submittedAt: r1.submittedAt,
      });
      await v1.save();
    }
    versionCount++;

    let rev1 = await ReviewModel.findOne({ report: r1._id, versionNumber: 1, action: REVIEW_ACTIONS.APPROVED });
    if (!rev1) {
      rev1 = new ReviewModel({
        report: r1._id,
        version: v1._id,
        versionNumber: 1,
        reviewer: mgrEng._id,
        action: REVIEW_ACTIONS.APPROVED,
        comment: "Excellent work on authentication middleware and clean unit tests setup.",
        reviewedAt: r1.approvedAt,
      });
      await rev1.save();
    }
    reviewCount++;
  }

  // 2. Report: m2_2w_ago (Resubmitted & Approved V2)
  const r2 = reportMap.get("m2_2w_ago");
  if (r2) {
    // Version 1 snapshot (Original submission without mobile hours breakdown)
    const v1Snapshot = r2.toObject();
    v1Snapshot.hoursBreakdown = [
      { project: v1Snapshot.completedTasks[0].project, category: "design", hours: 20, notes: "Sidebar UI" },
    ];
    v1Snapshot.totalHours = 20;

    let v1 = await ReportVersion.findOne({ report: r2._id, versionNumber: 1 });
    if (!v1) {
      v1 = new ReportVersion({
        report: r2._id,
        owner: r2.owner,
        versionNumber: 1,
        sourceStatus: REPORT_STATUSES.DRAFT,
        snapshot: v1Snapshot,
        submittedBy: r2.owner,
        submittedAt: new Date(r2.submittedAt.getTime() - 86400000),
      });
      await v1.save();
    }
    versionCount++;

    // Review 1 (Changes Requested on V1)
    let rev1 = await ReviewModel.findOne({ report: r2._id, versionNumber: 1, action: REVIEW_ACTIONS.CHANGES_REQUESTED });
    if (!rev1) {
      rev1 = new ReviewModel({
        report: r2._id,
        version: v1._id,
        versionNumber: 1,
        reviewer: mgrEng._id,
        action: REVIEW_ACTIONS.CHANGES_REQUESTED,
        comment: r2.latestCorrectionNote,
        reviewedAt: r2.correctionRequestedAt,
      });
      await rev1.save();
    }
    reviewCount++;

    // Version 2 snapshot (Resubmission with complete hours breakdown)
    let v2 = await ReportVersion.findOne({ report: r2._id, versionNumber: 2 });
    if (!v2) {
      v2 = new ReportVersion({
        report: r2._id,
        owner: r2.owner,
        versionNumber: 2,
        sourceStatus: REPORT_STATUSES.NEEDS_CORRECTION,
        snapshot: r2.toObject(),
        submittedBy: r2.owner,
        submittedAt: r2.submittedAt,
      });
      await v2.save();
    }
    versionCount++;

    // Review 2 (Approval on V2)
    let rev2 = await ReviewModel.findOne({ report: r2._id, versionNumber: 2, action: REVIEW_ACTIONS.APPROVED });
    if (!rev2) {
      rev2 = new ReviewModel({
        report: r2._id,
        version: v2._id,
        versionNumber: 2,
        reviewer: mgrEng._id,
        action: REVIEW_ACTIONS.APPROVED,
        comment: "Thank you for updating the hours breakdown. Approved!",
        reviewedAt: r2.approvedAt,
      });
      await rev2.save();
    }
    reviewCount++;
  }

  // 3. Report: m3_prev (Submitted V1)
  const r3 = reportMap.get("m3_prev");
  if (r3) {
    let v1 = await ReportVersion.findOne({ report: r3._id, versionNumber: 1 });
    if (!v1) {
      v1 = new ReportVersion({
        report: r3._id,
        owner: r3.owner,
        versionNumber: 1,
        sourceStatus: REPORT_STATUSES.DRAFT,
        snapshot: r3.toObject(),
        submittedBy: r3.owner,
        submittedAt: r3.submittedAt,
      });
      await v1.save();
    }
    versionCount++;
  }

  // 4. Report: m4_prev (Needs Correction V1)
  const r4 = reportMap.get("m4_prev");
  if (r4) {
    let v1 = await ReportVersion.findOne({ report: r4._id, versionNumber: 1 });
    if (!v1) {
      v1 = new ReportVersion({
        report: r4._id,
        owner: r4.owner,
        versionNumber: 1,
        sourceStatus: REPORT_STATUSES.DRAFT,
        snapshot: r4.toObject(),
        submittedBy: r4.owner,
        submittedAt: r4.submittedAt,
      });
      await v1.save();
    }
    versionCount++;

    let rev1 = await ReviewModel.findOne({ report: r4._id, versionNumber: 1, action: REVIEW_ACTIONS.CHANGES_REQUESTED });
    if (!rev1) {
      rev1 = new ReviewModel({
        report: r4._id,
        version: v1._id,
        versionNumber: 1,
        reviewer: mgrEng._id,
        action: REVIEW_ACTIONS.CHANGES_REQUESTED,
        comment: r4.latestCorrectionNote,
        reviewedAt: r4.correctionRequestedAt,
      });
      await rev1.save();
    }
    reviewCount++;
  }

  return { versionCount, reviewCount };
};
