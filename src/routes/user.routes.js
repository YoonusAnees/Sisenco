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

router.use(authenticate);

router.get(
    "/",
    authorize(USER_ROLES.MANAGER, USER_ROLES.ADMIN),
    validate(getUsersSchema),
    getAllUsers
);

router.post(
    "/",
    authorize(USER_ROLES.ADMIN),
    validate(createUserSchema),
    createUser
);

router.get(
    "/:userId",
    authorize(USER_ROLES.MANAGER, USER_ROLES.ADMIN),
    validate(getUserByIdSchema),
    getSingleUser
);

router.patch(
    "/:userId",
    (request, response, next) => {
        const currentUserId = (request.user?._id || request.user?.id)?.toString();
        const targetUserId = request.params.userId?.toString();
        const isSelf = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);
        const isAdmin = request.user?.role === USER_ROLES.ADMIN;
        if (isSelf || isAdmin) return next();
        return authorize(USER_ROLES.ADMIN)(request, response, next);
    },
    validate(updateUserSchema),
    updateUser
);

router.patch(
    "/:userId/role",
    authorize(USER_ROLES.ADMIN),
    validate(updateUserRoleSchema),
    changeUserRole
);

router.patch(
    "/:userId/status",
    authorize(USER_ROLES.ADMIN),
    validate(updateUserStatusSchema),
    changeUserStatus
);

export default router;