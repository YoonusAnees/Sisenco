import { signAccessToken } from "../../utils/jwt.js";
import { env } from "../../config/environment.js";

/**
 * Creates an authentication cookie header for a given user.
 *
 * @param {object} user - User document
 * @returns {string} - Cookie header string
 */
export const getAuthCookie = (user) => {
  const token = signAccessToken(user._id ? user._id.toString() : user.id);
  const cookieName = env.cookieName || "weekly_report_token";
  return `${cookieName}=${token}`;
};
