import {
    getDashboardActivity,
    getDashboardSummary,
    getProjectWorkload,
    getSectionComparison,
    getStatusByMember,
    getTaskTrends,
    getTimeDistribution,
} from "../services/dashboard.service.js";

import asyncHandler from
    "../utils/asyncHandler.js";

export const getSummary = asyncHandler(
    async (request, response) => {
        const data =
            await getDashboardSummary({
                filters:
                    request.validated.query,
                currentUser: request.user,
            });

        response.status(200).json({
            success: true,
            data,
        });
    }
);

export const getTrends = asyncHandler(
    async (request, response) => {
        const {
            limit,
            ...filters
        } = request.validated.query;

        const trends = await getTaskTrends({
            filters,
            limit,
            currentUser: request.user,
        });

        response.status(200).json({
            success: true,
            data: {
                trends,
            },
        });
    }
);

export const getMemberStatuses =
    asyncHandler(
        async (request, response) => {
            const members =
                await getStatusByMember({
                    filters:
                        request.validated.query,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    members,
                },
            });
        }
    );

export const getWorkload =
    asyncHandler(
        async (request, response) => {
            const projects =
                await getProjectWorkload({
                    filters:
                        request.validated.query,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    projects,
                },
            });
        }
    );

export const getDistribution =
    asyncHandler(
        async (request, response) => {
            const categories =
                await getTimeDistribution({
                    filters:
                        request.validated.query,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    categories,
                },
            });
        }
    );

export const getActivity =
    asyncHandler(
        async (request, response) => {
            const {
                limit,
                ...filters
            } = request.validated.query;

            const activity =
                await getDashboardActivity({
                    filters,
                    limit,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    activity,
                },
            });
        }
    );

export const getComparison =
    asyncHandler(
        async (request, response) => {
            const comparison =
                await getSectionComparison({
                    filters:
                        request.validated.query,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                data: {
                    comparison,
                },
            });
        }
    );