export const PROJECT_CATEGORIES = Object.freeze({
    DEVELOPMENT: "development",
    DESIGN: "design",
    MARKETING: "marketing",
    OPERATIONS: "operations",
    RESEARCH: "research",
    OTHER: "other",
});

export const PROJECT_CATEGORY_VALUES = Object.freeze(
    Object.values(PROJECT_CATEGORIES)
);

export const PROJECT_STATUSES = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
});

export const PROJECT_STATUS_VALUES = Object.freeze(
    Object.values(PROJECT_STATUSES)
);

export const PROJECT_MEMBER_ROLES = Object.freeze({
    MEMBER: "member",
    LEAD: "lead",
});

export const PROJECT_MEMBER_ROLE_VALUES = Object.freeze(
    Object.values(PROJECT_MEMBER_ROLES)
);