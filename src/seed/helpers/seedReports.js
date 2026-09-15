import WeeklyReport from "../../models/model.weekly.report.js";
import {
  HOURS_CATEGORIES,
  REPORT_STATUSES,
  TASK_PRIORITIES,
} from "../../constants/constant.reports.js";
import { getSeedWeekRanges } from "./seedDates.js";

/**
 * Seeds weekly reports across target weeks covering all workflow statuses.
 *
 * @param {Map<string, object>} userMap - Map of email to User document
 * @param {Map<string, object>} projectMap - Map of code to Project document
 * @returns {Promise<{ reportMap: Map<string, object>, count: number }>}
 */
export const seedReports = async (userMap, projectMap) => {
  const weeks = getSeedWeekRanges();
  const reportMap = new Map();
  let count = 0;

  const m1 = userMap.get("member.one@weeklyreport.test");
  const m2 = userMap.get("member.two@weeklyreport.test");
  const m3 = userMap.get("member.three@weeklyreport.test");
  const m4 = userMap.get("member.four@weeklyreport.test");
  const m5 = userMap.get("member.five@weeklyreport.test");

  const mgrEng = userMap.get("manager.engineering@weeklyreport.test");
  const mgrProd = userMap.get("manager.product@weeklyreport.test");

  const pCust = projectMap.get("CUST-PORT");
  const pInv = projectMap.get("INV-MGMT");
  const pMob = projectMap.get("MOB-REP");

  // Array of report definitions
  const reportDefinitions = [
    // ----------------------------------------------------
    // 1. Three Weeks Ago: Approved Report (Member One)
    // ----------------------------------------------------
    {
      key: "m1_3w_ago",
      owner: m1,
      week: weeks.threeWeeksAgo,
      status: REPORT_STATUSES.APPROVED,
      summary: "Completed core backend authentication routes and integrated user role verification middleware.",
      completedTasks: [
        {
          title: "Implement JWT verification middleware",
          description: "Added cookie parsing and token decoding logic.",
          project: pCust._id,
          hoursSpent: 16,
          completedAt: new Date(weeks.threeWeeksAgo.weekStart.getTime() + 2 * 86400000),
        },
        {
          title: "Setup User Mongoose schema",
          description: "Configured password hashing and indexed email.",
          project: pCust._id,
          hoursSpent: 14,
          completedAt: new Date(weeks.threeWeeksAgo.weekStart.getTime() + 4 * 86400000),
        },
      ],
      nextWeekTasks: [
        {
          title: "Write unit tests for authentication routes",
          description: "Cover login, signup, and logout endpoints.",
          project: pCust._id,
          priority: TASK_PRIORITIES.HIGH,
          dueDate: new Date(weeks.twoWeeksAgo.weekStart.getTime() + 3 * 86400000),
        },
      ],
      blockers: [], // No blockers
      achievements: [
        {
          title: "Zero security vulnerabilities found during internal audit",
          description: "Passed baseline security checks.",
          project: pCust._id,
        },
      ],
      hoursBreakdown: [
        { project: pCust._id, category: HOURS_CATEGORIES.DEVELOPMENT, hours: 30, notes: "Auth feature dev" },
        { project: pCust._id, category: HOURS_CATEGORIES.MEETINGS, hours: 10, notes: "Sprint sync" },
      ],
      links: [{ label: "Auth Spec Doc", url: "https://confluence.test/auth-spec" }],
      submittedAt: new Date(weeks.threeWeeksAgo.weekEnd.getTime() - 86400000),
      approvedAt: new Date(weeks.threeWeeksAgo.weekEnd.getTime() - 43200000),
      approvedBy: mgrEng._id,
      submissionCount: 1,
      currentVersion: 1,
    },

    // ----------------------------------------------------
    // 2. Two Weeks Ago: Resubmitted & Approved Report (Member Two)
    // ----------------------------------------------------
    {
      key: "m2_2w_ago",
      owner: m2,
      week: weeks.twoWeeksAgo,
      status: REPORT_STATUSES.APPROVED,
      summary: "Refactored dashboard UI layout and resolved responsiveness issue on mobile viewports.",
      completedTasks: [
        {
          title: "Redesign navigation sidebar",
          description: "Updated CSS flex layout and collapse toggle.",
          project: pCust._id,
          hoursSpent: 20,
          completedAt: new Date(weeks.twoWeeksAgo.weekStart.getTime() + 3 * 86400000),
        },
        {
          title: "Mobile UI polish",
          description: "Added viewport meta adjustments and mobile CSS grid rules.",
          project: pMob._id,
          hoursSpent: 15,
          completedAt: new Date(weeks.twoWeeksAgo.weekStart.getTime() + 5 * 86400000),
        },
      ],
      nextWeekTasks: [
        {
          title: "Optimize chart rendering performance",
          description: "Use canvas canvas rendering for large datasets.",
          project: pCust._id,
          priority: TASK_PRIORITIES.MEDIUM,
        },
      ],
      blockers: [],
      achievements: [
        {
          title: "Improved mobile lighthouse score to 95",
          description: "Reduced layout shifts on initial load.",
          project: pMob._id,
        },
      ],
      hoursBreakdown: [
        { project: pCust._id, category: HOURS_CATEGORIES.DESIGN, hours: 20, notes: "Sidebar UI" },
        { project: pMob._id, category: HOURS_CATEGORIES.DEVELOPMENT, hours: 15, notes: "Mobile layout" },
      ],
      links: [{ label: "Figma Mockups", url: "https://figma.test/mobile-ui" }],
      submittedAt: new Date(weeks.twoWeeksAgo.weekEnd.getTime() - 36000000),
      approvedAt: new Date(weeks.twoWeeksAgo.weekEnd.getTime() - 720000),
      approvedBy: mgrEng._id,
      correctionRequestedAt: new Date(weeks.twoWeeksAgo.weekEnd.getTime() - 72000000),
      correctionRequestedBy: mgrEng._id,
      latestCorrectionNote: "Please include hours spent breakdown for Mobile Reporting project as well.",
      submissionCount: 2,
      currentVersion: 2,
    },

    // ----------------------------------------------------
    // 3. Previous Week: Submitted Report Awaiting Review (Member Three)
    // ----------------------------------------------------
    {
      key: "m3_prev",
      owner: m3,
      week: weeks.previousWeek,
      status: REPORT_STATUSES.SUBMITTED,
      summary: "Integrated MongoDB database index optimizations and completed report pagination services.",
      completedTasks: [
        {
          title: "Add index to weekly report collection",
          description: "Indexed owner, weekStart, and status fields.",
          project: pCust._id,
          hoursSpent: 22,
          completedAt: new Date(weeks.previousWeek.weekStart.getTime() + 2 * 86400000),
        },
        {
          title: "Implement report pagination endpoint",
          description: "Added page and limit params to API controller.",
          project: pCust._id,
          hoursSpent: 16,
          completedAt: new Date(weeks.previousWeek.weekStart.getTime() + 4 * 86400000),
        },
      ],
      nextWeekTasks: [
        {
          title: "Implement notification persistence service",
          description: "Store system notifications in MongoDB.",
          project: pCust._id,
          priority: TASK_PRIORITIES.HIGH,
        },
      ],
      blockers: [
        {
          title: "Staging MongoDB cluster memory limits",
          description: "Staging server experienced out of memory exception during index rebuild.",
          project: pCust._id,
          impact: "Delayed performance benchmarking tests.",
          assistanceNeeded: "DevOps team needs to increase RAM allocated to staging cluster.",
          isResolved: false,
        },
      ],
      achievements: [],
      hoursBreakdown: [
        { project: pCust._id, category: HOURS_CATEGORIES.DEVELOPMENT, hours: 38, notes: "DB indexing and pagination" },
      ],
      links: [],
      submittedAt: new Date(weeks.previousWeek.weekEnd.getTime() - 43200000),
      submissionCount: 1,
      currentVersion: 1,
    },

    // ----------------------------------------------------
    // 4. Previous Week: Report Needing Correction (Member Four)
    // ----------------------------------------------------
    {
      key: "m4_prev",
      owner: m4,
      week: weeks.previousWeek,
      status: REPORT_STATUSES.NEEDS_CORRECTION,
      summary: "Designed onboarding wireframes and component library for Inventory Management application.",
      completedTasks: [
        {
          title: "Design stock table UI components",
          description: "Created reusable table headers, rows, and pagination controls.",
          project: pInv._id,
          hoursSpent: 25,
          completedAt: new Date(weeks.previousWeek.weekStart.getTime() + 3 * 86400000),
        },
      ],
      nextWeekTasks: [
        {
          title: "Finalize mobile inventory scanning screens",
          description: "Design barcode scanner interface.",
          project: pInv._id,
          priority: TASK_PRIORITIES.URGENT,
        },
      ],
      blockers: [
        {
          title: "Missing brand design guidelines for inventory module",
          description: "Awaiting updated color palette from design lead.",
          project: pInv._id,
          impact: "Cannot finalize button component variants.",
          assistanceNeeded: "Design lead approval required.",
          isResolved: false,
        },
      ],
      achievements: [],
      hoursBreakdown: [
        { project: pInv._id, category: HOURS_CATEGORIES.DESIGN, hours: 25, notes: "Stock table UI" },
      ],
      links: [],
      submittedAt: new Date(weeks.previousWeek.weekEnd.getTime() - 86400000),
      correctionRequestedAt: new Date(weeks.previousWeek.weekEnd.getTime() - 21600000),
      correctionRequestedBy: mgrEng._id,
      latestCorrectionNote: "Please clarify the blocker assistance needed details and expand on next week tasks.",
      submissionCount: 1,
      currentVersion: 1,
    },

    // ----------------------------------------------------
    // 5. Current Week: Draft Report (Member One)
    // ----------------------------------------------------
    {
      key: "m1_curr",
      owner: m1,
      week: weeks.currentWeek,
      status: REPORT_STATUSES.DRAFT,
      summary: "Working on inventory stock alert triggers and backend worker process.",
      completedTasks: [
        {
          title: "Build stock threshold alert listener",
          description: "Configured event emitter when stock reaches minimum reorder level.",
          project: pInv._id,
          hoursSpent: 12,
          completedAt: new Date(weeks.currentWeek.weekStart.getTime() + 1 * 86400000),
        },
      ],
      nextWeekTasks: [
        {
          title: "Test automated email alert dispatch",
          description: "Verify email alerts sent to inventory managers.",
          project: pInv._id,
          priority: TASK_PRIORITIES.HIGH,
        },
      ],
      blockers: [],
      achievements: [],
      hoursBreakdown: [
        { project: pInv._id, category: HOURS_CATEGORIES.DEVELOPMENT, hours: 12, notes: "Alert triggers" },
      ],
      links: [],
      submissionCount: 0,
      currentVersion: 0,
    },
  ];

  for (const def of reportDefinitions) {
    let report = await WeeklyReport.findOne({
      owner: def.owner._id,
      weekStart: def.week.weekStart,
    });

    const reportFields = {
      owner: def.owner._id,
      weekStart: def.week.weekStart,
      weekEnd: def.week.weekEnd,
      summary: def.summary,
      completedTasks: def.completedTasks,
      nextWeekTasks: def.nextWeekTasks,
      blockers: def.blockers,
      achievements: def.achievements,
      hoursBreakdown: def.hoursBreakdown,
      links: def.links,
      status: def.status,
      submittedAt: def.submittedAt || null,
      approvedAt: def.approvedAt || null,
      approvedBy: def.approvedBy || null,
      correctionRequestedAt: def.correctionRequestedAt || null,
      correctionRequestedBy: def.correctionRequestedBy || null,
      latestCorrectionNote: def.latestCorrectionNote || "",
      submissionCount: def.submissionCount,
      currentVersion: def.currentVersion,
      createdBy: def.owner._id,
      updatedBy: def.owner._id,
    };

    if (report) {
      Object.assign(report, reportFields);
      await report.save();
    } else {
      report = new WeeklyReport(reportFields);
      await report.save();
    }

    reportMap.set(def.key, report);
    count++;
  }

  return { reportMap, count };
};
