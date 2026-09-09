import {
  createUserByAdmin,
  getUserById,
  getUsers,
  updateUserByAdmin,
  updateUserRole,
  updateUserStatus,
} from "../services/user.service.js";

import asyncHandler from "../utils/asyncHandler.js";

export const createUser = asyncHandler(
  async (request, response) => {
    const user = await createUserByAdmin(
      request.validated.body
    );

    response.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user,
      },
    });
  }
);

export const getAllUsers = asyncHandler(
  async (request, response) => {
    const result = await getUsers(
      request.validated.query
    );

    response.status(200).json({
      success: true,
      data: {
        users: result.users,
        pagination: result.pagination,
      },
    });
  }
);

export const getSingleUser = asyncHandler(
  async (request, response) => {
    const { userId } =
      request.validated.params;

    const user = await getUserById(userId);

    response.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }
);

export const updateUser = asyncHandler(
  async (request, response) => {
    const { userId } =
      request.validated.params;

    const user = await updateUserByAdmin(
      userId,
      request.validated.body
    );

    response.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user,
      },
    });
  }
);

export const changeUserRole = asyncHandler(
  async (request, response) => {
    const { userId } =
      request.validated.params;

    const { role } =
      request.validated.body;

    const user = await updateUserRole({
      userId,
      newRole: role,
      currentAdminId:
        request.user.id.toString(),
    });

    response.status(200).json({
      success: true,
      message:
        "User role updated successfully",
      data: {
        user,
      },
    });
  }
);

export const changeUserStatus = asyncHandler(
  async (request, response) => {
    const { userId } =
      request.validated.params;

    const { isActive } =
      request.validated.body;

    const user = await updateUserStatus({
      userId,
      isActive,
      currentAdminId:
        request.user.id.toString(),
    });

    response.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: {
        user,
      },
    });
  }
);
