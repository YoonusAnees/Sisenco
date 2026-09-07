import cookie from "cookie";

import {
    env,
} from "../config/environment.js";

import { User } from "../models/index.js";

import {
    verifyAccessToken,
} from "../utils/jwt.js";


const getSocketToken = (socket) => {
    /*
     * Primary authentication method:
     * read the HTTP-only JWT cookie.
     */
    const cookieHeader =
        socket.handshake.headers.cookie;

    if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);

        const cookieToken =
            cookies[env.jwtCookieName];

        if (cookieToken) {
            return cookieToken;
        }
    }

    /*
     * Optional fallback for Postman or a
     * non-browser Socket.IO client.
     */
    const authenticationToken =
        socket.handshake.auth?.token;

    if (authenticationToken) {
        return authenticationToken;
    }

    return null;
};

const socketAuthentication = async (
    socket,
    next
) => {
    try {
        const token = getSocketToken(socket);

        if (!token) {
            return next(
                new Error("Authentication required")
            );
        }

         const payload = verifyAccessToken(token);
        /*
         * Support common JWT payload property names.
         * Your existing token probably uses userId or id.
         */
        const userId =
            payload.userId ||
            payload.id ||
            payload.sub;

        if (!userId) {
            return next(
                new Error("Invalid authentication token")
            );
        }

        const user = await User.findById(userId)
            .select(
                "_id name email role isActive"
            )
            .lean();

        if (!user) {
            return next(
                new Error("User account not found")
            );
        }

        if (!user.isActive) {
            return next(
                new Error("User account is inactive")
            );
        }

        /*
         * Store the authenticated user on the
         * server-side socket.
         */
        socket.data.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return next();
    } catch {
        return next(
            new Error(
                "Invalid or expired authentication token"
            )
        );
    }
};

export default socketAuthentication;