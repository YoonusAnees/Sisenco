import Project from "../../models/model.project.js";
import ProjectMember from "../../models/model.project.member.js";
import { PROJECT_MEMBER_ROLES } from "../../constants/constant.projects.js";
import { SEED_PROJECTS } from "../data/projects.seed.js";

/**
 * Seeds projects and project memberships in an idempotent manner.
 *
 * @param {Map<string, object>} userMap - Map of email to User document
 * @returns {Promise<{ projectMap: Map<string, object>, projectCount: number, memberCount: number }>}
 */
export const seedProjects = async (userMap) => {
  const adminUser = userMap.get("admin@weeklyreport.test");
  const projectMap = new Map();
  let projectCount = 0;
  let memberCount = 0;

  for (const projectData of SEED_PROJECTS) {
    const managerUser = userMap.get(projectData.managerEmail);

    let project = await Project.findOne({ code: projectData.code });

    if (project) {
      project.name = projectData.name;
      project.description = projectData.description;
      project.category = projectData.category;
      project.status = projectData.status;
      project.manager = managerUser ? managerUser._id : null;
      project.startDate = projectData.startDate;
      project.endDate = projectData.endDate;
      project.updatedBy = adminUser._id;
      await project.save();
    } else {
      project = new Project({
        name: projectData.name,
        code: projectData.code,
        description: projectData.description,
        category: projectData.category,
        status: projectData.status,
        manager: managerUser ? managerUser._id : null,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      });
      await project.save();
    }

    projectMap.set(project.code, project);
    projectCount++;
  }

  // Seed memberships for active projects
  const memberAssignments = [
    // Customer Portal (CUST-PORT)
    { projectCode: "CUST-PORT", userEmail: "member.one@weeklyreport.test", role: PROJECT_MEMBER_ROLES.LEAD },
    { projectCode: "CUST-PORT", userEmail: "member.two@weeklyreport.test", role: PROJECT_MEMBER_ROLES.MEMBER },
    { projectCode: "CUST-PORT", userEmail: "member.three@weeklyreport.test", role: PROJECT_MEMBER_ROLES.MEMBER },

    // Inventory Management (INV-MGMT)
    { projectCode: "INV-MGMT", userEmail: "member.one@weeklyreport.test", role: PROJECT_MEMBER_ROLES.MEMBER }, // Belongs to multiple projects!
    { projectCode: "INV-MGMT", userEmail: "member.four@weeklyreport.test", role: PROJECT_MEMBER_ROLES.LEAD },

    // Mobile Reporting Application (MOB-REP)
    { projectCode: "MOB-REP", userEmail: "member.two@weeklyreport.test", role: PROJECT_MEMBER_ROLES.MEMBER },
    { projectCode: "MOB-REP", userEmail: "member.five@weeklyreport.test", role: PROJECT_MEMBER_ROLES.MEMBER },
  ];

  for (const assignment of memberAssignments) {
    const proj = projectMap.get(assignment.projectCode);
    const usr = userMap.get(assignment.userEmail);

    if (proj && usr) {
      let membership = await ProjectMember.findOne({
        project: proj._id,
        user: usr._id,
      });

      if (membership) {
        membership.projectRole = assignment.role;
        await membership.save();
      } else {
        membership = new ProjectMember({
          project: proj._id,
          user: usr._id,
          projectRole: assignment.role,
          assignedBy: adminUser._id,
        });
        await membership.save();
      }
      memberCount++;
    }
  }

  return { projectMap, projectCount, memberCount };
};
