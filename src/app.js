import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import {
    env,
} from "./config/environment.js";

import errorHandler from "./middlewares/middleware.errorHandler.js";
import notFound from "./middlewares/middleware.notFound.js";
import apiRoutes from "./routes/index.js";

const app = express();

/*
 * Required when deployed behind a proxy,
 * for example on Render.
 */
if (env.isProduction) {
    app.set("trust proxy", 1);
}

/*
 * Security headers.
 */
app.use(helmet());

/*
 * Allow the React frontend to send
 * credential-based requests.
 */
app.use(
    cors({
        origin: (origin, callback) => {
            /*
             * Allow requests with no origin (e.g. mobile apps, curl, Postman).
             */
            if (!origin) return callback(null, true);

            /*
             * In development mode, allow any local network origin (e.g. another laptop).
             */
            if (!env.isProduction) return callback(null, true);

            if (env.clientUrl.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);

/*
 * Compress API responses.
 */
app.use(compression());

/*
 * Request-body parsers.
 */
app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

/*
 * Read cookies from incoming requests.
 */
app.use(cookieParser());

/*
 * Development request logging.
 */
if (
    !env.isProduction &&
    env.nodeEnv !== "test"
) {
    app.use(morgan("dev"));
}

/*
 * Health-check endpoint.
 */
app.get("/health", (request, response) => {
    response.status(200).json({
        success: true,
        message: "Weekly Report API is healthy",
    });
});

/*
 * Main API routes.
 */
app.use("/api/v1", apiRoutes);

/*
 * These must remain after the API routes.
 */
app.use(notFound);
app.use(errorHandler);

export default app;