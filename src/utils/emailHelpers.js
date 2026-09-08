export const escapeHtml = (value = "") => {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

export const formatEmailDate = (value) => {
    if (!value) {
        return "Not available";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Colombo",
        }
    ).format(new Date(value));
};

/**
 * Returns the current date-string (YYYY-MM-DD) in Sri Lanka Standard Time
 * (UTC+5:30 / Asia/Colombo). Use this whenever you need "today" in SLST
 * for business-logic decisions such as finding the current reporting week.
 */
export const todayInSriLanka = () => {
    return new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Colombo",
    });
};