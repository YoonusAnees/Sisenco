import { USER_ROLES } from "../constants/constant.roles.js";
import { AI_OPERATIONS } from "../constants/constant.ai.js";
import { Project, ProjectMember, WeeklyReport, User } from "../models/index.js";
import AppError from "../utils/AppError.js";
import { stripSensitiveFields, wrapUntrustedData } from "../utils/sanitizeAiContext.js";

/**
 * Builds permission-aware, sanitized context for AI operations.
 */
export const buildAuthorizedAiContext = async ({ currentUser, operation, context = {} }) => {
    const { projectId, reportId, weekStart, weekEnd, page } = context;

    // 1. Role permission checks on manager operations
    if (
        (operation === AI_OPERATIONS.SUMMARIZE_REPORTS ||
         operation === AI_OPERATIONS.SUMMARIZE_BLOCKERS) &&
        currentUser.role === USER_ROLES.MEMBER
    ) {
        throw new AppError(
            "Only managers and administrators can request report or blocker summaries",
            403
        );
    }

    const authorizedData = {
        userRole: currentUser.role,
        userName: currentUser.name,
        currentPage: page || "dashboard",
    };

    // 2. Validate specific project context if requested
    let targetProject = null;
    if (projectId) {
        targetProject = await Project.findById(projectId).select(
            "name code category status manager startDate endDate"
        );

        if (!targetProject) {
            throw new AppError("Requested project was not found", 404);
        }

        if (currentUser.role === USER_ROLES.MANAGER) {
            const isManager =
                targetProject.manager &&
                targetProject.manager.toString() === currentUser.id.toString();

            if (!isManager) {
                throw new AppError(
                    "You do not manage the selected project",
                    403
                );
            }
        } else if (currentUser.role === USER_ROLES.MEMBER) {
            const isMember = await ProjectMember.exists({
                project: projectId,
                user: currentUser.id,
            });

            if (!isMember) {
                throw new AppError(
                    "You are not assigned to the selected project",
                    403
                );
            }
        }

        authorizedData.currentProject = {
            id: targetProject._id.toString(),
            name: targetProject.name,
            code: targetProject.code,
            category: targetProject.category,
            status: targetProject.status,
        };
    }

    // 3. Validate specific report context if requested
    if (reportId) {
        const report = await WeeklyReport.findById(reportId)
            .populate("owner", "name email department")
            .populate("completedTasks.project", "name code")
            .populate("nextWeekTasks.project", "name code")
            .populate("blockers.project", "name code")
            .populate("hoursBreakdown.project", "name code");

        if (!report) {
            throw new AppError("Requested weekly report was not found", 404);
        }

        if (currentUser.role === USER_ROLES.MEMBER) {
            if (report.owner._id.toString() !== currentUser.id.toString()) {
                throw new AppError(
                    "You are not authorized to access this report",
                    403
                );
            }
        } else if (currentUser.role === USER_ROLES.MANAGER) {
            // Ensure manager manages at least one project referenced in this report
            const projectIds = new Set();
            const sections = [
                report.completedTasks || [],
                report.nextWeekTasks || [],
                report.blockers || [],
                report.hoursBreakdown || [],
            ];
            sections.forEach((sec) =>
                sec.forEach((item) => {
                    const pid = item.project?._id || item.project;
                    if (pid) projectIds.add(pid.toString());
                })
            );

            const managedProjectExists = await Project.exists({
                _id: { $in: [...projectIds] },
                manager: currentUser.id,
            });

            if (!managedProjectExists && projectIds.size > 0) {
                throw new AppError(
                    "You can only access reports connected to projects you manage",
                    403
                );
            }
        }

        authorizedData.selectedReport = {
            id: report._id.toString(),
            status: report.status,
            weekStart: report.weekStart,
            weekEnd: report.weekEnd,
            ownerName: report.owner?.name,
            summary: report.summary,
            completedTasks: (report.completedTasks || []).map((t) => ({
                title: t.title,
                description: t.description,
                projectName: t.project?.name,
                hoursSpent: t.hoursSpent,
            })),
            nextWeekTasks: (report.nextWeekTasks || []).map((t) => ({
                title: t.title,
                description: t.description,
                projectName: t.project?.name,
                priority: t.priority,
            })),
            blockers: (report.blockers || []).map((b) => ({
                title: b.title,
                description: b.description,
                projectName: b.project?.name,
                impact: b.impact,
                assistanceNeeded: b.assistanceNeeded,
                isResolved: b.isResolved,
            })),
            hoursBreakdown: (report.hoursBreakdown || []).map((h) => ({
                projectName: h.project?.name,
                category: h.category,
                hours: h.hours,
            })),
        };
    }

    // 4. Operation-specific context gathering
    if (
        operation === AI_OPERATIONS.STRUCTURE_NOTES ||
        operation === AI_OPERATIONS.IMPROVE_WRITING
    ) {
        // Provide user's available projects so the AI can resolve project names to IDs
        let projectList = [];
        if (currentUser.role === USER_ROLES.MEMBER) {
            const memberships = await ProjectMember.find({
                user: currentUser.id,
            }).populate("project", "name code category status");

            projectList = memberships
                .map((m) => m.project)
                .filter((p) => p && p.status === "active")
                .map((p) => ({
                    id: p._id.toString(),
                    name: p.name,
                    code: p.code,
                }));
        } else if (currentUser.role === USER_ROLES.MANAGER) {
            const projects = await Project.find({
                manager: currentUser.id,
                status: "active",
            }).select("name code");

            projectList = projects.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                code: p.code,
            }));
        } else if (currentUser.role === USER_ROLES.ADMIN) {
            const projects = await Project.find({ status: "active" })
                .select("name code")
                .limit(50);

            projectList = projects.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                code: p.code,
            }));
        }

        authorizedData.availableProjects = projectList;
    } else if (operation === AI_OPERATIONS.SUMMARIZE_REPORTS) {
        // Load reports for the manager's authorized projects
        let projectIds = [];
        if (currentUser.role === USER_ROLES.MANAGER) {
            if (projectId) {
                projectIds = [projectId];
            } else {
                const managedProjects = await Project.find({
                    manager: currentUser.id,
                }).distinct("_id");
                projectIds = managedProjects.map((id) => id.toString());
            }
        } else if (currentUser.role === USER_ROLES.ADMIN) {
            if (projectId) {
                projectIds = [projectId];
            } else {
                const allProjects = await Project.find({}).distinct("_id");
                projectIds = allProjects.map((id) => id.toString());
            }
        }

        if (projectIds.length === 0) {
            authorizedData.reportsSummary = {
                reportsFound: 0,
                message: "No managed projects found for this manager.",
                reports: [],
            };
        } else {
            const reportQuery = {
                $or: [
                    { "completedTasks.project": { $in: projectIds } },
                    { "nextWeekTasks.project": { $in: projectIds } },
                    { "blockers.project": { $in: projectIds } },
                    { "hoursBreakdown.project": { $in: projectIds } },
                ],
            };

            if (weekStart) {
                reportQuery.weekStart = new Date(weekStart);
            }

            const reports = await WeeklyReport.find(reportQuery)
                .populate("owner", "name department")
                .populate("completedTasks.project", "name code")
                .populate("nextWeekTasks.project", "name code")
                .populate("blockers.project", "name code")
                .populate("achievements.project", "name code")
                .sort({ weekStart: -1, createdAt: -1 })
                .limit(20);

            authorizedData.reportsSummary = {
                reportsFound: reports.length,
                reports: reports.map((r) => ({
                    id: r._id.toString(),
                    ownerName: r.owner?.name || "Unknown Member",
                    department: r.owner?.department || "General",
                    status: r.status,
                    weekStart: r.weekStart,
                    weekEnd: r.weekEnd,
                    totalHours: r.totalHours,
                    summary: r.summary,
                    completedTasks: (r.completedTasks || []).map((t) => ({
                        title: t.title,
                        hoursSpent: t.hoursSpent,
                        projectName: t.project?.name,
                    })),
                    nextWeekTasks: (r.nextWeekTasks || []).map((t) => ({
                        title: t.title,
                        priority: t.priority,
                        projectName: t.project?.name,
                    })),
                    achievements: (r.achievements || []).map((a) => a.title),
                    blockerCount: (r.blockers || []).filter((b) => !b.isResolved).length,
                })),
            };
        }
    } else if (operation === AI_OPERATIONS.SUMMARIZE_BLOCKERS) {
        // Load active blockers in the manager's authorized projects
        let projectIds = [];
        if (currentUser.role === USER_ROLES.MANAGER) {
            if (projectId) {
                projectIds = [projectId];
            } else {
                const managedProjects = await Project.find({
                    manager: currentUser.id,
                }).distinct("_id");
                projectIds = managedProjects.map((id) => id.toString());
            }
        } else if (currentUser.role === USER_ROLES.ADMIN) {
            if (projectId) {
                projectIds = [projectId];
            } else {
                const allProjects = await Project.find({}).distinct("_id");
                projectIds = allProjects.map((id) => id.toString());
            }
        }

        if (projectIds.length === 0) {
            authorizedData.blockersData = {
                blockersFound: 0,
                blockers: [],
            };
        } else {
            const reports = await WeeklyReport.find({
                "blockers.project": { $in: projectIds },
            })
                .populate("owner", "name email department")
                .populate("blockers.project", "name code")
                .sort({ weekStart: -1 })
                .limit(30);

            const activeBlockers = [];
            reports.forEach((r) => {
                (r.blockers || []).forEach((b) => {
                    const bProjectId = b.project?._id || b.project;
                    const matchesProject =
                        bProjectId && projectIds.includes(bProjectId.toString());

                    if (matchesProject && !b.isResolved) {
                        activeBlockers.push({
                            title: b.title,
                            description: b.description,
                            impact: b.impact || "Not specified",
                            assistanceNeeded: b.assistanceNeeded || "None requested",
                            projectName: b.project?.name || "Managed Project",
                            projectCode: b.project?.code,
                            reportedBy: r.owner?.name || "Team Member",
                            weekStart: r.weekStart,
                        });
                    }
                });
            });

            authorizedData.blockersData = {
                blockersFound: activeBlockers.length,
                blockers: activeBlockers,
            };
        }
    }

    const sanitizedContext = stripSensitiveFields(authorizedData);
    return sanitizedContext;
};
