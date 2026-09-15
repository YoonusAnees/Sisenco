import { GoogleGenAI } from "@google/genai";
import { env } from "../config/environment.js";
import AppError from "../utils/AppError.js";

let geminiClientInstance = null;

export const resetGeminiClient = () => {
    geminiClientInstance = null;
};

export const setGeminiClientInstance = (instance) => {
    geminiClientInstance = instance;
};

const getGeminiClient = () => {
    if (!env.aiAssistantEnabled) {
        throw new AppError(
            "AI Assistant service is currently disabled",
            503
        );
    }

    if (!env.geminiApiKey) {
        throw new AppError(
            "AI Assistant service is not configured with an API key",
            503
        );
    }

    if (!geminiClientInstance) {
        geminiClientInstance = new GoogleGenAI({
            apiKey: env.geminiApiKey,
        });
    }

    return geminiClientInstance;
};

/**
 * Converts standard internal message format to Gemini SDK format.
 * - System instructions are extracted to systemInstruction config.
 * - "assistant" role is mapped to Gemini "model" role.
 * - Consecutive messages with identical roles are combined to maintain alternating turns.
 */
export const convertMessagesToGemini = (messages = []) => {
    const systemParts = [];
    const contents = [];

    for (const msg of messages) {
        if (!msg) continue;
        if (msg.role === "system") {
            if (msg.content) {
                systemParts.push(msg.content);
            }
        } else if (msg.role === "assistant" || msg.role === "model") {
            contents.push({
                role: "model",
                parts: [{ text: msg.content || "" }],
            });
        } else {
            contents.push({
                role: "user",
                parts: [{ text: msg.content || "" }],
            });
        }
    }

    const mergedContents = [];
    for (const item of contents) {
        if (
            mergedContents.length > 0 &&
            mergedContents[mergedContents.length - 1].role === item.role
        ) {
            mergedContents[mergedContents.length - 1].parts.push(...item.parts);
        } else {
            mergedContents.push({
                role: item.role,
                parts: [...item.parts],
            });
        }
    }

    if (mergedContents.length === 0) {
        mergedContents.push({
            role: "user",
            parts: [{ text: "" }],
        });
    }

    return {
        systemInstruction: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
        contents: mergedContents,
    };
};

/**
 * Executes a chat completion via Google Gemini SDK (@google/genai) with structured output handling.
 */
export const executeAiCompletion = async ({
    messages,
    responseFormat = "text",
    temperature = 0.2,
    maxTokens = 2500,
}) => {
    const client = getGeminiClient();

    try {
        const { systemInstruction, contents } = convertMessagesToGemini(messages);

        const config = {
            temperature,
            maxOutputTokens: maxTokens,
        };

        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        if (responseFormat === "json") {
            config.responseMimeType = "application/json";
        }

        const response = await client.models.generateContent({
            model: env.geminiModel,
            contents,
            config,
        });

        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === "SAFETY") {
            throw new AppError(
                "AI response was blocked by safety filters",
                400
            );
        }

        const content = response.text?.trim() || "";

        if (!content) {
            throw new AppError(
                "AI provider returned an empty response",
                502
            );
        }

        return content;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        const status = error.status || error.statusCode;
        const msg = error.message ? error.message.toLowerCase() : "";

        // Rate limit / quota exhausted
        if (
            status === 429 ||
            error.code === "RESOURCE_EXHAUSTED" ||
            msg.includes("resource_exhausted") ||
            msg.includes("quota")
        ) {
            throw new AppError(
                "AI provider quota or rate limit reached. Please try again in a few moments.",
                429
            );
        }

        // Timeouts
        if (
            error.code === "ETIMEDOUT" ||
            error.name === "TimeoutError" ||
            error.name === "AbortError" ||
            msg.includes("timed out") ||
            msg.includes("timeout")
        ) {
            throw new AppError(
                "AI provider request timed out. Please try again.",
                504
            );
        }

        // Authentication & permission
        if (
            status === 401 ||
            status === 403 ||
            msg.includes("api_key_invalid") ||
            msg.includes("api key not valid") ||
            msg.includes("permission_denied")
        ) {
            throw new AppError(
                "AI service authentication error. Please contact the administrator.",
                503
            );
        }

        // Model not found
        if (
            status === 404 ||
            msg.includes("not_found") ||
            msg.includes("model not found") ||
            msg.includes("unsupported")
        ) {
            throw new AppError(
                "AI model unavailable or unsupported. Please contact the administrator.",
                503
            );
        }

        // Log unexpected error safely in development without leaking confidential prompt data
        if (!env.isProduction && env.nodeEnv !== "test") {
            console.error("[Gemini Provider Error]", {
                status,
                name: error.name,
                code: error.code,
                message: error.message,
            });
        }

        throw new AppError(
            "Failed to receive a valid response from the AI provider",
            502
        );
    }
};

export const aiProvider = {
    executeAiCompletion,
};
