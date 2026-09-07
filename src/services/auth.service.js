import { USER_ROLES } from "../constants/constant.roles.js";
import User from "../models/model.user.js";
import AppError from "../utils/AppError.js";
import {
  sendWelcomeEmail,
} from "../services/workflow.email.service.js";

const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
};

export const registerUser = async ({
    name,
    email,
    password,
    department,
    jobTitle,
}) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.exists({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new AppError(
            "An account with this email already exists",
            409
        );
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash: password,
        department,
        jobTitle,

        // Public registration always creates a member.
        role: USER_ROLES.MEMBER,
    });

    await sendWelcomeEmail(user);


    return user;
};

export const authenticateUser = async ({
    email,
    password,
}) => {
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
        email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const passwordIsCorrect =
        await user.comparePassword(password);

    if (!passwordIsCorrect) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "This account has been deactivated",
            403
        );
    }

    user.lastLoginAt = new Date();

    await user.save({
        validateModifiedOnly: true,
    });

    /*
     * Remove passwordHash from this document before
     * returning it to the controller.
     */
    user.passwordHash = undefined;

    return user;
};

export const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
        throw new AppError(
            "User account not found",
            404
        );
    }

    return user;
};


export const registerInitialAdmin = async ({
  name,
  email,
  password,
  department,
  jobTitle,
}) => {
  /*
   * Only allow this endpoint while no admin exists.
   */
  const adminExists = await User.exists({
    role: USER_ROLES.ADMIN,
  });

  if (adminExists) {
    throw new AppError(
      "Initial admin registration is no longer available",
      403
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.exists({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists",
      409
    );
  }

  const admin = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password,
    role: USER_ROLES.ADMIN,
    department,
    jobTitle,
    isActive: true,
  });

  return admin;
};