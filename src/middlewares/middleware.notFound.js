import AppError from "../utils/AppError.js";

const notFound = (request, response, next) => {
    const message = `Route not found: ${request.method} ${request.originalUrl}`;

    next(new AppError(message, 404));
};

export default notFound;