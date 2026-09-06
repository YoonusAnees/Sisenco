import {
    getReportVersion,
    getReportVersions,
} from "../services/report.version.service.js";

import asyncHandler from
    "../utils/asyncHandler.js";

export const getAllReportVersions =
    asyncHandler(
        async (request, response) => {
            const { reportId } =
                request.validated.params;

            const { page, limit } =
                request.validated.query;

            const result =
                await getReportVersions({
                    reportId,
                    page,
                    limit,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    versions: result.versions,
                    pagination: result.pagination,
                },
            });
        }
    );

export const getSingleReportVersion =
    asyncHandler(
        async (request, response) => {
            const {
                reportId,
                versionNumber,
            } = request.validated.params;

            const version =
                await getReportVersion({
                    reportId,
                    versionNumber,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    version,
                },
            });
        }
    );