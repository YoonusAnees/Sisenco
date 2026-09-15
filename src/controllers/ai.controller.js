import asyncHandler from "../utils/asyncHandler.js";
import {
    processAiMessage,
    getUserConversations,
    getConversationById,
    deleteConversation,
} from "../services/ai.service.js";

export const handleAiChat = asyncHandler(async (request, response) => {
    const { operation, message, conversationId, context } = request.validated.body;

    const result = await processAiMessage({
        currentUser: request.user,
        operation,
        message,
        conversationId,
        context,
    });

    response.status(200).json({
        success: true,
        data: result,
    });
});

export const getConversations = asyncHandler(async (request, response) => {
    const { page, limit } = request.validated.query;

    const result = await getUserConversations({
        userId: request.user.id,
        page,
        limit,
    });

    response.status(200).json({
        success: true,
        data: result,
    });
});

export const getSingleConversation = asyncHandler(async (request, response) => {
    const { conversationId } = request.validated.params;

    const conversation = await getConversationById({
        conversationId,
        userId: request.user.id,
    });

    response.status(200).json({
        success: true,
        data: { conversation },
    });
});

export const deleteSingleConversation = asyncHandler(async (request, response) => {
    const { conversationId } = request.validated.params;

    const result = await deleteConversation({
        conversationId,
        userId: request.user.id,
    });

    response.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
        data: result,
    });
});
