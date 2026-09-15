import mongoose from "mongoose";

import {
    REPORT_STATUSES,
} from "../constants/constant.reports.js";

import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import {
    Project, ProjectMember, Review, User, WeeklyReport
} from "../models/index.js";

import AppError from "../utils/AppError.js";

const projectPaths = [
    "completedTasks.project",
    "nextWeekTasks.project",
    "blockers.project",
    "achievements.project",
    "hoursBreakdown.project",
];

const toObjectId = (value) => {
    return new mongoose.Types.ObjectId(
        value.toString()
    );
};

const createProjectCondition = (
    projectIds
) => {
    return {
        $or: projectPaths.map((path) => ({
            [path]: {
                $in: projectIds,
            },
        })),
    };
};

const addCondition = (
    match,
    condition
) => {
    if (!match.$and) {
        match.$and = [];
    }

    match.$and.push(condition);
};

const buildDashboardMatch = async ({
    filters,
    currentUser,
}) => {
    const match = {};

    if (
        filters.startDate ||
        filters.endDate
    ) {
        match.weekStart = {};

        if (filters.startDate) {
            match.weekStart.$gte = new Date(
                `${filters.startDate}T00:00:00.000Z`
            );
        }

        if (filters.endDate) {
            match.weekStart.$lte = new Date(
                `${filters.endDate}T23:59:59.999Z`
            );
        }
    }

    /*
     * Members may only access their own data.
     */
    if (
        currentUser.role === USER_ROLES.MEMBER
    ) {
        match.owner = toObjectId(
            currentUser.id
        );

        if (
            filters.ownerId &&
            filters.ownerId !==
            currentUser.id.toString()
        ) {
            throw new AppError(
                "You cannot view another user's dashboard",
                403
            );
        }
    }

    /*
     * Managers see reports connected to projects
     * assigned to them as project manager.
     */
    if (
        currentUser.role === USER_ROLES.MANAGER
    ) {
        const managedProjectIds =
            await Project.find({
                manager: currentUser.id,
            }).distinct("_id");

        if (managedProjectIds.length === 0) {
            match._id = {
                $in: [],
            };
        } else {
            addCondition(
                match,
                createProjectCondition(
                    managedProjectIds
                )
            );
        }

        if (filters.ownerId) {
            match.owner = toObjectId(
                filters.ownerId
            );
        }
    }

    /*
     * Admins may filter by any report owner.
     */
    if (
        currentUser.role === USER_ROLES.ADMIN &&
        filters.ownerId
    ) {
        match.owner = toObjectId(
            filters.ownerId
        );
    }

    if (filters.projectId) {
        const projectObjectId = toObjectId(
            filters.projectId
        );

        if (
            currentUser.role ===
            USER_ROLES.MANAGER
        ) {
            const managesProject =
                await Project.exists({
                    _id: projectObjectId,
                    manager: currentUser.id,
                });

            if (!managesProject) {
                throw new AppError(
                    "You do not manage the selected project",
                    403
                );
            }
        }

        addCondition(
            match,
            createProjectCondition([
                projectObjectId,
            ])
        );
    }

    return match;
};

