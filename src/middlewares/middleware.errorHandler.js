import { env } from "../config/environment.js";

const errorHandler = (
    error,
    request,
    response,
    next
) => {
    let statusCode = error.statusCode || 500;
    let message =
        error.message || "Internal server error";
    let details = error.details;

    /*
     * MongoDB duplicate-key error.
     */
    if (error.code === 11000) {
        statusCode = 409;
        message =
            "A record with that value already exists";
        details = undefined;
    }

    /*
     * Invalid MongoDB ObjectId.
     */
    if (error.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource identifier";
        details = undefined;
    }

    /*
     * Mongoose model validation error.
     */
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Database validation failed";

        details = Object.values(error.errors).map(
            (validationError) => ({
                field: validationError.path,
                message: validationError.message,
            })
        );
    }

    /*
     * Do not expose unexpected internal errors
     * in production.
     */
    if (!error.isOperational && statusCode >= 500) {
        console.error(error);

        message = "Internal server error";
        details = undefined;
    }

    const errorResponse = {
        success: false,
        message,
    };

    if (details) {
        errorResponse.details = details;
    }

    if (!env.isProduction && error.stack) {
        errorResponse.stack = error.stack;
    }

    response
        .status(statusCode)
        .json(errorResponse);
};

export default errorHandler;