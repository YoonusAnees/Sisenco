import "dotenv/config";

const requiredVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
];

export const validateEnvironment = () => {
    const missingVariables = requiredVariables.filter(
        (variable) => !process.env[variable]
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new Error(
            "JWT_SECRET must contain at least 32 characters"
        );
    }
};

export const env = Object.freeze({
    get nodeEnv() {
        return process.env.NODE_ENV || "development";
    },

    get port() {
        return Number(process.env.PORT) || 5000;
    },

    get host() {
        return process.env.HOST || "0.0.0.0";
    },

    get mongoUri() {
        return process.env.MONGODB_URI;
    },

    get clientUrl() {
        const raw = process.env.CLIENT_URL || "http://localhost:5173";
        return raw.split(",").map((url) => url.trim());
    },

    get jwtSecret() {
        return process.env.JWT_SECRET;
    },

    get jwtExpiresIn() {
        return process.env.JWT_EXPIRES_IN || "7d";
    },

    get jwtCookieName() {
        return process.env.JWT_COOKIE_NAME || "sisenco_jwt";
    },

    get cookieName() {
        return process.env.COOKIE_NAME || "weekly_report_token";
    },

    get isProduction() {
        return process.env.NODE_ENV === "production";
    },

    get adminRegistrationSecret() {
        return process.env.ADMIN_REGISTRATION_SECRET;
    },
});