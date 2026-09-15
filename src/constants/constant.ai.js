import { USER_ROLES } from "./constant.roles.js";

export const AI_OPERATIONS = Object.freeze({
    IMPROVE_WRITING: "improve_writing",
    STRUCTURE_NOTES: "structure_notes",
    SUMMARIZE_REPORTS: "summarize_reports",
    SUMMARIZE_BLOCKERS: "summarize_blockers",
    EXPLAIN_SYSTEM: "explain_system",
    CHAT: "chat",
});

export const AI_OPERATION_VALUES = Object.freeze(
    Object.values(AI_OPERATIONS)
);

export const AI_MESSAGE_ROLES = Object.freeze({
    USER: "user",
    ASSISTANT: "assistant",
});

export const AI_MESSAGE_ROLE_VALUES = Object.freeze(
    Object.values(AI_MESSAGE_ROLES)
);

export const ROLE_ALLOWED_AI_OPERATIONS = Object.freeze({
    [USER_ROLES.MEMBER]: Object.freeze([
        AI_OPERATIONS.IMPROVE_WRITING,
        AI_OPERATIONS.STRUCTURE_NOTES,
        AI_OPERATIONS.EXPLAIN_SYSTEM,
        AI_OPERATIONS.CHAT,
    ]),
    [USER_ROLES.MANAGER]: Object.freeze([
        AI_OPERATIONS.IMPROVE_WRITING,
        AI_OPERATIONS.STRUCTURE_NOTES,
        AI_OPERATIONS.SUMMARIZE_REPORTS,
        AI_OPERATIONS.SUMMARIZE_BLOCKERS,
        AI_OPERATIONS.EXPLAIN_SYSTEM,
        AI_OPERATIONS.CHAT,
    ]),
    [USER_ROLES.ADMIN]: Object.freeze([
        AI_OPERATIONS.IMPROVE_WRITING,
        AI_OPERATIONS.STRUCTURE_NOTES,
        AI_OPERATIONS.SUMMARIZE_REPORTS,
        AI_OPERATIONS.SUMMARIZE_BLOCKERS,
        AI_OPERATIONS.EXPLAIN_SYSTEM,
        AI_OPERATIONS.CHAT,
    ]),
});
