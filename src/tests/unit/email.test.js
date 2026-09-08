import { jest } from "@jest/globals";
import { sendTransactionalEmail, sendEmailSafely } from "../../services/email.service.js";
import { escapeHtml, formatEmailDate } from "../../utils/emailHelpers.js";

describe("Email Utilities & Low-Level Brevo Service Unit Tests", () => {
  describe("escapeHtml", () => {
    it("sanitizes dangerous HTML special characters", () => {
      const unsafe = '<script>alert("XSS & hack")</script>';
      const safe = escapeHtml(unsafe);
      expect(safe).toBe("&lt;script&gt;alert(&quot;XSS &amp; hack&quot;)&lt;/script&gt;");
    });
  });

  describe("formatEmailDate", () => {
    it("formats valid dates correctly", () => {
      const formatted = formatEmailDate("2026-09-08T00:00:00.000Z");
      expect(formatted).toBeTruthy();
    });

    it("returns Not available for empty input", () => {
      expect(formatEmailDate(null)).toBe("Not available");
    });
  });

  describe("sendTransactionalEmail", () => {
    it("skips dispatch when EMAIL_ENABLED=false", async () => {
      process.env.EMAIL_ENABLED = "false";

      const result = await sendTransactionalEmail({
        subject: "Test",
        htmlContent: "<p>Test</p>",
        to: [{ email: "test@example.com" }],
      });

      expect(result.skipped).toBe(true);
    });
  });

  describe("sendEmailSafely", () => {
    it("catches exceptions cleanly without throwing error", async () => {
      process.env.EMAIL_ENABLED = "true";

      const result = await sendEmailSafely({
        subject: "Test Fail",
        htmlContent: "<p>Test</p>",
        to: [], // empty recipient list causes error
      });

      expect(result.failed).toBe(true);
      expect(result.error).toBeDefined();

      process.env.EMAIL_ENABLED = "false";
    });
  });
});
