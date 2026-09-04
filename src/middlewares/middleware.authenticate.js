import { env } from "../config/environment.js";
import User from "../models/model.user.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    verifyAccessToken,
} from "../utils/jwt.js";

const authenticate = asyncHandler(
  async (request, response, next) => {
    const token =
      request.cookies?.[env.cookieName];

    if (!token) {
      throw new AppError(
        "Authentication required",
        401
      );
    }

    let decodedToken;

    try {
      decodedToken = verifyAccessToken(token);
    } catch {
      throw new AppError(
        "Invalid or expired authentication token",
        401
      );
    }

    const user = await User.findById(
      decodedToken.sub
    );

    if (!user || !user.isActive) {
      throw new AppError(
        "Authentication required",
        401
      );
    }

    request.user = user;

    return next();
  }
);

export default authenticate;