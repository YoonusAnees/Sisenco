import {
    PROJECT_STATUSES,
} from "../constants/constant.projects.js";

import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import { Project } from "../models/index.js";
import { ProjectMember } from "../models/index.js";
import { User } from "../models/index.js";
import AppError from "../utils/AppError.js";
import {
    sendProjectAssignedEmail,
} from "./workflow.email.service.js";

const escapeRegularExpression = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

const projectPopulation = [
    {
        path: "manager",
        select:
            "name email role department jobTitle isActive",
    },
    {
        path: "createdBy",
        select: "name email role",
    },
    {
        path: "updatedBy",
        select: "name email role",
    },
];

const ensureValidManager = async (managerId) => {
    if (!managerId) {
        throw new AppError(
            "A project manager must be assigned when creating a project",
            400
        );
    }

    const manager = await User.findById(managerId);

    if (!manager) {
        throw new AppError(
            "Selected project manager was not found",
            404
        );
    }

    if (!manager.isActive) {
        throw new AppError(
            "An inactive user cannot manage a project",
            400
        );
    }

    if (
        manager.role !== USER_ROLES.MANAGER &&
        manager.role !== USER_ROLES.ADMIN
    ) {
        throw new AppError(
            "Project manager must have the manager or admin role",
            400
        );
    }

    return manager;
};

const ensureProjectManagementPermission = (
    project,
    currentUser
) => {
    if (currentUser.role === USER_ROLES.ADMIN) {
        return;
    }

    if (currentUser.role === USER_ROLES.MANAGER) {
        if (
            project.manager?.toString() !==
            currentUser.id.toString()
        ) {
            throw new AppError(
                "You can only manage members for projects assigned to you as project manager",
                403
            );
        }
        return;
    }

    throw new AppError(
        "You are not authorised to manage this project",
        403
    );
};

const ensureManagerOwnsProject = (
    project,
    currentUser
) => {
    /*
     * Admin can manage every project.
     */
    if (currentUser.role === USER_ROLES.ADMIN) {
        return;
    }

    const assignedManagerId =
        project.manager?.toString();

    if (
        currentUser.role !== USER_ROLES.MANAGER ||
        assignedManagerId !==
        currentUser.id.toString()
    ) {
        throw new AppError(
            "You cannot manage members of this project",
            403
        );
    }
};

const canViewProject = async (
    project,
    currentUser
) => {
    if (
        currentUser.role === USER_ROLES.ADMIN ||
        currentUser.role === USER_ROLES.MANAGER
    ) {
        return true;
    }

    const membership = await ProjectMember.exists({
        project: project._id,
        user: currentUser.id,
    });

    return Boolean(membership);
};

export const createProject = async ({
    projectData,
    currentUserId,
}) => {
    const existingProject = await Project.exists({
        code: projectData.code.toUpperCase(),
    });

    if (existingProject) {
        throw new AppError(
            "A project with this code already exists",
            409
        );
    }

    const managerId =
        projectData.managerId || projectData.manager;

    if (!managerId) {
        throw new AppError(
            "A project manager must be assigned when creating a project",
            400
        );
    }

    await ensureValidManager(managerId);

    const project = await Project.create({
        name: projectData.name,
        code: projectData.code,
        description: projectData.description,
        category: projectData.category,

        manager: managerId,

        startDate:
            projectData.startDate || null,

        endDate:
            projectData.endDate || null,

        createdBy: currentUserId,
        updatedBy: currentUserId,
    });

    await project.populate(projectPopulation);

    return project;
};

export const getProjects = async ({
    queryData,
    currentUser,
}) => {
    const {
        page,
        limit,
        search,
        category,
        status,
        managerId,
        sortBy,
        sortOrder,
    } = queryData;

    const filter = {};

    /*
     * Admin:
     * Can view every project.
     */
    if (currentUser.role === USER_ROLES.ADMIN) {
        if (managerId) {
            filter.manager = managerId;
        }
    }

    /*
     * Manager:
     * Can only view projects assigned to them.
     *
     * Ignore any managerId supplied in the URL.
     * Otherwise, a manager could request another
     * manager's projects.
     */
    if (currentUser.role === USER_ROLES.MANAGER) {
        filter.manager = currentUser.id;
    }

    /*
     * Member:
     * Can only view projects where they have
     * an active membership.
     */
    if (currentUser.role === USER_ROLES.MEMBER) {
        const memberships =
            await ProjectMembership.find({
                user: currentUser.id,
                isActive: true,
            }).select("project");

        filter._id = {
            $in: memberships.map(
                (membership) => membership.project
            ),
        };
    }

    if (search) {
        filter.$text = {
            $search: search,
        };
    }

    if (category) {
        filter.category = category;
    }

    if (status) {
        filter.status = status;
    }

    const skip = (page - 1) * limit;

    const direction =
        sortOrder === "asc" ? 1 : -1;

    const [projects, totalProjects] =
        await Promise.all([
            Project.find(filter)
                .populate(
                    "manager",
                    "name email department jobTitle"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    [sortBy]: direction,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit),

            Project.countDocuments(filter),
        ]);

    return {
        projects,

        pagination: {
            page,
            limit,
            totalProjects,
            totalPages: Math.ceil(
                totalProjects / limit
            ),
            hasNextPage:
                page * limit < totalProjects,
            hasPreviousPage: page > 1,
        },
    };
};

