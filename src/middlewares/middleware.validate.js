import AppError from "../utils/AppError.js";

const validate = (schema) => {
    return (request, response, next) => {
        const result = schema.safeParse({
            body: request.body,
            params: request.params,
            query: request.query,
        });

        if (!result.success) {
            const validationErrors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return next(
                new AppError(
                    "Validation failed",
                    400,
                    validationErrors
                )
            );
        }

        request.validated = result.data;

        return next();
    };
};

export default validate;