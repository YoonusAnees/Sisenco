import mongoose from "mongoose";

import {
    REPORT_STATUSES,
} from "../constants/constant.reports.js";

import {
    USER_ROLES,
} from "../constants/constant.roles.js";

import {
    Project, Review, WeeklyReport
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
            ...statusCounts,
            pendingReviews,
            lateReports,

            openBlockers:
                openBlockersResult[0]?.count ||
                0,

            submissionCompliance,
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

    return trends;
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

    const results =
        await WeeklyReport.aggregate([
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
            {
                $group: {
                    _id: "$_id.owner",

                    statuses: {
                        $push: {
                            status: "$_id.status",
                            count: "$count",
                        },
                    },

                    totalReports: {
                        $sum: "$count",
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 0,

                    user: {
                        id: "$user._id",
                        name: "$user.name",
                        email: "$user.email",
                        department:
                            "$user.department",
                        jobTitle:
                            "$user.jobTitle",
                    },

                    statuses: 1,
                    totalReports: 1,
                },
            },
            {
                $sort: {
                    "user.name": 1,
                },
            },
        ]);

    return results.map((item) => {
        const counts = {
            draft: 0,
            submitted: 0,
            needsCorrection: 0,
            approved: 0,
        };

        item.statuses.forEach((entry) => {
            if (entry.status === "draft") {
                counts.draft = entry.count;
            }

            if (entry.status === "submitted") {
                counts.submitted = entry.count;
            }

            if (
                entry.status ===
                "needs_correction"
            ) {
                counts.needsCorrection =
                    entry.count;
            }

            if (entry.status === "approved") {
                counts.approved = entry.count;
            }
        });

        return {
            user: item.user,
            totalReports: item.totalReports,
            ...counts,
        };
    });
};

export const getProjectWorkload =
    async ({
        filters,
        currentUser,
    }) => {
        const match =
            await buildDashboardMatch({
                filters,
                currentUser,
            });

        return WeeklyReport.aggregate([
            {
                $match: match,
            },
            {
                $unwind: "$hoursBreakdown",
            },
            {
                $group: {
                    _id:
                        "$hoursBreakdown.project",

                    totalHours: {
                        $sum:
                            "$hoursBreakdown.hours",
                    },

                    entries: {
                        $sum: 1,
                    },

                    contributors: {
                        $addToSet: "$owner",
                    },
                },
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "_id",
                    as: "project",
                },
            },
            {
                $unwind: "$project",
            },
            {
                $project: {
                    _id: 0,

                    project: {
                        id: "$project._id",
                        name: "$project.name",
                        code: "$project.code",
                        category:
                            "$project.category",
                    },

                    totalHours: {
                        $round: [
                            "$totalHours",
                            2,
                        ],
                    },

                    entries: 1,

                    contributorCount: {
                        $size: "$contributors",
                    },
                },
            },
            {
                $sort: {
                    totalHours: -1,
                },
            },
        ]);
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

        return results.map((item) => ({
            ...item,

            percentage:
                overallHours === 0
                    ? 0
                    : Math.round(
                        (item.totalHours /
                            overallHours) *
                        10000
                    ) / 100,
        }));
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

        const reportActivities =
            reports.map((report) => ({
                type: "report_updated",
                occurredAt: report.updatedAt,

                report: {
                    id: report._id,
                    weekStart: report.weekStart,
                    status: report.status,
                    currentVersion:
                        report.currentVersion,
                },

                actor: report.owner,
            }));

        const reviewActivities =
            reviews.map((review) => ({
                type:
                    review.action === "approved"
                        ? "report_approved"
                        : "changes_requested",

                occurredAt:
                    review.reviewedAt,

                report: {
                    id: review.report?._id,
                    weekStart:
                        review.report?.weekStart,
                    status:
                        review.report?.status,
                },

                actor: review.reviewer,
                comment: review.comment,
                versionNumber:
                    review.versionNumber,
            }));

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