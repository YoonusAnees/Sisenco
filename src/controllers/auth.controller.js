import { env } from "../config/environment.js";

import {
  authenticateUser,
  getUserById,
  registerUser,
} from "../services/auth.service.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  getAuthCookieOptions,
  getClearCookieOptions,
  signAccessToken,
} from "../utils/jwt.js";

const sendAuthenticationResponse = (
  response,
  statusCode,
  user,
  message
) => {
  const token = signAccessToken(user.id);

  response.cookie(
    env.cookieName,
    token,
    getAuthCookieOptions()
  );

  response.status(statusCode).json({
    success: true,
    message,
    data: {
      user,
    },
  });
};

export const register = asyncHandler(
  async (request, response) => {
    const user = await registerUser(
      request.validated.body
    );

    sendAuthenticationResponse(
      response,
      201,
      user,
      "Registration successful"
    );
  }
);

export const login = asyncHandler(
  async (request, response) => {
    const user = await authenticateUser(
      request.validated.body
    );

    sendAuthenticationResponse(
      response,
      200,
      user,
      "Login successful"
    );
  }
);

export const logout = (request, response) => {
  response.clearCookie(
    env.cookieName,
    getClearCookieOptions()
  );

  response.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const getCurrentUser = asyncHandler(
  async (request, response) => {
    const user = await getUserById(
      request.user.id
    );

    response.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }
);