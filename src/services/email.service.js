import {
  env,
} from "../config/environment.js";

const BREVO_EMAIL_ENDPOINT =
  "https://api.brevo.com/v3/smtp/email";

const normalizeRecipients = (
  recipients
) => {
  const values = Array.isArray(recipients)
    ? recipients
    : [recipients];

  return values
    .filter(
      (recipient) =>
        recipient &&
        recipient.email
    )
    .map((recipient) => ({
      email:
        recipient.email
          .trim()
          .toLowerCase(),

      ...(recipient.name
        ? {
            name:
              recipient.name.trim(),
          }
        : {}),
    }));
};

export const sendTransactionalEmail =
  async ({
    to,
    subject,
    htmlContent,
    replyTo,
    tags = [],
  }) => {
    if (!env.emailEnabled) {
      if (!env.isProduction) {
        console.log(
          `[Email disabled] ${subject}`
        );
      }

      return {
        skipped: true,
        reason: "Email delivery is disabled",
      };
    }

    const recipients =
      normalizeRecipients(to);

    if (recipients.length === 0) {
      throw new Error(
        "At least one valid email recipient is required"
      );
    }

    const response = await fetch(
      BREVO_EMAIL_ENDPOINT,
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.brevoApiKey,
        },

        body: JSON.stringify({
          sender: {
            name: env.brevoSenderName,
            email: env.brevoSenderEmail,
          },

          to: recipients,
          subject,
          htmlContent,

          ...(replyTo
            ? {
                replyTo: {
                  email: replyTo.email,
                  name: replyTo.name,
                },
              }
            : {}),

          ...(tags.length > 0
            ? {
                tags,
              }
            : {}),
        }),
      }
    );

    const responseData =
      await response.json().catch(
        () => ({})
      );

    if (!response.ok) {
      const message =
        responseData.message ||
        "Brevo email request failed";

      throw new Error(
        `${message} (${response.status})`
      );
    }

    return {
      skipped: false,
      messageId: responseData.messageId,
    };
  };

/*
 * Workflow operations must not fail simply
 * because the external email provider is down.
 */
export const sendEmailSafely = async (
  emailData
) => {
  try {
    return await sendTransactionalEmail(
      emailData
    );
  } catch (error) {
    console.error(
      "Unable to send transactional email:",
      error.message
    );

    return {
      skipped: false,
      failed: true,
      error: error.message,
    };
  }
};