export const REPORT_STATUSES = Object.freeze({
    DRAFT: "draft",
    SUBMITTED: "submitted",
    NEEDS_CORRECTION: "needs_correction",
    APPROVED: "approved",
});

export const REPORT_STATUS_VALUES = Object.freeze(
    Object.values(REPORT_STATUSES)
);

export const TASK_PRIORITIES = Object.freeze({
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
});

export const TASK_PRIORITY_VALUES = Object.freeze(
    Object.values(TASK_PRIORITIES)
);

export const HOURS_CATEGORIES = Object.freeze({
    DEVELOPMENT: "development",
    TESTING: "testing",
    DESIGN: "design",
    MEETINGS: "meetings",
    RESEARCH: "research",
    DOCUMENTATION: "documentation",
    SUPPORT: "support",
    OTHER: "other",
});

export const HOURS_CATEGORY_VALUES = Object.freeze(
    Object.values(HOURS_CATEGORIES)
);