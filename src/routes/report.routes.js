import { Router } from "express";

import {
    createReport,
    getMyReports,
    getSingleReport,
    updateReport,
} from "../controllers/report.controller.js";

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
    createReportSchema,
    getMyReportsSchema,
    getReportByIdSchema,
    updateReportSchema,
} from "../validators/report.validator.js";

const router = Router();

router.use(authenticate);

/*
 * Every active authenticated user may create
 * their own weekly report draft.
 */
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

/*
 * This route must be declared before
 * "/:reportId", otherwise Express may treat
 * "me" as a report ID.
 */
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