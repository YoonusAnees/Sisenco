import { Router } from "express";

import {
    changeUserRole,
    changeUserStatus,
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
} from "../controllers/user.controller.js";

import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import authenticate from "../middlewares/middleware.authenticate.js";
import authorize from "../middlewares/middleware.authorize.js";
import validate from "../middlewares/middleware.validate.js";

import {
    createUserSchema,
    getUserByIdSchema,
    getUsersSchema,
    updateUserRoleSchema,
    updateUserSchema,
    updateUserStatusSchema,
} from "../validators/user.validator.js";

const router = Router();

/*
 * All user-management routes require login.
 */
router.use(authenticate);

/*
 * Manager and admin can view the user list.
 */
router.get(
    "/",
    authorize(
        USER_ROLES.MANAGER,
        USER_ROLES.ADMIN
    ),
    validate(getUsersSchema),
    getAllUsers
);

/*
 * Admin creates users.
 */
router.post(
    "/",
    authorize(USER_ROLES.ADMIN),
    validate(createUserSchema),
    createUser
);

/*
 * Manager and admin can view one user.
 */
router.get(
    "/:userId",
    authorize(
        USER_ROLES.MANAGER,
        USER_ROLES.ADMIN
    ),
    validate(getUserByIdSchema),
    getSingleUser
);

/*
 * Only admin can update user details.
 */
router.patch(
    "/:userId",
    authorize(USER_ROLES.ADMIN),
    validate(updateUserSchema),
    updateUser
);

/*
 * Only admin can change roles.
 */
router.patch(
    "/:userId/role",
    authorize(USER_ROLES.ADMIN),
    validate(updateUserRoleSchema),
    changeUserRole
);

/*
 * Only admin can activate/deactivate users.
 */
router.patch(
    "/:userId/status",
    authorize(USER_ROLES.ADMIN),
    validate(updateUserStatusSchema),
    changeUserStatus
);

export default router;