import crypto from "node:crypto";

import { env } from "../config/environment.js";
import AppError from "../utils/AppError.js";

const safeCompare = (providedValue, expectedValue) => {
    const providedBuffer = Buffer.from(providedValue);
    const expectedBuffer = Buffer.from(expectedValue);

    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
    );
};

const verifyAdminSetupSecret = (
    request,
    response,
    next
) => {
    const providedSecret =
        request.get("x-admin-setup-secret");

    const expectedSecret =
        env.adminRegistrationSecret;

    if (!expectedSecret) {
        return next(
            new AppError(
                "Admin registration is not configured",
                503
            )
        );
    }

    if (
        !providedSecret ||
        !safeCompare(providedSecret, expectedSecret)
    ) {
        return next(
            new AppError(
                "Invalid admin setup secret",
                403
            )
        );
    }

    next();
};

export default verifyAdminSetupSecret;