export const getProjectById = async ({
    projectId,
    currentUser,
}) => {
    const project = await Project.findById(
        projectId
    )
        .populate(
            "manager",
            "name email department jobTitle"
        )
        .populate(
            "createdBy",
            "name email"
        );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    if (
        currentUser.role === USER_ROLES.MANAGER &&
        project.manager?._id.toString() !==
        currentUser.id.toString()
    ) {
        throw new AppError(
            "You are not assigned to this project",
            403
        );
    }

    if (currentUser.role === USER_ROLES.MEMBER) {
        const membership =
            await ProjectMembership.exists({
                project: projectId,
                user: currentUser.id,
                isActive: true,
            });

        if (!membership) {
            throw new AppError(
                "You are not assigned to this project",
                403
            );
        }
    }

    return project;
};

export const updateProject = async ({
    projectId,
    updateData,
    currentUserId,
}) => {
    const project = await Project.findById(
        projectId
    );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    if (
        updateData.code &&
        updateData.code !== project.code
    ) {
        const duplicateCode = await Project.exists({
            code: updateData.code,
            _id: {
                $ne: projectId,
            },
        });

        if (duplicateCode) {
            throw new AppError(
                "A project with this code already exists",
                409
            );
        }
    }

    if (updateData.managerId !== undefined) {
        if (updateData.managerId !== null) {
            await ensureValidManager(
                updateData.managerId
            );
        }

        project.manager =
            updateData.managerId;
    }

    const allowedFields = [
        "name",
        "code",
        "description",
        "category",
        "startDate",
        "endDate",
    ];

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            /*
             * Empty date values are stored as null.
             */
            if (
                (field === "startDate" ||
                    field === "endDate") &&
                updateData[field] === null
            ) {
                project[field] = null;
            } else {
                project[field] = updateData[field];
            }
        }
    });

    project.updatedBy = currentUserId;

    /*
     * save() runs Mongoose validation, including
     * our start-date/end-date validation.
     */
    await project.save();

    await project.populate(projectPopulation);

    return project;
};

export const updateProjectStatus = async ({
    projectId,
    status,
    currentUserId,
}) => {
    const project = await Project.findById(
        projectId
    );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    project.status = status;
    project.updatedBy = currentUserId;

    await project.save();

    await project.populate(projectPopulation);

    return project;
};

export const addProjectMember = async ({
    projectId,
    userId,
    projectRole,
    currentUser,
}) => {
    const project = await Project.findById(
        projectId
    );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    ensureManagerOwnsProject(
        project,
        currentUser
    );

    ensureProjectManagementPermission(
        project,
        currentUser
    );

    if (
        project.status !== PROJECT_STATUSES.ACTIVE
    ) {
        throw new AppError(
            "Users cannot be assigned to an inactive project",
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

    if (!user.isActive) {
        throw new AppError(
            "An inactive user cannot be assigned to a project",
            400
        );
    }

    if (user.role !== USER_ROLES.MEMBER) {
        throw new AppError(
            "Projects can only be assigned to members, not to managers or administrators",
            400
        );
    }

    const existingMembership =
        await ProjectMember.exists({
            project: projectId,
            user: userId,
        });

    if (existingMembership) {
        throw new AppError(
            "This user is already assigned to the project",
            409
        );
    }

    const membership =
        await ProjectMember.create({
            project: projectId,
            user: userId,
            projectRole,
            assignedBy: currentUser.id,
        });

    await membership.populate([
        {
            path: "project",
            select:
                "name code category status manager",
        },
        {
            path: "user",
            select:
                "name email role department jobTitle isActive",
        },
        {
            path: "assignedBy",
            select: "name email role",
        },
    ]);

    const assigner = await User.findById(currentUser.id).select("name email");

    sendProjectAssignedEmail({
        member: user,
        assigner,
        project,
        projectRole,
    });

    return membership;
};

export const getProjectMembers = async ({
    projectId,
    page,
    limit,
    currentUser,
}) => {
    const project = await Project.findById(
        projectId
    );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    const hasAccess = await canViewProject(
        project,
        currentUser
    );

    if (!hasAccess) {
        throw new AppError(
            "You are not authorised to view this project's members",
            403
        );
    }

    const skip = (page - 1) * limit;

    const filter = {
        project: projectId,
    };

    const [members, totalMembers] =
        await Promise.all([
            ProjectMember.find(filter)
                .populate({
                    path: "user",
                    select:
                        "name email role department jobTitle isActive",
                })
                .populate({
                    path: "assignedBy",
                    select: "name email role",
                })
                .sort({
                    assignedAt: -1,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit),

            ProjectMember.countDocuments(filter),
        ]);

    const totalPages = Math.ceil(
        totalMembers / limit
    );

    return {
        members,

        pagination: {
            page,
            limit,
            totalMembers,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

export const removeProjectMember = async ({
    projectId,
    userId,
    currentUser,
}) => {
    const project = await Project.findById(
        projectId
    );

    if (!project) {
        throw new AppError(
            "Project not found",
            404
        );
    }

    ensureProjectManagementPermission(
        project,
        currentUser
    );

    const membership =
        await ProjectMember.findOneAndDelete({
            project: projectId,
            user: userId,
        });

    if (!membership) {
        throw new AppError(
            "This user is not assigned to the project",
            404
        );
    }

    return membership;
};