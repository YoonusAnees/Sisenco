import { Router } from "express";

import {
  approve,
  getReviewHistory,
  getReviewQueue,
  requestChanges,
} from "../controllers/review.controller.js";

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
  getReviewHistorySchema,
  getReviewQueueSchema,
  requestChangesSchema,
} from "../validators/review.validator.js";

const router = Router();

router.use(authenticate);

/*
 * Queue is available only to managers
 * and administrators.
 */
router.get(
  "/queue",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getReviewQueueSchema),
  getReviewQueue
);

/*
 * Report owners must be able to view the
 * correction and approval history.
 */
router.get(
  "/:reportId/history",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getReviewHistorySchema),
  getReviewHistory
);

router.post(
  "/:reportId/request-changes",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(requestChangesSchema),
  requestChanges
);

router.post(
  "/:reportId/approve",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(approveReportSchema),
  approve
);

export default router;