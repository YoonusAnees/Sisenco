import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
    getCurrentUser,
    login,
    logout,
    register,
} from "../controllers/auth.controller.js";

import authenticate from "../middlewares/middleware.authenticate.js";
import validate from "../middlewares/middleware.validate.js";

import {
    loginSchema,
    registerSchema,
} from "../validators/auth.validator.js";

import {
    registerAdmin,
} from "../controllers/auth.controller.js";

import verifyAdminSetupSecret from
    "../middlewares/middleware.verifyAdminSetupSecret.js";

import {
    registerAdminSchema,
} from "../validators/auth.validator.js";

const router = Router();

const authenticationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many authentication attempts. Please try again later.",
    },
});


router.post(
    "/register-admin",
    verifyAdminSetupSecret,
    validate(registerAdminSchema),
    registerAdmin
);

router.post(
    "/register",
    authenticationLimiter,
    validate(registerSchema),
    register
);

router.post(
    "/login",
    authenticationLimiter,
    validate(loginSchema),
    login
);

router.post(
    "/logout",
    logout
);

router.get(
    "/me",
    authenticate,
    getCurrentUser
);

export default router;