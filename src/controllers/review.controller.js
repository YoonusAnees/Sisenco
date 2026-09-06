import {
  approveReport,
  getManagerReviewQueue,
  getReportReviewHistory,
  requestReportChanges,
} from "../services/review.service.js";

import asyncHandler from
  "../utils/asyncHandler.js";

export const getReviewQueue =
  asyncHandler(
    async (request, response) => {
      const result =
        await getManagerReviewQueue({
          queryData:
            request.validated.query,
          currentUser: request.user,
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

export const requestChanges =
  asyncHandler(
    async (request, response) => {
      const { reportId } =
        request.validated.params;

      const { comment } =
        request.validated.body;

      const result =
        await requestReportChanges({
          reportId,
          comment,
          currentUser: request.user,
        });

      response.status(200).json({
        success: true,
        message:
          "Report corrections requested successfully",
        data: {
          report: result.report,
          review: result.review,
        },
      });
    }
  );

export const approve =
  asyncHandler(
    async (request, response) => {
      const { reportId } =
        request.validated.params;

      const { comment } =
        request.validated.body;

      const result = await approveReport({
        reportId,
        comment,
        currentUser: request.user,
      });

      response.status(200).json({
        success: true,
        message:
          "Report approved successfully",
        data: {
          report: result.report,
          review: result.review,
        },
      });
    }
  );

export const getReviewHistory =
  asyncHandler(
    async (request, response) => {
      const { reportId } =
        request.validated.params;

      const { page, limit } =
        request.validated.query;

      const result =
        await getReportReviewHistory({
          reportId,
          page,
          limit,
          currentUser: request.user,
        });

      response.status(200).json({
        success: true,
        data: {
          history: result.history,
          pagination: result.pagination,
        },
      });
    }
  );