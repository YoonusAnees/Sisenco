import { Router } from "express";

import {
  createReport,
  getMyReports,
  getSingleReport,
  updateReport,
} from "../controllers/report.controller.js";

import {
  approveReport,
  requestCorrection,
  submitReport,
} from "../controllers/report.workflow.controller.js";

import {
  getAllReportVersions,
  getSingleReportVersion,
} from "../controllers/report.version.controller.js";

import {
  USER_ROLES,
} from "../constants/constant.roles.js";

import authenticate from
  "../middlewares/middleware.authenticate.js";

import authorize from
  "../middlewares/middleware.authorize.js";

import validate from
  "../middlewares/middleware.validate.js";

import {
  approveReportSchema,
  createReportSchema,
  getMyReportsSchema,
  getReportByIdSchema,
  getReportVersionSchema,
  getReportVersionsSchema,
  requestCorrectionSchema,
  submitReportSchema,
  updateReportSchema,
} from "../validators/report.validator.js";

const router = Router();

router.use(authenticate);

/*
 * ─── MEMBER-ONLY: report authoring ────────────────────────────────────────────
 * Managers and admins are reviewers / approvers. They do not author reports.
 */

/*
 * Create a draft weekly report.
 */
router.post(
  "/",
  authorize(USER_ROLES.MEMBER),
  validate(createReportSchema),
  createReport
);

/*
 * List the authenticated member's own reports.
 */
router.get(
  "/me",
  authorize(USER_ROLES.MEMBER),
  validate(getMyReportsSchema),
  getMyReports
);

/*
 * Submit (or resubmit) a draft report for review.
 */
router.post(
  "/:reportId/submit",
  authorize(USER_ROLES.MEMBER),
  validate(submitReportSchema),
  submitReport
);

/*
 * Edit a draft or needs-correction report.
 */
router.patch(
  "/:reportId",
  authorize(USER_ROLES.MEMBER),
  validate(updateReportSchema),
  updateReport
);

router.put(
  "/:reportId",
  authorize(USER_ROLES.MEMBER),
  validate(updateReportSchema),
  updateReport
);

/*
 * ─── ALL ROLES: read ───────────────────────────────────────────────────────────
 * Members can view their own reports; the service enforces that managers and
 * admins can only view reports belonging to their projects / any project.
 */

/*
 * Read a single report by ID.
 */
router.get(
  "/:reportId",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getReportByIdSchema),
  getSingleReport
);

/*
 * List all saved versions of a report.
 */
router.get(
  "/:reportId/versions",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getReportVersionsSchema),
  getAllReportVersions
);

/*
 * Read one specific version snapshot.
 */
router.get(
  "/:reportId/versions/:versionNumber",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getReportVersionSchema),
  getSingleReportVersion
);

/*
 * ─── MANAGER / ADMIN: review actions ──────────────────────────────────────────
 */

/*
 * Request corrections from the report author.
 */
router.post(
  "/:reportId/request-correction",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(requestCorrectionSchema),
  requestCorrection
);

/*
 * Approve a submitted report.
 */
router.post(
  "/:reportId/approve",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(approveReportSchema),
  approveReport
);

export default router;