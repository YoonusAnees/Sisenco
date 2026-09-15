const SENSITIVE_KEYS = new Set([
    "password",
    "passwordHash",
    "token",
    "refreshToken",
    "jwt",
    "secret",
    "adminRegistrationSecret",
    "brevoApiKey",
    "__v",
]);

/**
 * Deeply strips sensitive keys and formats objects safely for AI ingestion.
 */
export const stripSensitiveFields = (obj) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(stripSensitiveFields);
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key)) {
            continue;
        }

        if (value && typeof value === "object") {
            // If it's a Mongoose ObjectId or Date, convert to string
            if (value._bsontype === "ObjectID" || value.constructor?.name === "ObjectId") {
                cleaned[key] = value.toString();
            } else if (value instanceof Date) {
                cleaned[key] = value.toISOString();
            } else if (typeof value.toObject === "function") {
                cleaned[key] = stripSensitiveFields(value.toObject());
            } else {
                cleaned[key] = stripSensitiveFields(value);
            }
        } else {
            cleaned[key] = value;
        }
    }

    return cleaned;
};

/**
 * Escapes common prompt injection triggers and safely wraps user-supplied content.
 */
export const wrapUntrustedData = (label, data) => {
    const serialized = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return `\n--- BEGIN UNTRUSTED ${label.toUpperCase()} DATA ---\n${serialized}\n--- END UNTRUSTED ${label.toUpperCase()} DATA ---\n`;
};
