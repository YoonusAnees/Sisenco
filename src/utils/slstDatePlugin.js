/**
 * Mongoose global plugin — SLST date serialisation
 *
 * Converts every Date value in a document's toJSON() output from a UTC
 * ISO string (e.g. "2026-09-08T10:49:52.548Z") to a Sri Lanka Standard
 * Time ISO string (e.g. "2026-09-08T16:19:52.548+05:30").
 *
 * Register once before any model is compiled:
 *   mongoose.plugin(slstDatePlugin);
 */

const SLST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds

/**
 * Formats a Date as an ISO 8601 string with +05:30 suffix.
 * @param {Date} date
 * @returns {string}
 */
const toSLSTISOString = (date) => {
    // Shift the date by +05:30 so its UTC values match Sri Lanka local time
    const shifted = new Date(date.getTime() + SLST_OFFSET_MS);

    // Build "YYYY-MM-DDTHH:mm:ss.mmm" from the shifted UTC parts
    const iso = shifted.toISOString(); // always ends in Z
    return iso.slice(0, -1) + "+05:30"; // replace Z with +05:30
};

/**
 * Recursively walks a plain object (the result of toJSON()) and converts
 * every Date instance to a SLST ISO string.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
const convertDates = (value) => {
    if (value instanceof Date) {
        return toSLSTISOString(value);
    }

    if (Array.isArray(value)) {
        return value.map(convertDates);
    }

    if (value !== null && typeof value === "object") {
        const result = {};
        for (const key of Object.keys(value)) {
            result[key] = convertDates(value[key]);
        }
        return result;
    }

    return value;
};

/**
 * The plugin function to pass to mongoose.plugin().
 * It wraps the existing toJSON transform (if any) so per-schema
 * transforms are still respected (e.g. deleting passwordHash).
 *
 * @param {import("mongoose").Schema} schema
 */
const slstDatePlugin = (schema) => {
    const existingToJSON = schema.get("toJSON") || {};
    const existingTransform = existingToJSON.transform;

    schema.set("toJSON", {
        ...existingToJSON,
        transform: (document, returnedObject, options) => {
            // Run the schema's own transform first (e.g. deleting passwordHash)
            const base = existingTransform
                ? existingTransform(document, returnedObject, options)
                : returnedObject;

            // Then convert all Date values to SLST strings
            return convertDates(base ?? returnedObject);
        },
    });
};

export default slstDatePlugin;
