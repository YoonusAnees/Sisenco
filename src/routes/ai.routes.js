import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/environment.js";
import authenticate from "../middlewares/middleware.authenticate.js";
import validate from "../middlewares/middleware.validate.js";
import {
    sendAiMessageSchema,
    conversationIdSchema,
    listConversationsSchema,
} from "../validators/ai.validator.js";
import {
    handleAiChat,
    getConversations,
    getSingleConversation,
    deleteSingleConversation,
} from "../controllers/ai.controller.js";

const router = Router();

const aiRateLimiter = rateLimit({
    windowMs: env.aiRateLimitWindowMs,
    limit: env.nodeEnv === "test" ? 1000 : env.aiRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (request) =>
        request.user?._id
            ? request.user._id.toString()
            : request.user?.id
            ? request.user.id.toString()
            : "anonymous",
    message: {
        success: false,
        message: "Too many AI requests. Please try again later.",
    },
});

router.use(authenticate);

router.post(
    "/chat",
    aiRateLimiter,
    validate(sendAiMessageSchema),
    handleAiChat
);

router.get(
    "/conversations",
    validate(listConversationsSchema),
    getConversations
);

router.get(
    "/conversations/:conversationId",
    validate(conversationIdSchema),
    getSingleConversation
);

router.delete(
    "/conversations/:conversationId",
    validate(conversationIdSchema),
    deleteSingleConversation
);

export default router;
