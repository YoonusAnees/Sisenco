import { env } from "../config/environment.js";
import {
    AI_OPERATIONS,
    ROLE_ALLOWED_AI_OPERATIONS,
} from "../constants/constant.ai.js";
import { AiConversation } from "../models/index.js";
import AppError from "../utils/AppError.js";
import { wrapUntrustedData } from "../utils/sanitizeAiContext.js";
import { aiStructuredReportSchema } from "../validators/ai.validator.js";
import { buildAuthorizedAiContext } from "./ai.context.service.js";
import { aiProvider } from "./ai.provider.service.js";
import { BASE_SYSTEM_PROMPT, getRoleContextPrompt } from "../prompts/prompt.aiBase.js";
import { REPORT_WRITER_PROMPT } from "../prompts/prompt.reportWriter.js";
import { MANAGER_SUMMARY_PROMPT } from "../prompts/prompt.managerSummary.js";
import { SYSTEM_HELP_PROMPT } from "../prompts/prompt.systemHelp.js";

const getOperationPrompt = (operation) => {
    switch (operation) {
        case AI_OPERATIONS.IMPROVE_WRITING:
        case AI_OPERATIONS.STRUCTURE_NOTES:
            return REPORT_WRITER_PROMPT;
        case AI_OPERATIONS.SUMMARIZE_REPORTS:
        case AI_OPERATIONS.SUMMARIZE_BLOCKERS:
            return MANAGER_SUMMARY_PROMPT;
        case AI_OPERATIONS.EXPLAIN_SYSTEM:
            return SYSTEM_HELP_PROMPT;
        case AI_OPERATIONS.CHAT:
        default:
            return `${REPORT_WRITER_PROMPT}\n${MANAGER_SUMMARY_PROMPT}\n${SYSTEM_HELP_PROMPT}`;
    }
};

/**
 * Dispatches an AI request, enforces permissions, formats context, and tracks conversation history.
 */
