import AppError from "../utils/AppError.js";

const authorize = (...allowedRoles) => {
    return (request, response, next) => {
        if (!request.user) {
            return next(
                new AppError(
                    "Authentication required",
                    401
                )
            );
        }

        if (!allowedRoles.includes(request.user.role)) {
            return next(
                new AppError(
                    "You are not authorised to perform this action",
                    403
                )
            );
        }

        return next();
    };
};

export default authorize;