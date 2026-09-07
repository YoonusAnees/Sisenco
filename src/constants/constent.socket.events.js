export const SOCKET_EVENTS = Object.freeze({
    CONNECTION_READY: "connection:ready",

    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",
    NOTIFICATIONS_READ_ALL:
        "notifications:read-all",
    NOTIFICATION_COUNT_CHANGED:
        "notification:count-changed",

    REPORT_SUBMITTED: "report:submitted",
    REPORT_RESUBMITTED: "report:resubmitted",
    REPORT_CHANGES_REQUESTED:
        "report:changes-requested",
    REPORT_APPROVED: "report:approved",

    DASHBOARD_REFRESH: "dashboard:refresh",
});