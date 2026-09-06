import {
  createWeeklyReport,
  getMyWeeklyReports,
  getWeeklyReportById,
  updateWeeklyReport,
} from "../services/report.service.js";

import asyncHandler from "../utils/asyncHandler.js";

export const createReport = asyncHandler(
  async (request, response) => {
    const report = await createWeeklyReport({
      reportData: request.validated.body,
      currentUser: request.user,
    });

    response.status(201).json({
      success: true,
      message:
        "Weekly report draft created successfully",
      data: {
        report,
      },
    });
  }
);

export const getMyReports = asyncHandler(
  async (request, response) => {
    const result =
      await getMyWeeklyReports({
        queryData: request.validated.query,
        currentUserId: request.user.id,
      });

    response.status(200).json({
      success: true,
      data: {
        reports: result.reports,
        pagination: result.pagination,
      },
    });
  }
);

export const getSingleReport = asyncHandler(
  async (request, response) => {
    const { reportId } =
      request.validated.params;

    const report =
      await getWeeklyReportById({
        reportId,
        currentUser: request.user,
      });

    response.status(200).json({
      success: true,
      data: {
        report,
      },
    });
  }
);

export const updateReport = asyncHandler(
  async (request, response) => {
    const { reportId } =
      request.validated.params;

    const report = await updateWeeklyReport({
      reportId,
      updateData: request.validated.body,
      currentUser: request.user,
    });

    response.status(200).json({
      success: true,
      message:
        "Weekly report draft updated successfully",
      data: {
        report,
      },
    });
  }
);