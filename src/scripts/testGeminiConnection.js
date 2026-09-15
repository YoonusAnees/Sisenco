import { GoogleGenAI } from "@google/genai";
import { env } from "../config/environment.js";

const runConnectionTest = async () => {
    console.log("[Gemini Connection Test] Starting check...");

    if (!env.geminiApiKey) {
        console.error("[Gemini Connection Test] FAILED: GEMINI_API_KEY is not configured in the environment.");
        process.exit(1);
    }

    const maskedKey =
        env.geminiApiKey.length > 8
            ? `${env.geminiApiKey.slice(0, 4)}...${env.geminiApiKey.slice(-4)}`
            : "****";
    console.log(`[Gemini Connection Test] Using API Key: ${maskedKey}`);
    console.log(`[Gemini Connection Test] Using Model: ${env.geminiModel}`);

    try {
        const client = new GoogleGenAI({
            apiKey: env.geminiApiKey,
        });

        const response = await client.models.generateContent({
            model: env.geminiModel,
            contents: "Reply with exactly: Gemini connection works",
            config: {
                maxOutputTokens: 30,
                temperature: 0.1,
            },
        });

        const reply = response.text?.trim() || "";
        console.log(`[Gemini Connection Test] Response received: ${reply}`);

        if (reply) {
            console.log("[Gemini Connection Test] SUCCESS: Gemini connection verified successfully.");
            process.exit(0);
        } else {
            console.error("[Gemini Connection Test] FAILED: Received empty response from Gemini.");
            process.exit(1);
        }
    } catch (error) {
        console.error("[Gemini Connection Test] FAILED:", {
            status: error.status || error.statusCode,
            name: error.name,
            code: error.code,
            message: error.message,
        });
        process.exit(1);
    }
};

runConnectionTest();
