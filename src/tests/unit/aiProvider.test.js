import { jest } from "@jest/globals";
import AppError from "../../utils/AppError.js";
import {
    convertMessagesToGemini,
    executeAiCompletion,
    resetGeminiClient,
    setGeminiClientInstance,
} from "../../services/ai.provider.service.js";

describe("Gemini AI Provider Service (ai.provider.service.js)", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env.AI_ASSISTANT_ENABLED = "true";
        process.env.GEMINI_API_KEY = "test-gemini-key";
        process.env.GEMINI_MODEL = "gemini-3.8-flash";
        resetGeminiClient();
    });

    afterEach(() => {
        resetGeminiClient();
        process.env = { ...originalEnv };
        jest.restoreAllMocks();
    });

    describe("convertMessagesToGemini", () => {
        it("extracts system messages into systemInstruction and converts roles", () => {
            const inputMessages = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Hello there" },
                { role: "assistant", content: "Hi! How can I help?" },
                { role: "user", content: "Summarize this report" },
            ];

            const result = convertMessagesToGemini(inputMessages);

            expect(result.systemInstruction).toBe("You are a helpful assistant.");
            expect(result.contents).toEqual([
                { role: "user", parts: [{ text: "Hello there" }] },
                { role: "model", parts: [{ text: "Hi! How can I help?" }] },
                { role: "user", parts: [{ text: "Summarize this report" }] },
            ]);
        });

        it("merges consecutive messages with the same role", () => {
            const inputMessages = [
                { role: "user", content: "First part" },
                { role: "user", content: "Second part" },
                { role: "assistant", content: "Answer" },
            ];

            const result = convertMessagesToGemini(inputMessages);

            expect(result.contents).toEqual([
                {
                    role: "user",
                    parts: [{ text: "First part" }, { text: "Second part" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Answer" }],
                },
            ]);
        });

        it("handles empty messages array with fallback", () => {
            const result = convertMessagesToGemini([]);

            expect(result.systemInstruction).toBeUndefined();
            expect(result.contents).toEqual([
                { role: "user", parts: [{ text: "" }] },
            ]);
        });
    });

    describe("executeAiCompletion", () => {
        it("throws 503 if AI Assistant is disabled", async () => {
            process.env.AI_ASSISTANT_ENABLED = "false";

            await expect(
                executeAiCompletion({
                    messages: [{ role: "user", content: "test" }],
                })
            ).rejects.toThrow("AI Assistant service is currently disabled");
        });

        it("throws 503 if Gemini API key is missing", async () => {
            process.env.AI_ASSISTANT_ENABLED = "true";
            delete process.env.GEMINI_API_KEY;

            await expect(
                executeAiCompletion({
                    messages: [{ role: "user", content: "test" }],
                })
            ).rejects.toThrow("AI Assistant service is not configured with an API key");
        });

        describe("with mocked client", () => {
            let mockGenerateContent;

            beforeEach(() => {
                mockGenerateContent = jest.fn();
                setGeminiClientInstance({
                    models: {
                        generateContent: mockGenerateContent,
                    },
                });
            });

            it("returns text content on successful completion", async () => {
                mockGenerateContent.mockResolvedValueOnce({
                    text: "Gemini generated text reply",
                });

                const result = await executeAiCompletion({
                    messages: [{ role: "user", content: "Hello" }],
                });

                expect(result).toBe("Gemini generated text reply");
                expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            });

            it("passes responseMimeType: 'application/json' when responseFormat is 'json'", async () => {
                mockGenerateContent.mockResolvedValueOnce({
                    text: '{"summary": "test"}',
                });

                const result = await executeAiCompletion({
                    messages: [{ role: "user", content: "Hello" }],
                    responseFormat: "json",
                });

                expect(result).toBe('{"summary": "test"}');
                expect(mockGenerateContent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        config: expect.objectContaining({
                            responseMimeType: "application/json",
                        }),
                    })
                );
            });

            it("throws 400 when candidate finishReason is SAFETY", async () => {
                mockGenerateContent.mockResolvedValueOnce({
                    candidates: [{ finishReason: "SAFETY" }],
                    text: "",
                });

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Dangerous prompt" }],
                    })
                ).rejects.toThrow("AI response was blocked by safety filters");
            });

            it("throws 502 when response is empty", async () => {
                mockGenerateContent.mockResolvedValueOnce({
                    text: "   ",
                });

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Empty prompt" }],
                    })
                ).rejects.toThrow("AI provider returned an empty response");
            });

            it("throws 429 when rate limit / quota is exhausted", async () => {
                const error = new Error("RESOURCE_EXHAUSTED: quota exceeded");
                error.status = 429;
                mockGenerateContent.mockRejectedValueOnce(error);

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Test" }],
                    })
                ).rejects.toThrow("AI provider quota or rate limit reached");
            });

            it("throws 504 on timeout", async () => {
                const error = new Error("Connection timed out");
                error.code = "ETIMEDOUT";
                mockGenerateContent.mockRejectedValueOnce(error);

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Test" }],
                    })
                ).rejects.toThrow("AI provider request timed out");
            });

            it("throws 503 on API key or permission error (401/403)", async () => {
                const error = new Error("API_KEY_INVALID");
                error.status = 400;
                mockGenerateContent.mockRejectedValueOnce(error);

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Test" }],
                    })
                ).rejects.toThrow("AI service authentication error");
            });

            it("throws 503 on model not found (404)", async () => {
                const error = new Error("Model not found: gemini-unknown");
                error.status = 404;
                mockGenerateContent.mockRejectedValueOnce(error);

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Test" }],
                    })
                ).rejects.toThrow("AI model unavailable or unsupported");
            });

            it("throws 502 on generic server error", async () => {
                const error = new Error("Internal server error");
                error.status = 500;
                mockGenerateContent.mockRejectedValueOnce(error);

                await expect(
                    executeAiCompletion({
                        messages: [{ role: "user", content: "Test" }],
                    })
                ).rejects.toThrow("Failed to receive a valid response from the AI provider");
            });
        });
    });
});
