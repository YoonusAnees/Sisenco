import { Server } from "socket.io";

import {
    env,
} from "../config/environment.js";

import {
    SOCKET_EVENTS,
} from "../constants/constent.socket.events.js";

import socketAuthentication from
    "./socket.authentication.js";

import {
    getRoleRoom,
    getUserRoom,
} from "./socket.rooms.js";

let io;

export const initializeSocketServer = (
    httpServer
) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.clientUrl,
            credentials: true,
            methods: ["GET", "POST"],
        },

        /*
         * Helps temporarily disconnected clients
         * recover missed socket packets.
         *
         * MongoDB notifications remain the permanent
         * source of truth.
         */
        connectionStateRecovery: {
            maxDisconnectionDuration:
                2 * 60 * 1000,

            skipMiddlewares: false,
        },
    });

    /*
     * Authenticate every socket connection.
     */
    io.use(socketAuthentication);

    io.on("connection", (socket) => {
        const user = socket.data.user;

        const userRoom =
            getUserRoom(user.id);

        const roleRoom =
            getRoleRoom(user.role);

        /*
         * Rooms are assigned only by the server.
         */
        socket.join(userRoom);
        socket.join(roleRoom);

        socket.emit(
            SOCKET_EVENTS.CONNECTION_READY,
            {
                success: true,

                data: {
                    socketId: socket.id,
                    user,
                },
            }
        );

        socket.on("disconnect", (reason) => {
            if (!env.isProduction) {
                console.log(
                    `Socket disconnected: ${socket.id} (${reason})`
                );
            }
        });
    });

    console.log(
        "Socket.IO initialized successfully"
    );

    return io;
};

export const getSocketServer = () => {
    if (!io) {
        return null;
    }

    return io;
};

export const closeSocketServer = async () => {
    if (!io) {
        return;
    }

    await new Promise((resolve) => {
        io.close(resolve);
    });

    io = undefined;
};