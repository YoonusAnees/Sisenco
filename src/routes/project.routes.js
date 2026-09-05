import { Router } from "express";

import {
  assignProjectMember,
  changeProjectStatus,
  createNewProject,
  deleteProjectMember,
  getAllProjectMembers,
  getAllProjects,
  getSingleProject,
  updateExistingProject,
} from "../controllers/project.controller.js";

import {
  USER_ROLES,
} from "../constants/constant.roles.js";

import authenticate from
  "../middlewares/middleware.authenticate.js";

import authorize from
  "../middlewares/middleware.authorize.js";

import validate from
  "../middlewares/middleware.validate.js";

import {
  addProjectMemberSchema,
  createProjectSchema,
  getProjectByIdSchema,
  getProjectMembersSchema,
  getProjectsSchema,
  removeProjectMemberSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} from "../validators/project.validator.js";

const router = Router();

/*
 * Every project endpoint requires login.
 */
router.use(authenticate);

/*
 * Every authenticated role may request projects.
 * The service limits members to assigned projects.
 */
router.get(
  "/",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getProjectsSchema),
  getAllProjects
);

/*
 * Only admins can create projects.
 */
router.post(
  "/",
  authorize(USER_ROLES.ADMIN),
  validate(createProjectSchema),
  createNewProject
);

/*
 * Get the members assigned to one project.
 */
router.get(
  "/:projectId/members",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getProjectMembersSchema),
  getAllProjectMembers
);

/*
 * Managers and admins may assign members.
 * The service verifies that a manager owns
 * the selected project.
 */
router.post(
  "/:projectId/members",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(addProjectMemberSchema),
  assignProjectMember
);

/*
 * Managers and admins may remove members.
 */
router.delete(
  "/:projectId/members/:userId",
  authorize(
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(removeProjectMemberSchema),
  deleteProjectMember
);

/*
 * Only admins may activate or deactivate projects.
 */
router.patch(
  "/:projectId/status",
  authorize(USER_ROLES.ADMIN),
  validate(updateProjectStatusSchema),
  changeProjectStatus
);

/*
 * Every authenticated user may request one project.
 * The service verifies whether a member is assigned.
 */
router.get(
  "/:projectId",
  authorize(
    USER_ROLES.MEMBER,
    USER_ROLES.MANAGER,
    USER_ROLES.ADMIN
  ),
  validate(getProjectByIdSchema),
  getSingleProject
);

/*
 * Only admins may update project information.
 */
router.patch(
  "/:projectId",
  authorize(USER_ROLES.ADMIN),
  validate(updateProjectSchema),
  updateExistingProject
);

export default router;