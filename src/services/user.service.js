import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import { User } from "../models/index.js";
import AppError from "../utils/AppError.js";

const escapeRegularExpression = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

export const createUserByAdmin = async ({
    name,
    email,
    password,
    role,
    department,
    jobTitle,
}) => {
    const normalizedEmail =
        email.trim().toLowerCase();

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
        role,
        department,
        jobTitle,
    });

    return user;
};

export const getUsers = async ({
    page,
    limit,
    search,
    role,
    department,
    isActive,
    sortBy,
    sortOrder,
}) => {
    const filter = {};

    if (search) {
        const safeSearch =
            escapeRegularExpression(search);

        filter.$or = [
            {
                name: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
        ];
    }

    if (role) {
        filter.role = role;
    }

    if (department) {
        filter.department = {
            $regex:
                `^${escapeRegularExpression(department)}$`,
            $options: "i",
        };
    }

    if (typeof isActive === "boolean") {
        filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const sortDirection =
        sortOrder === "asc" ? 1 : -1;

    const [users, totalUsers] =
        await Promise.all([
            User.find(filter)
                .sort({
                    [sortBy]: sortDirection,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit),

            User.countDocuments(filter),
        ]);

    const totalPages = Math.ceil(
        totalUsers / limit
    );

    return {
        users,

        pagination: {
            page,
            limit,
            totalUsers,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

export const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User account not found",
            404
        );
    }

    return user;
};

export const updateUserByAdmin = async (
    userId,
    updateData
) => {
    const allowedFields = [
        "name",
        "department",
        "jobTitle",
    ];

    const safeUpdate = {};

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            safeUpdate[field] = updateData[field];
        }
    });

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: safeUpdate,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!user) {
        throw new AppError(
            "User account not found",
            404
        );
    }

    return user;
};

export const updateUserRole = async ({
    userId,
    newRole,
    currentAdminId,
}) => {
    if (userId === currentAdminId) {
        throw new AppError(
            "You cannot change your own role",
            400
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User account not found",
            404
        );
    }

    /*
     * If the target is an admin and their role is
     * being changed, make sure another active admin
     * remains in the system.
     */
    if (
        user.role === USER_ROLES.ADMIN &&
        newRole !== USER_ROLES.ADMIN &&
        user.isActive
    ) {
        const activeAdminCount =
            await User.countDocuments({
                role: USER_ROLES.ADMIN,
                isActive: true,
            });

        if (activeAdminCount <= 1) {
            throw new AppError(
                "The final active admin cannot be demoted",
                400
            );
        }
    }

    user.role = newRole;

    await user.save();

    return user;
};

export const updateUserStatus = async ({
    userId,
    isActive,
    currentAdminId,
}) => {
    if (userId === currentAdminId) {
        throw new AppError(
            "You cannot deactivate your own account",
            400
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User account not found",
            404
        );
    }

    /*
     * Prevent deactivation of the final active admin.
     */
    if (
        user.role === USER_ROLES.ADMIN &&
        user.isActive &&
        isActive === false
    ) {
        const activeAdminCount =
            await User.countDocuments({
                role: USER_ROLES.ADMIN,
                isActive: true,
            });

        if (activeAdminCount <= 1) {
            throw new AppError(
                "The final active admin cannot be deactivated",
                400
            );
        }
    }

    user.isActive = isActive;

    await user.save();

    return user;
};