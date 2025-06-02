import { describe, it, expect, beforeAll } from "vitest";
import { EmailService } from "@/email.service";
import type { EmailServiceConfig } from "@/types";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

describe("EmailService Integration Tests", () => {
  let emailService: EmailService;

  beforeAll(() => {
    // Verify required environment variables
    expect(
      process.env.GMAIL_USER,
      "GMAIL_USER not set in root .env",
    ).toBeDefined();
    expect(
      process.env.GMAIL_APP_PASSWORD,
      "GMAIL_APP_PASSWORD not set in root .env",
    ).toBeDefined();
    expect(
      process.env.GMAIL_FROM,
      "GMAIL_FROM not set in root .env",
    ).toBeDefined();

    const config: EmailServiceConfig = {
      gmail: {
        user: process.env.GMAIL_USER!,
        appPassword: process.env.GMAIL_APP_PASSWORD!,
        from: process.env.GMAIL_FROM!,
      },
    };

    emailService = new EmailService(config);
  });

  it("should verify Gmail SMTP connection", async () => {
    const isConnected = await emailService.verifyConnection();
    expect(isConnected).toBe(true);
  }, 10000); // 10 second timeout for network call

  it("should send a simple test email", async () => {
    const result = await emailService.sendEmail({
      to: process.env.GMAIL_USER!, // Send to same address for testing
      subject: "MCW Email Service Test",
      html: "<h2>✅ Email Service Working!</h2><p>This is a test email from the MCW email service.</p>",
      text: "✅ Email Service Working! This is a test email from the MCW email service.",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.error).toBeUndefined();
  }, 15000); // 15 second timeout for email sending

  it("should send email with attachment", async () => {
    // Create a simple PDF-like buffer for testing
    const testPdfContent = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n202\n%%EOF",
    );

    const result = await emailService.sendEmail({
      to: process.env.GMAIL_USER!,
      subject: "MCW Email Service - Attachment Test",
      html: "<h2>📎 Attachment Test</h2><p>This email contains a test PDF attachment.</p>",
      attachments: [
        {
          filename: "test-document.pdf",
          content: testPdfContent,
          contentType: "application/pdf",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.error).toBeUndefined();
  }, 20000); // 20 second timeout for email with attachment

  it("should handle multiple recipients", async () => {
    const result = await emailService.sendEmail({
      to: [process.env.GMAIL_USER!], // Using array with single address for testing
      cc: [], // Empty CC for testing
      subject: "MCW Email Service - Multiple Recipients Test",
      html: "<h2>👥 Multiple Recipients</h2><p>Testing multiple recipient handling.</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  }, 15000);

  it("should handle invalid email addresses gracefully", async () => {
    const result = await emailService.sendEmail({
      to: "invalid-email-address",
      subject: "This should fail",
      html: "<p>This should not be sent</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No valid email addresses provided");
  });

  it("should validate attachment size", async () => {
    // Create oversized content (30MB)
    const oversizedContent = Buffer.alloc(30 * 1024 * 1024, "a");

    const result = await emailService.sendEmail({
      to: process.env.GMAIL_USER!,
      subject: "This should fail - large attachment",
      html: "<p>Large attachment test</p>",
      attachments: [
        {
          filename: "large-file.txt",
          content: oversizedContent,
          contentType: "text/plain",
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("exceeds maximum size");
  });
});
