import { Router } from "express";

import {
  getActivity,
  getComparison,
  getDistribution,
  getMemberStatuses,
  getSummary,
  getTrends,
  getWorkload,
} from "../controllers/dashboard.controller.js";

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
  activitySchema,
  dashboardSummarySchema,
  projectWorkloadSchema,
  sectionComparisonSchema,
  statusByMemberSchema,
  taskTrendsSchema,
  timeDistributionSchema,
} from "../validators/dashboard.validator.js";

const router = Router();

router.use(authenticate);

router.use(
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  )
);

router.get(
  "/summary",
  validate(dashboardSummarySchema),
  getSummary
);

router.get(
  "/task-trends",
  validate(taskTrendsSchema),
  getTrends
);

router.get(
  "/status-by-member",
  validate(statusByMemberSchema),
  getMemberStatuses
);

router.get(
  "/project-workload",
  validate(projectWorkloadSchema),
  getWorkload
);

router.get(
  "/time-distribution",
  validate(timeDistributionSchema),
  getDistribution
);

router.get(
  "/activity",
  validate(activitySchema),
  getActivity
);

router.get(
  "/section-comparison",
  validate(sectionComparisonSchema),
  getComparison
);

export default router;