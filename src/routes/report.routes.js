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

router.post(
  "/",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(createReportSchema),
  createReport
);

router.get(
  "/me",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getMyReportsSchema),
  getMyReports
);


router.post(
  "/:reportId/submit",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(submitReportSchema),
  submitReport
);

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

router.post(
  "/:reportId/request-correction",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(requestCorrectionSchema),
  requestCorrection
);

router.post(
  "/:reportId/approve",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(approveReportSchema),
  approveReport
);

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

router.patch(
  "/:reportId",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(updateReportSchema),
  updateReport
);

export default router;