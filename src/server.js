import { createServer } from "node:http";

import app from "./app.js";

import {
    connectDatabase,
    disconnectDatabase,
} from "./config/database.js";

import {
    env,
    validateEnvironment,
} from "./config/environment.js";

let httpServer;

const startServer = async () => {
    /*
     * Validate environment variables before
     * connecting to external services.
     */
    validateEnvironment();

    /*
     * Connect to MongoDB.
     */
    await connectDatabase();

    /*
     * Create a Node HTTP server from Express.
     * Socket.IO will be connected to this server later.
     */
    httpServer = createServer(app);

    httpServer.listen(env.port, env.host, () => {
        console.log(
            `Server running on http://${env.host}:${env.port}`
        );
    });
};

const shutdownServer = async (signal) => {
    console.log(
        `${signal} received. Closing server gracefully.`
    );

    /*
     * Stop accepting new HTTP requests.
     */
    if (httpServer) {
        await new Promise((resolve) => {
            httpServer.close(resolve);
        });
    }

    /*
     * Close the MongoDB connection.
     */
    await disconnectDatabase();

    process.exit(0);
};

process.on("SIGTERM", () => {
    shutdownServer("SIGTERM");
});

process.on("SIGINT", () => {
    shutdownServer("SIGINT");
});

startServer().catch((error) => {
    console.error(
        "Unable to start the server:",
        error
    );

    process.exit(1);
});