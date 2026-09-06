import { ReportVersion } from "../models/index.js";

import {
    getWeeklyReportById,
} from "../services/report.service.js";

import AppError from "../utils/AppError.js";

export const getReportVersions = async ({
    reportId,
    page,
    limit,
    currentUser,
}) => {
    /*
     * Reuse the existing report-access logic.
     * This checks owner, admin and assigned-manager
     * permissions.
     */
    await getWeeklyReportById({
        reportId,
        currentUser,
    });

    const skip = (page - 1) * limit;

    const filter = {
        report: reportId,
    };

    const [versions, totalVersions] =
        await Promise.all([
            ReportVersion.find(filter)
                .select("-snapshot")
                .populate({
                    path: "submittedBy",
                    select: "name email role",
                })
                .sort({
                    versionNumber: -1,
                })
                .skip(skip)
                .limit(limit),

            ReportVersion.countDocuments(filter),
        ]);

    const totalPages = Math.ceil(
        totalVersions / limit
    );

    return {
        versions,

        pagination: {
            page,
            limit,
            totalVersions,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

export const getReportVersion = async ({
    reportId,
    versionNumber,
    currentUser,
}) => {
    await getWeeklyReportById({
        reportId,
        currentUser,
    });

    const version =
        await ReportVersion.findOne({
            report: reportId,
            versionNumber,
        })
            .populate({
                path: "owner",
                select:
                    "name email role department jobTitle",
            })
            .populate({
                path: "submittedBy",
                select: "name email role",
            });

    if (!version) {
        throw new AppError(
            "Report version not found",
            404
        );
    }

    return version;
};