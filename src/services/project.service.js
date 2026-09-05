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
    return null;
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

  const managerId =
    project.manager?._id?.toString() ||
    project.manager?.toString();

  if (
    currentUser.role === USER_ROLES.MANAGER &&
    managerId === currentUser.id.toString()
  ) {
    return;
  }

  throw new AppError(
    "You are not authorised to manage this project",
    403
  );
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

  if (projectData.managerId) {
    await ensureValidManager(
      projectData.managerId
    );
  }

  const project = await Project.create({
    name: projectData.name,
    code: projectData.code,
    description: projectData.description,
    category: projectData.category,

    manager:
      projectData.managerId || null,

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
        code: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

  if (managerId) {
    filter.manager = managerId;
  }

  /*
   * Members can only see projects to which
   * they have been assigned.
   */
  if (currentUser.role === USER_ROLES.MEMBER) {
    const memberships =
      await ProjectMember.find({
        user: currentUser.id,
      }).select("project");

    filter._id = {
      $in: memberships.map(
        (membership) => membership.project
      ),
    };
  }

  const skip = (page - 1) * limit;

  const sortDirection =
    sortOrder === "asc" ? 1 : -1;

  const [projects, totalProjects] =
    await Promise.all([
      Project.find(filter)
        .populate(projectPopulation)
        .sort({
          [sortBy]: sortDirection,
          _id: 1,
        })
        .skip(skip)
        .limit(limit),

      Project.countDocuments(filter),
    ]);

  const totalPages = Math.ceil(
    totalProjects / limit
  );

  return {
    projects,

    pagination: {
      page,
      limit,
      totalProjects,
      totalPages,
      hasNextPage: page < totalPages,
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
  ).populate(projectPopulation);

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
      "You are not authorised to view this project",
      403
    );
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