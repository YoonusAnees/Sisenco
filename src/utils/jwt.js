import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export const signAccessToken = (userId) => {
    return jwt.sign(
        {
            sub: userId,
        },
        env.jwtSecret,
        {
            expiresIn: env.jwtExpiresIn,
        }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.jwtSecret);
};

export const getAuthCookieOptions = () => {
    return {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    };
};

export const getClearCookieOptions = () => {
    return {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        path: "/",
    };
};