export const processAiMessage = async ({
    currentUser,
    operation,
    message,
    conversationId,
    context = {},
}) => {
    // 1. Role operation permission check
    const allowedOps = ROLE_ALLOWED_AI_OPERATIONS[currentUser.role] || [];
    if (!allowedOps.includes(operation)) {
        throw new AppError(
            `You are not authorized to perform the '${operation}' operation with role '${currentUser.role}'`,
            403
        );
    }

    // 2. Input length check
    if (message.length > env.aiMaxInputCharacters) {
        throw new AppError(
            `Message length of ${message.length} characters exceeds maximum limit of ${env.aiMaxInputCharacters}`,
            400
        );
    }

    // 3. Conversation verification (if provided)
    let conversation = null;
    if (conversationId) {
        conversation = await AiConversation.findById(conversationId);
        if (!conversation) {
            throw new AppError("Conversation not found", 404);
        }
        if (conversation.user.toString() !== currentUser.id.toString()) {
            throw new AppError(
                "You are not authorized to access this conversation",
                403
            );
        }
    }

    // 4. Gather authorized context
    const authorizedContext = await buildAuthorizedAiContext({
        currentUser,
        operation,
        context,
    });

    // 5. Assemble prompt chain
    const systemPromptParts = [
        BASE_SYSTEM_PROMPT,
        getRoleContextPrompt(currentUser),
        getOperationPrompt(operation),
        wrapUntrustedData("AUTHORIZED SYSTEM CONTEXT", authorizedContext),
    ];

    const messages = [
        {
            role: "system",
            content: systemPromptParts.join("\n\n"),
        },
    ];

    // Append prior conversation history if available (limit to recent 10 messages)
    if (conversation && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-10);
        recentMessages.forEach((m) => {
            messages.push({
                role: m.role,
                content: m.content,
            });
        });
    }

    // User's current prompt
    let userPromptText = message;
    if (operation === AI_OPERATIONS.IMPROVE_WRITING) {
        userPromptText = `Improve the following report writing while preserving its exact factual meaning without inventing work:\n\n${message}`;
    } else if (operation === AI_OPERATIONS.STRUCTURE_NOTES) {
        userPromptText = `Organize the following raw notes into structured Sisenco Weekly Report sections:\n\n${message}`;
    }

    messages.push({
        role: "user",
        content: userPromptText,
    });

    // 6. Invoke AI Provider
    const isStructured = operation === AI_OPERATIONS.STRUCTURE_NOTES;
    const responseFormat = isStructured ? "json" : "text";

    const aiRawReply = await aiProvider.executeAiCompletion({
        messages,
        responseFormat,
        temperature: isStructured ? 0.1 : 0.3,
    });

    let structuredReport = null;
    let replyText = aiRawReply;

    if (isStructured) {
        try {
            const parsed = JSON.parse(aiRawReply);
            // If the model wrapped it in a root key, extract it
            const reportPayload = parsed.structuredReport || parsed.report || parsed;
            const validationResult = aiStructuredReportSchema.safeParse(reportPayload);

            if (validationResult.success) {
                structuredReport = validationResult.data;
                replyText =
                    parsed.reply ||
                    "I organized your notes into structured weekly report sections. You can review and apply them below.";
            } else {
                structuredReport = null;
                replyText =
                    "I structured your notes, but some fields required adjustment. Please check the summary.";
            }
        } catch {
            structuredReport = null;
        }
    }

    // 7. Persist or update conversation
    const retentionMs = env.aiConversationRetentionDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + retentionMs);

    if (conversation) {
        conversation.messages.push({
            role: "user",
            content: message,
            operation,
        });
        conversation.messages.push({
            role: "assistant",
            content: replyText,
            operation,
            structuredReport,
        });
        conversation.lastActivityAt = new Date();
        conversation.expiresAt = expiresAt;
        await conversation.save();
    } else if (conversationId === undefined) {
        // Create conversation title based on first user message
        const titleSnippet = message.slice(0, 40).replace(/\n/g, " ").trim();
        conversation = await AiConversation.create({
            user: currentUser.id,
            title: titleSnippet.length > 0 ? titleSnippet : "Weekly Report Chat",
            messages: [
                {
                    role: "user",
                    content: message,
                    operation,
                },
                {
                    role: "assistant",
                    content: replyText,
                    operation,
                    structuredReport,
                },
            ],
            lastActivityAt: new Date(),
            expiresAt,
        });
    }

    return {
        reply: replyText,
        operation,
        structuredReport,
        conversationId: conversation ? conversation.id : null,
    };
};

/**
 * List user's conversations with pagination.
 */
export const getUserConversations = async ({ userId, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
        AiConversation.find({ user: userId })
            .select("title lastActivityAt createdAt messages")
            .sort({ lastActivityAt: -1 })
            .skip(skip)
            .limit(limit),
        AiConversation.countDocuments({ user: userId }),
    ]);

    return {
        conversations: conversations.map((c) => ({
            id: c.id,
            title: c.title,
            messageCount: c.messages?.length || 0,
            lastActivityAt: c.lastActivityAt,
            createdAt: c.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Retrieve one conversation ensuring user ownership.
 */
export const getConversationById = async ({ conversationId, userId }) => {
    const conversation = await AiConversation.findById(conversationId);
    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    if (conversation.user.toString() !== userId.toString()) {
        throw new AppError(
            "You are not authorized to view this conversation",
            403
        );
    }

    return conversation;
};

/**
 * Delete a user's conversation.
 */
export const deleteConversation = async ({ conversationId, userId }) => {
    const conversation = await AiConversation.findById(conversationId);
    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    if (conversation.user.toString() !== userId.toString()) {
        throw new AppError(
            "You are not authorized to delete this conversation",
            403
        );
    }

    await AiConversation.findByIdAndDelete(conversationId);

    return { id: conversationId };
};
