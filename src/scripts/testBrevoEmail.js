import {
    env,
    validateEnvironment,
} from "../config/environment.js";

import {
    sendTransactionalEmail,
} from "../services/email.service.js";

const testBrevoEmail = async () => {
    console.log("Validating environment for Brevo test email...");

    if (!env.emailEnabled) {
        console.error("Error: EMAIL_ENABLED is set to false in .env");
        console.error("Set EMAIL_ENABLED=true in .env to test email sending.");
        process.exit(1);
    }

    if (!env.brevoApiKey || !env.brevoSenderEmail) {
        console.error("Error: BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in .env");
        process.exit(1);
    }

    const testRecipient = env.emailTestRecipient || env.brevoSenderEmail;

    if (!testRecipient) {
        console.error("Error: EMAIL_TEST_RECIPIENT or BREVO_SENDER_EMAIL must be specified");
        process.exit(1);
    }

    console.log(`Sending test email via Brevo to: ${testRecipient}`);

    try {
        const result = await sendTransactionalEmail({
            to: {
                name: "Test Recipient",
                email: testRecipient,
            },

            subject: "Brevo Email Test - Weekly Report System",

            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Brevo Email Test</h2>
                    <p>This is a test email sent from the <strong>Weekly Report System</strong> backend.</p>
                    <p>If you are receiving this, your Brevo API key and sender email configuration are working correctly!</p>
                    <hr />
                    <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
                </div>
            `,

            tags: ["test-email"],
        });

        if (result.skipped) {
            console.log("Email sending was skipped:", result.reason);
            process.exit(0);
        }

        console.log("Test email sent successfully!");
        console.log("Brevo Message ID:", result.messageId);
        process.exit(0);
    } catch (error) {
        console.error("Test email failed:", error.message);
        process.exit(1);
    }
};

testBrevoEmail();
