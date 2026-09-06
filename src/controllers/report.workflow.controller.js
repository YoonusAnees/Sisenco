import {
    approveWeeklyReport,
    requestReportCorrection,
    submitWeeklyReport,
} from "../services/report.workflow.service.js";

import asyncHandler from "../utils/asyncHandler.js";

export const submitReport = asyncHandler(
    async (request, response) => {
        const { reportId } =
            request.validated.params;

        const result = await submitWeeklyReport({
            reportId,
            currentUser: request.user,
        });

        response.status(200).json({
            success: true,

            message: result.isResubmission
                ? "Weekly report resubmitted successfully"
                : "Weekly report submitted successfully",

            data: {
                report: result.report,
            },
        });
    }
);

export const requestCorrection =
    asyncHandler(
        async (request, response) => {
            const { reportId } =
                request.validated.params;

            const { correctionNote } =
                request.validated.body;

            const report =
                await requestReportCorrection({
                    reportId,
                    correctionNote,
                    currentUser: request.user,
                });

            response.status(200).json({
                success: true,
                message:
                    "Report returned for correction successfully",
                data: {
                    report,
                },
            });
        }
    );

export const approveReport = asyncHandler(
    async (request, response) => {
        const { reportId } =
            request.validated.params;

        const report =
            await approveWeeklyReport({
                reportId,
                currentUser: request.user,
            });

        response.status(200).json({
            success: true,
            message:
                "Weekly report approved successfully",
            data: {
                report,
            },
        });
    }
);