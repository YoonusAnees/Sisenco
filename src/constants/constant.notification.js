export const NOTIFICATION_TYPES = Object.freeze({
    REPORT_SUBMITTED: "report_submitted",
    REPORT_RESUBMITTED: "report_resubmitted",
    CHANGES_REQUESTED: "changes_requested",
    REPORT_APPROVED: "report_approved",
    SYSTEM: "system",
});

export const NOTIFICATION_TYPE_VALUES =
    Object.freeze(
        Object.values(NOTIFICATION_TYPES)
    );