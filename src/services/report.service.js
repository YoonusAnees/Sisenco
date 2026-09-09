import {
    PROJECT_STATUSES,
} from "../constants/constant.projects.js";

import {
    REPORT_STATUSES,
} from "../constants/constant.reports.js";

import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import { Project, ProjectMember, WeeklyReport } from "../models/index.js";
import AppError from "../utils/AppError.js";

const reportPopulation = [
    {
        path: "owner",
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
    {
        path: "completedTasks.project",
        select: "name code category status manager",
    },
    {
        path: "nextWeekTasks.project",
        select: "name code category status manager",
    },
    {
        path: "blockers.project",
        select: "name code category status manager",
    },
    {
        path: "achievements.project",
        select: "name code category status manager",
    },
    {
        path: "hoursBreakdown.project",
        select: "name code category status manager",
    },

    {
        path: "approvedBy",
        select: "name email role",
    },
    {
        path: "correctionRequestedBy",
        select: "name email role",
    },
];

const escapeRegularExpression = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

const normalizeWeekStart = (weekStart) => {
    const date = new Date(`${weekStart}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
        throw new AppError(
            "Invalid reporting week date",
            400
        );
    }

    /*
     * getUTCDay() returns:
     * Sunday = 0
     * Monday = 1
     */
    if (date.getUTCDay() !== 1) {
        throw new AppError(
            "The reporting week must start on a Monday",
            400
        );
    }

    return date;
};

const calculateWeekEnd = (weekStart) => {
    const weekEnd = new Date(weekStart);

    weekEnd.setUTCDate(
        weekEnd.getUTCDate() + 6
    );

    weekEnd.setUTCHours(
        23,
        59,
        59,
        999
    );

    return weekEnd;
};

const collectProjectIds = (reportData) => {
    const projectIds = new Set();

    const sections = [
        reportData.completedTasks || [],
        reportData.nextWeekTasks || [],
        reportData.blockers || [],
        reportData.achievements || [],
        reportData.hoursBreakdown || [],
    ];

    sections.forEach((section) => {
        section.forEach((entry) => {
            if (entry.project) {
                projectIds.add(
                    entry.project.toString()
                );
            }
        });
    });

    return [...projectIds];
};

const validateProjectAccess = async ({
    projectIds,
    currentUser,
}) => {
    if (projectIds.length === 0) {
        return;
    }

    const projects = await Project.find({
        _id: {
            $in: projectIds,
        },
    }).select("_id name status manager");

    if (projects.length !== projectIds.length) {
        throw new AppError(
            "One or more selected projects were not found",
            404
        );
    }

    const inactiveProject =
        projects.find(
            (project) =>
                project.status !==
                PROJECT_STATUSES.ACTIVE
        );

    if (inactiveProject) {
        throw new AppError(
            `Project "${inactiveProject.name}" is inactive`,
            400
        );
    }

    /*
     * Admins may record work against any
     * active project.
     */
    if (currentUser.role === USER_ROLES.ADMIN) {
        return;
    }

    /*
     * A manager may use:
     * 1. A project they manage, or
     * 2. A project where they are a member.
     */
    const managedProjectIds = new Set(
        projects
            .filter((project) => {
                return (
                    project.manager?.toString() ===
                    currentUser.id.toString()
                );
            })
            .map((project) =>
                project._id.toString()
            )
    );

    const membershipProjectIds =
        await ProjectMember.find({
            user: currentUser.id,
            project: {
                $in: projectIds,
            },
        }).distinct("project");

    const accessibleProjectIds = new Set([
        ...managedProjectIds,
        ...membershipProjectIds.map((id) =>
            id.toString()
        ),
    ]);

    const forbiddenProject =
        projects.find((project) => {
            return !accessibleProjectIds.has(
                project._id.toString()
            );
        });

    if (forbiddenProject) {
        throw new AppError(
            `You are not assigned to project "${forbiddenProject.name}"`,
            403
        );
    }
};

const canViewReport = async ({
    report,
    currentUser,
}) => {
    const ownerId =
        report.owner?._id?.toString() ||
        report.owner?.toString();

    if (
        ownerId === currentUser.id.toString()
    ) {
        return true;
    }

    if (currentUser.role === USER_ROLES.ADMIN) {
        return true;
    }

    if (currentUser.role !== USER_ROLES.MANAGER) {
        return false;
    }

    const projectIds = collectProjectIds(
        report.toObject
            ? report.toObject()
            : report
    );

    if (projectIds.length === 0) {
        return false;
    }

    /*
     * A manager may view the report if it
     * contains at least one project they manage.
     */
    const managedProjectExists =
        await Project.exists({
            _id: {
                $in: projectIds,
            },
            manager: currentUser.id,
        });

    return Boolean(managedProjectExists);
};

export const createWeeklyReport = async ({
    reportData,
    currentUser,
}) => {
    if (currentUser.role !== USER_ROLES.MEMBER) {
        throw new AppError(
            "Only members can create weekly reports. Managers and administrators review and approve reports submitted by members.",
            403
        );
    }

    const weekStart = normalizeWeekStart(
        reportData.weekStart
    );

    const weekEnd =
        calculateWeekEnd(weekStart);

    const existingReport =
        await WeeklyReport.exists({
            owner: currentUser.id,
            weekStart,
        });

    if (existingReport) {
        throw new AppError(
            "You already have a report for this week",
            409
        );
    }

    const projectIds =
        collectProjectIds(reportData);

    await validateProjectAccess({
        projectIds,
        currentUser,
    });

    const report = await WeeklyReport.create({
        owner: currentUser.id,
        weekStart,
        weekEnd,
        summary: reportData.summary,
        completedTasks:
            reportData.completedTasks,
        nextWeekTasks:
            reportData.nextWeekTasks,
        blockers: reportData.blockers,
        achievements:
            reportData.achievements,
        hoursBreakdown:
            reportData.hoursBreakdown,
        links: reportData.links,
        status: REPORT_STATUSES.DRAFT,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
    });

    await report.populate(reportPopulation);

    return report;
};

export const getMyWeeklyReports = async ({
    queryData,
    currentUserId,
}) => {
    const {
        page,
        limit,
        status,
        year,
        search,
        sortOrder,
    } = queryData;

    const filter = {
        owner: currentUserId,
    };

    if (status) {
        filter.status = status;
    }

    if (year) {
        filter.weekStart = {
            $gte: new Date(
                `${year}-01-01T00:00:00.000Z`
            ),

            $lt: new Date(
                `${year + 1}-01-01T00:00:00.000Z`
            ),
        };
    }

    if (search) {
        const safeSearch =
            escapeRegularExpression(search);

        filter.$or = [
            {
                summary: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                "completedTasks.title": {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                "nextWeekTasks.title": {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                "blockers.title": {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                "achievements.title": {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
        ];
    }

    const skip = (page - 1) * limit;

    const sortDirection =
        sortOrder === "asc" ? 1 : -1;

    const [reports, totalReports] =
        await Promise.all([
            WeeklyReport.find(filter)
                .populate(reportPopulation)
                .sort({
                    weekStart: sortDirection,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit),

            WeeklyReport.countDocuments(filter),
        ]);

    const totalPages = Math.ceil(
        totalReports / limit
    );

    return {
        reports,

        pagination: {
            page,
            limit,
            totalReports,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

export const getWeeklyReportById = async ({
    reportId,
    currentUser,
}) => {
    const report = await WeeklyReport.findById(
        reportId
    ).populate(reportPopulation);

    if (!report) {
        throw new AppError(
            "Weekly report not found",
            404
        );
    }

    const hasAccess = await canViewReport({
        report,
        currentUser,
    });

    if (!hasAccess) {
        throw new AppError(
            "You are not authorised to view this report",
            403
        );
    }

    return report;
};

export const updateWeeklyReport = async ({
    reportId,
    updateData,
    currentUser,
}) => {
    if (currentUser.role !== USER_ROLES.MEMBER) {
        throw new AppError(
            "Only members can edit weekly reports. Managers and administrators use the approve or request-correction actions instead.",
            403
        );
    }

    const report = await WeeklyReport.findById(
        reportId
    );

    if (!report) {
        throw new AppError(
            "Weekly report not found",
            404
        );
    }

    if (
        report.owner.toString() !==
        currentUser.id.toString()
    ) {
        throw new AppError(
            "You can only update your own report",
            403
        );
    }

    const editableStatuses = [
        REPORT_STATUSES.DRAFT,
        REPORT_STATUSES.NEEDS_CORRECTION,
    ];

    if (
        !editableStatuses.includes(report.status)
    ) {
        throw new AppError(
            "Only draft reports or reports needing correction can be updated",
            400
        );
    }

    /*
     * Create a complete representation using
     * existing values plus the supplied updates.
 */
const mergedReportData = {
    completedTasks:
        updateData.completedTasks ??
        report.completedTasks,

    nextWeekTasks:
        updateData.nextWeekTasks ??
        report.nextWeekTasks,

    blockers:
        updateData.blockers ??
        report.blockers,

    achievements:
        updateData.achievements ??
        report.achievements,

    hoursBreakdown:
        updateData.hoursBreakdown ??
        report.hoursBreakdown,
};

const projectIds =
    collectProjectIds(mergedReportData);

await validateProjectAccess({
    projectIds,
    currentUser,
});

const allowedFields = [
    "summary",
    "completedTasks",
    "nextWeekTasks",
    "blockers",
    "achievements",
    "hoursBreakdown",
    "links",
];

allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
        report[field] = updateData[field];
    }
});

report.updatedBy = currentUser.id;

/*
 * save() executes schema validation and
 * recalculates totalHours.
 */
await report.save();

await report.populate(reportPopulation);

return report;
};