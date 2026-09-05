import {
  addProjectMember,
  createProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
} from "../services/project.service.js";

import asyncHandler from "../utils/asyncHandler.js";

export const createNewProject = asyncHandler(
  async (request, response) => {
    const project = await createProject({
      projectData: request.validated.body,
      currentUserId: request.user.id,
    });

    response.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project,
      },
    });
  }
);

export const getAllProjects = asyncHandler(
  async (request, response) => {
    const result = await getProjects({
      queryData: request.validated.query,
      currentUser: request.user,
    });

    response.status(200).json({
      success: true,
      data: {
        projects: result.projects,
        pagination: result.pagination,
      },
    });
  }
);

export const getSingleProject = asyncHandler(
  async (request, response) => {
    const { projectId } =
      request.validated.params;

    const project = await getProjectById({
      projectId,
      currentUser: request.user,
    });

    response.status(200).json({
      success: true,
      data: {
        project,
      },
    });
  }
);

export const updateExistingProject =
  asyncHandler(
    async (request, response) => {
      const { projectId } =
        request.validated.params;

      const project = await updateProject({
        projectId,
        updateData: request.validated.body,
        currentUserId: request.user.id,
      });

      response.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          project,
        },
      });
    }
  );

export const changeProjectStatus =
  asyncHandler(
    async (request, response) => {
      const { projectId } =
        request.validated.params;

      const { status } =
        request.validated.body;

      const project =
        await updateProjectStatus({
          projectId,
          status,
          currentUserId: request.user.id,
        });

      response.status(200).json({
        success: true,
        message:
          status === "active"
            ? "Project activated successfully"
            : "Project deactivated successfully",
        data: {
          project,
        },
      });
    }
  );

export const assignProjectMember =
  asyncHandler(
    async (request, response) => {
      const { projectId } =
        request.validated.params;

      const { userId, projectRole } =
        request.validated.body;

      const membership =
        await addProjectMember({
          projectId,
          userId,
          projectRole,
          currentUser: request.user,
        });

      response.status(201).json({
        success: true,
        message:
          "User assigned to project successfully",
        data: {
          membership,
        },
      });
    }
  );

export const getAllProjectMembers =
  asyncHandler(
    async (request, response) => {
      const { projectId } =
        request.validated.params;

      const { page, limit } =
        request.validated.query;

      const result =
        await getProjectMembers({
          projectId,
          page,
          limit,
          currentUser: request.user,
        });

      response.status(200).json({
        success: true,
        data: {
          members: result.members,
          pagination: result.pagination,
        },
      });
    }
  );

export const deleteProjectMember =
  asyncHandler(
    async (request, response) => {
      const { projectId, userId } =
        request.validated.params;

      await removeProjectMember({
        projectId,
        userId,
        currentUser: request.user,
      });

      response.status(200).json({
        success: true,
        message:
          "User removed from project successfully",
      });
    }
  );