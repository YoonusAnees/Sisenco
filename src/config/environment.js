import "dotenv/config";

/*
 * Converts a text environment variable into a Boolean.
 *
 * "true"  -> true
 * "false" -> false
 */
const getBoolean = (
  value,
  defaultValue = false
) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.trim().toLowerCase() === "true";
};

/*
 * Converts a text environment variable into a number.
 * Returns the default value when the result is invalid.
 */
const getNumber = (
  value,
  defaultValue
) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : defaultValue;
};

/*
 * Central application environment object.
 */
export const env = Object.freeze({
  get nodeEnv() {
    return (
      process.env.NODE_ENV?.trim() ||
      "development"
    );
  },

  get port() {
    return getNumber(
      process.env.PORT,
      5000
    );
  },

  get host() {
    return (
      process.env.HOST?.trim() ||
      "0.0.0.0"
    );
  },

  get mongoUri() {
    return (
      process.env.MONGODB_URI?.trim() ||
      ""
    );
  },

  get clientUrl() {
    const rawClientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    return rawClientUrl
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  },

  get jwtSecret() {
    return (
      process.env.JWT_SECRET?.trim() ||
      ""
    );
  },

  get jwtExpiresIn() {
    return (
      process.env.JWT_EXPIRES_IN?.trim() ||
      "7d"
    );
  },

  /*
   * Use one cookie-name setting.
   *
   * COOKIE_NAME is supported as a fallback
   * for older environment files.
   */
  get jwtCookieName() {
    return (
      process.env.JWT_COOKIE_NAME?.trim() ||
      process.env.COOKIE_NAME?.trim() ||
      "sisenco_jwt"
    );
  },

  get cookieName() {
    return this.jwtCookieName;
  },

  get isProduction() {
    return this.nodeEnv === "production";
  },

  /*
   * Initial admin registration.
   */
  get adminRegistrationSecret() {
    return (
      process.env
        .ADMIN_REGISTRATION_SECRET
        ?.trim() ||
      ""
    );
  },

  /*
   * Brevo email configuration.
   */
  get brevoApiKey() {
    return (
      process.env.BREVO_API_KEY?.trim() ||
      ""
    );
  },

  get brevoSenderName() {
    return (
      process.env
        .BREVO_SENDER_NAME
        ?.trim() ||
      "Weekly Report System"
    );
  },

  get brevoSenderEmail() {
    return (
      process.env
        .BREVO_SENDER_EMAIL
        ?.trim() ||
      ""
    );
  },

  get emailEnabled() {
    return getBoolean(
      process.env.EMAIL_ENABLED,
      false
    );
  },

  get emailTestRecipient() {
    return (
      process.env
        .EMAIL_TEST_RECIPIENT
        ?.trim() ||
      ""
    );
  },

  /*
   * Gemini configuration.
   */
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY?.trim() || "";
  },

  get geminiModel() {
    return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  },

  get aiAssistantEnabled() {
    return process.env.AI_ASSISTANT_ENABLED?.trim().toLowerCase() === "true";
  },

  get aiMaxInputCharacters() {
    return getNumber(
      process.env
        .AI_MAX_INPUT_CHARACTERS,
      10000
    );
  },

  get aiConversationRetentionDays() {
    return getNumber(
      process.env
        .AI_CONVERSATION_RETENTION_DAYS,
      30
    );
  },

  get aiRateLimitMax() {
    return getNumber(
      process.env.AI_RATE_LIMIT_MAX,
      20
    );
  },

  get aiRateLimitWindowMs() {
    return getNumber(
      process.env
        .AI_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000
    );
  },
});

/*
 * Run this before connecting to MongoDB
 * and before starting the HTTP server.
 */
export const validateEnvironment = () => {
  const missingVariables = [];

  /*
   * Always-required configuration.
   */
  if (!env.mongoUri) {
    missingVariables.push(
      "MONGODB_URI"
    );
  }

  if (!env.jwtSecret) {
    missingVariables.push(
      "JWT_SECRET"
    );
  }

  /*
   * Email variables are required only
   * when email is enabled.
   */
  if (env.emailEnabled) {
    if (!env.brevoApiKey) {
      missingVariables.push(
        "BREVO_API_KEY"
      );
    }

    if (!env.brevoSenderEmail) {
      missingVariables.push(
        "BREVO_SENDER_EMAIL"
      );
    }
  }

  /*
   * Gemini variables are required only
   * when the AI assistant is enabled.
   */
  if (env.aiAssistantEnabled) {
    if (!env.geminiApiKey) {
      missingVariables.push(
        "GEMINI_API_KEY"
      );
    }

    if (!env.geminiModel) {
      missingVariables.push(
        "GEMINI_MODEL"
      );
    }
  }

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${[
        ...new Set(missingVariables),
      ].join(", ")}`
    );
  }

  if (env.jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters"
    );
  }

  if (
    env.aiMaxInputCharacters < 1 ||
    env.aiMaxInputCharacters > 50000
  ) {
    throw new Error(
      "AI_MAX_INPUT_CHARACTERS must be between 1 and 50000"
    );
  }

  if (
    env.aiConversationRetentionDays <
    1
  ) {
    throw new Error(
      "AI_CONVERSATION_RETENTION_DAYS must be at least 1"
    );
  }

  if (env.aiRateLimitMax < 1) {
    throw new Error(
      "AI_RATE_LIMIT_MAX must be at least 1"
    );
  }

  if (env.aiRateLimitWindowMs < 1000) {
    throw new Error(
      "AI_RATE_LIMIT_WINDOW_MS must be at least 1000"
    );
  }
};