export const getDashboardSummary =
    async ({
        filters,
        currentUser,
    }) => {
        const match =
            await buildDashboardMatch({
                filters,
                currentUser,
            });

        const [
            statusTotals,
            openBlockersResult,
            lateReports,
            submittedReports,
        ] = await Promise.all([
            WeeklyReport.aggregate([
                {
                    $match: match,
                },
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            WeeklyReport.aggregate([
                {
                    $match: match,
                },
                {
                    $unwind: "$blockers",
                },
                {
                    $match: {
                        "blockers.isResolved": false,
                    },
                },
                {
                    $count: "count",
                },
            ]),

            WeeklyReport.countDocuments({
                ...match,

                status: {
                    $in: [
                        REPORT_STATUSES.SUBMITTED,
                        REPORT_STATUSES.APPROVED,
                    ],
                },

                $expr: {
                    $gt: [
                        "$submittedAt",
                        "$weekEnd",
                    ],
                },
            }),

            WeeklyReport.countDocuments({
                ...match,

                submittedAt: {
                    $ne: null,
                },
            }),
        ]);

        const statusCounts = {
            draft: 0,
            submitted: 0,
            needsCorrection: 0,
            approved: 0,
        };

        statusTotals.forEach((item) => {
            if (
                item._id ===
                REPORT_STATUSES.DRAFT
            ) {
                statusCounts.draft = item.count;
            }

            if (
                item._id ===
                REPORT_STATUSES.SUBMITTED
            ) {
                statusCounts.submitted =
                    item.count;
            }

            if (
                item._id ===
                REPORT_STATUSES.NEEDS_CORRECTION
            ) {
                statusCounts.needsCorrection =
                    item.count;
            }

            if (
                item._id ===
                REPORT_STATUSES.APPROVED
            ) {
                statusCounts.approved =
                    item.count;
            }
        });

        const totalReports =
            statusTotals.reduce(
                (total, item) =>
                    total + item.count,
                0
            );

        const pendingReviews =
            statusCounts.submitted;

        const submissionCompliance =
            totalReports === 0
                ? 0
                : Math.round(
                    (submittedReports /
                        totalReports) *
                    10000
                ) / 100;

        return {
            totalReports,
            draft: statusCounts.draft,
            submitted: statusCounts.submitted,
            submittedReports: statusCounts.submitted,
            pendingReviews,
            needsCorrection: statusCounts.needsCorrection,
            needsCorrectionReports: statusCounts.needsCorrection,
            approved: statusCounts.approved,
            approvedReports: statusCounts.approved,
            lateReports,

            openBlockers:
                openBlockersResult[0]?.count ||
                0,

            submissionCompliance,
            complianceRate: submissionCompliance,
        };
    };

export const getTaskTrends = async ({
    filters,
    limit,
    currentUser,
}) => {
    const match =
        await buildDashboardMatch({
            filters,
            currentUser,
        });

    const trends =
        await WeeklyReport.aggregate([
            {
                $match: match,
            },
            {
                $project: {
                    weekStart: 1,

                    completedTasks: {
                        $size: {
                            $ifNull: [
                                "$completedTasks",
                                [],
                            ],
                        },
                    },

                    plannedTasks: {
                        $size: {
                            $ifNull: [
                                "$nextWeekTasks",
                                [],
                            ],
                        },
                    },
                },
            },
            {
                $group: {
                    _id: "$weekStart",

                    completedTasks: {
                        $sum: "$completedTasks",
                    },

                    plannedTasks: {
                        $sum: "$plannedTasks",
                    },

                    reportCount: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    _id: -1,
                },
            },
            {
                $limit: limit,
            },
            {
                $sort: {
                    _id: 1,
                },
            },
            {
                $project: {
                    _id: 0,
                    weekStart: "$_id",
                    completedTasks: 1,
                    plannedTasks: 1,
                    reportCount: 1,
                },
            },
        ]);

    return trends.map((item) => {
        let period = "";
        if (item.weekStart) {
            try {
                const d = new Date(item.weekStart);
                period = d.toISOString().slice(0, 10);
            } catch {
                period = String(item.weekStart);
            }
        }
        return {
            ...item,
            period,
            hoursSpent: 0,
        };
    });
};

export const getStatusByMember = async ({
    filters,
    currentUser,
}) => {
    const match =
        await buildDashboardMatch({
            filters,
            currentUser,
        });

    // 1. Determine members to include
    let memberQuery = { role: USER_ROLES.MEMBER, isActive: true };

    if (currentUser.role === USER_ROLES.MANAGER) {
        const managedProjects = await Project.find({
            manager: currentUser.id,
        }).select("_id");
        const managedProjectIds = managedProjects.map((p) => p._id);

        const assignedUserIds = await ProjectMember.find({
            project: { $in: managedProjectIds },
        }).distinct("user");

        const reportOwners = await WeeklyReport.find(match).distinct("owner");

        const combinedUserIds = Array.from(
            new Set([
                ...assignedUserIds.map((id) => id.toString()),
                ...reportOwners.map((id) => id.toString()),
            ])
        );

        if (combinedUserIds.length > 0) {
            memberQuery._id = {
                $in: combinedUserIds.map((id) => toObjectId(id)),
            };
        }
    } else if (currentUser.role === USER_ROLES.MEMBER) {
        memberQuery._id = toObjectId(currentUser.id);
    }

    const teamUsers = await User.find(memberQuery)
        .select("_id name email role department jobTitle")
        .sort({ name: 1 })
        .lean();

    // 2. Fetch report counts grouped by owner and status
    const reportCounts = await WeeklyReport.aggregate([
        {
            $match: match,
        },
        {
            $group: {
                _id: {
                    owner: "$owner",
                    status: "$status",
                },
                count: {
                    $sum: 1,
                },
            },
        },
    ]);

    const countsMap = new Map();
    reportCounts.forEach((item) => {
        const ownerId = item._id.owner.toString();
        if (!countsMap.has(ownerId)) {
            countsMap.set(ownerId, {
                draft: 0,
                submitted: 0,
                needsCorrection: 0,
                approved: 0,
            });
        }
        const userCounts = countsMap.get(ownerId);
        if (item._id.status === REPORT_STATUSES.DRAFT) userCounts.draft += item.count;
        if (item._id.status === REPORT_STATUSES.SUBMITTED) userCounts.submitted += item.count;
        if (item._id.status === REPORT_STATUSES.NEEDS_CORRECTION) userCounts.needsCorrection += item.count;
        if (item._id.status === REPORT_STATUSES.APPROVED) userCounts.approved += item.count;
    });

    return teamUsers.map((u) => {
        const uId = u._id.toString();
        const counts = countsMap.get(uId) || {
            draft: 0,
            submitted: 0,
            needsCorrection: 0,
            approved: 0,
        };
        const totalReports =
            counts.draft +
            counts.submitted +
            counts.needsCorrection +
            counts.approved;

        return {
            userId: uId,
            name: u.name || "Unknown Member",
            email: u.email || "",
            role: u.role || USER_ROLES.MEMBER,
            department: u.department || "",
            jobTitle: u.jobTitle || "",
            draftCount: counts.draft,
            submittedCount: counts.submitted,
            needsCorrectionCount: counts.needsCorrection,
            approvedCount: counts.approved,
            totalReports,

            // Backward compatibility fields
            user: {
                id: uId,
                name: u.name || "Unknown Member",
                email: u.email || "",
                role: u.role || USER_ROLES.MEMBER,
                department: u.department || "",
                jobTitle: u.jobTitle || "",
            },
            draft: counts.draft,
            submitted: counts.submitted,
            needsCorrection: counts.needsCorrection,
            approved: counts.approved,
        };
    });
};

export const getProjectWorkload = async ({
    filters,
    currentUser,
}) => {
    const match = await buildDashboardMatch({
        filters,
        currentUser,
    });

    // 1. Get projects relevant to user
    const projectQuery = { status: "active" };
    if (currentUser.role === USER_ROLES.MANAGER) {
        projectQuery.manager = currentUser.id;
    } else if (filters?.projectId) {
        projectQuery._id = toObjectId(filters.projectId);
    }

    const projects = await Project.find(projectQuery)
        .select("_id name code category")
        .sort({ name: 1 })
        .lean();

    // 2. Aggregate hours and completed tasks from weekly reports
    const [hoursRows, taskRows] = await Promise.all([
        WeeklyReport.aggregate([
            { $match: match },
            { $unwind: "$hoursBreakdown" },
            {
                $group: {
                    _id: "$hoursBreakdown.project",
                    totalHours: { $sum: "$hoursBreakdown.hours" },
                    contributors: { $addToSet: "$owner" },
                },
            },
        ]),
        WeeklyReport.aggregate([
            { $match: match },
            { $unwind: "$completedTasks" },
            {
                $group: {
                    _id: "$completedTasks.project",
                    completedTaskCount: { $sum: 1 },
                },
            },
        ]),
    ]);

    const hoursMap = new Map(
        hoursRows.map((r) => [
            r._id.toString(),
            { hours: r.totalHours, contributors: r.contributors },
        ])
    );
    const taskMap = new Map(
        taskRows.map((r) => [r._id.toString(), r.completedTaskCount])
    );

    const resultMap = new Map();

    projects.forEach((proj) => {
        const pId = proj._id.toString();
        const hourData = hoursMap.get(pId) || { hours: 0, contributors: [] };
        const completedTasks = taskMap.get(pId) || 0;
        const roundedHours = Math.round(hourData.hours * 100) / 100;

        resultMap.set(pId, {
            projectId: pId,
            projectName: proj.name,
            projectCode: proj.code,
            hoursSpent: roundedHours,
            completedTaskCount: completedTasks,

            // Backward compatibility
            project: {
                id: pId,
                name: proj.name,
                code: proj.code,
                category: proj.category,
            },
            totalHours: roundedHours,
            contributorCount: hourData.contributors.length,
        });
    });

    // Also include any project referenced in reports not in initial query
    for (const [pId, hourData] of hoursMap.entries()) {
        if (!resultMap.has(pId)) {
            const extraProj = await Project.findById(pId)
                .select("_id name code category")
                .lean();
            if (extraProj) {
                const roundedHours = Math.round(hourData.hours * 100) / 100;
                resultMap.set(pId, {
                    projectId: pId,
                    projectName: extraProj.name,
                    projectCode: extraProj.code,
                    hoursSpent: roundedHours,
                    completedTaskCount: taskMap.get(pId) || 0,

                    project: {
                        id: pId,
                        name: extraProj.name,
                        code: extraProj.code,
                        category: extraProj.category,
                    },
                    totalHours: roundedHours,
                    contributorCount: hourData.contributors.length,
                });
            }
        }
    }

    const results = Array.from(resultMap.values());
    results.sort((a, b) => b.hoursSpent - a.hoursSpent);
    return results;
};

export const getTimeDistribution =
    async ({
        filters,
        currentUser,
    }) => {
        const match =
            await buildDashboardMatch({
                filters,
                currentUser,
            });

        const results =
            await WeeklyReport.aggregate([
                {
                    $match: match,
                },
                {
                    $unwind:
                        "$hoursBreakdown",
                },
                {
                    $group: {
                        _id:
                            "$hoursBreakdown.category",

                        totalHours: {
                            $sum:
                                "$hoursBreakdown.hours",
                        },
                    },
                },
                {
                    $sort: {
                        totalHours: -1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",

                        totalHours: {
                            $round: [
                                "$totalHours",
                                2,
                            ],
                        },
                    },
                },
            ]);

        const overallHours =
            results.reduce(
                (total, item) =>
                    total + item.totalHours,
                0
            );

        return results.map((item) => {
            const hours = item.totalHours;
            const percentage =
                overallHours === 0
                    ? 0
                    : Math.round(
                        (hours /
                            overallHours) *
                        10000
                    ) / 100;

            return {
                category: item.category,
                hours,
                totalHours: hours,
                percentage,
            };
        });
    };

export const getSectionComparison =
    async ({
        filters,
        currentUser,
    }) => {
        const match =
            await buildDashboardMatch({
                filters,
                currentUser,
            });

        const result =
            await WeeklyReport.aggregate([
                {
                    $match: match,
                },
                {
                    $group: {
                        _id: null,

                        completedTasks: {
                            $sum: {
                                $size: {
                                    $ifNull: [
                                        "$completedTasks",
                                        [],
                                    ],
                                },
                            },
                        },

                        plannedTasks: {
                            $sum: {
                                $size: {
                                    $ifNull: [
                                        "$nextWeekTasks",
                                        [],
                                    ],
                                },
                            },
                        },

                        blockers: {
                            $sum: {
                                $size: {
                                    $ifNull: [
                                        "$blockers",
                                        [],
                                    ],
                                },
                            },
                        },

                        achievements: {
                            $sum: {
                                $size: {
                                    $ifNull: [
                                        "$achievements",
                                        [],
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        completedTasks: 1,
                        plannedTasks: 1,
                        blockers: 1,
                        achievements: 1,
                    },
                },
            ]);

        return (
            result[0] || {
                completedTasks: 0,
                plannedTasks: 0,
                blockers: 0,
                achievements: 0,
            }
        );
    };

export const getDashboardActivity =
    async ({
        filters,
        limit,
        currentUser,
    }) => {
        const match =
            await buildDashboardMatch({
                filters,
                currentUser,
            });

        const reportIds =
            await WeeklyReport.distinct(
                "_id",
                match
            );

        const [reports, reviews] =
            await Promise.all([
                WeeklyReport.find(match)
                    .select(
                        "owner status weekStart currentVersion createdAt updatedAt"
                    )
                    .populate({
                        path: "owner",
                        select:
                            "name email department jobTitle",
                    })
                    .sort({
                        updatedAt: -1,
                    })
                    .limit(limit)
                    .lean(),

                Review.find({
                    report: {
                        $in: reportIds,
                    },
                })
                    .populate({
                        path: "reviewer",
                        select:
                            "name email role",
                    })
                    .populate({
                        path: "report",
                        select:
                            "owner weekStart status",
                        populate: {
                            path: "owner",
                            select:
                                "name email department",
                        },
                    })
                    .sort({
                        reviewedAt: -1,
                    })
                    .limit(limit)
                    .lean(),
            ]);

        const reportActivities = reports.map((report) => {
            const ownerObj = report.owner;
            const ownerId =
                ownerObj?._id?.toString() ||
                ownerObj?.id?.toString() ||
                (typeof ownerObj === "string" ? ownerObj : "");
            const ownerName = ownerObj?.name || "Team Member";
            const currentVer = report.currentVersion || 1;

            let title = `${ownerName} updated weekly report draft`;
            if (report.status === REPORT_STATUSES.SUBMITTED) {
                title = `${ownerName} submitted weekly report (v${currentVer})`;
            } else if (report.status === REPORT_STATUSES.APPROVED) {
                title = `Weekly report approved (v${currentVer})`;
            } else if (report.status === REPORT_STATUSES.NEEDS_CORRECTION) {
                title = `Corrections requested on weekly report (v${currentVer})`;
            }

            const timestamp = report.updatedAt || report.createdAt;

            return {
                id: `report-${report._id.toString()}-${new Date(timestamp).getTime()}`,
                type: "report_updated",
                title,
                details:
                    report.summary ||
                    `Weekly report for week of ${
                        report.weekStart
                            ? new Date(report.weekStart)
                                  .toISOString()
                                  .slice(0, 10)
                            : ""
                    }`,
                user: {
                    id: ownerId,
                    name: ownerName,
                },
                actor: ownerObj
                    ? {
                          id: ownerId,
                          name: ownerName,
                          email: ownerObj.email || "",
                          department: ownerObj.department || "",
                          jobTitle: ownerObj.jobTitle || "",
                      }
                    : { id: ownerId, name: ownerName },
                timestamp,
                occurredAt: timestamp,

                report: {
                    id: report._id.toString(),
                    weekStart: report.weekStart,
                    status: report.status,
                    currentVersion: report.currentVersion,
                },
            };
        });

        const reviewActivities = reviews.map((review) => {
            const reviewerObj = review.reviewer;
            const reviewerId =
                reviewerObj?._id?.toString() ||
                reviewerObj?.id?.toString() ||
                (typeof reviewerObj === "string" ? reviewerObj : "");
            const reviewerName = reviewerObj?.name || "Reviewer";
            const ownerObj = review.report?.owner;
            const ownerName = ownerObj?.name || "Team Member";

            const title =
                review.action === "approved"
                    ? `${reviewerName} approved ${ownerName}'s report`
                    : `${reviewerName} requested corrections on ${ownerName}'s report`;

            const timestamp = review.reviewedAt || review.createdAt;

            return {
                id: `review-${review._id.toString()}-${new Date(timestamp).getTime()}`,
                type:
                    review.action === "approved"
                        ? "report_approved"
                        : "changes_requested",
                title,
                details:
                    review.comment ||
                    `Review for version ${review.versionNumber}`,
                user: {
                    id: reviewerId,
                    name: reviewerName,
                },
                actor: reviewerObj
                    ? {
                          id: reviewerId,
                          name: reviewerName,
                          email: reviewerObj.email || "",
                          role: reviewerObj.role || "",
                      }
                    : { id: reviewerId, name: reviewerName },
                timestamp,
                occurredAt: timestamp,

                report: {
                    id: review.report?._id?.toString(),
                    weekStart: review.report?.weekStart,
                    status: review.report?.status,
                },
                comment: review.comment,
                versionNumber: review.versionNumber,
            };
        });

        return [
            ...reportActivities,
            ...reviewActivities,
        ]
            .sort((first, second) => {
                return (
                    new Date(
                        second.occurredAt
                    ).getTime() -
                    new Date(
                        first.occurredAt
                    ).getTime()
                );
            })
            .slice(0, limit);
    };