import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EmailTemplate, prisma } from "@mcw/database";
import { createRequestWithBody } from "@mcw/utils";
import { POST as sendEmail } from "@/api/email/send/route";

// Mock authentication
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "dffa4ae9-55a4-48f9-8ee2-d06996b828ea",
      },
    }),
  ),
}));

// Mock the email service to avoid sending real emails
vi.mock("@mcw/email", () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendEmail: vi.fn().mockResolvedValue({
      accepted: ["test@example.com"],
      rejected: [],
      messageId: "test-message-id",
    }),
  })),
}));

describe("Email Sending Integration Tests", () => {
  let appointmentTemplate: EmailTemplate;
  const TEST_USER_ID = "dffa4ae9-55a4-48f9-8ee2-d06996b828ea";

  beforeAll(async () => {
    process.env.GMAIL_USER = "test@example.com";
    process.env.GMAIL_APP_PASSWORD = "test-password";
    process.env.GMAIL_FROM = "Test <test@example.com>";

    // Clean up and create test template
    await prisma.emailTemplate.deleteMany({
      where: {
        email_type: "test_send_appointment",
      },
    });

    appointmentTemplate = await prisma.emailTemplate.create({
      data: {
        name: "Test Send Appointment",
        type: "appointment_reminder",
        email_type: "test_send_appointment",
        subject: "Appointment on {appointment_date}",
        content:
          "Dear {client_name}, reminder for {appointment_date} at {appointment_time}",
        created_by: TEST_USER_ID,
        updated_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (appointmentTemplate?.id) {
      await prisma.emailTemplate.delete({
        where: { id: appointmentTemplate.id },
      });
    }

    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete process.env.GMAIL_FROM;
  });

  describe("Email Sending", () => {
    it("should send email with processed template", async () => {
      const variables = {
        client_name: "John Doe",
        appointment_date: "January 15, 2024",
        appointment_time: "2:00 PM",
      };

      // Process template
      let processedSubject = appointmentTemplate.subject;
      let processedContent = appointmentTemplate.content;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processedSubject = processedSubject.replace(regex, value);
        processedContent = processedContent.replace(regex, value);
      });

      const emailPayload = {
        to: "test@example.com",
        subject: processedSubject,
        html: `<div>${processedContent}</div>`,
        text: processedContent,
      };

      const request = createRequestWithBody("/api/email/send", emailPayload);
      const response = await sendEmail(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toMatchObject({
        success: true,
        messageId: expect.any(String),
      });
    });

    it("should handle missing required fields", async () => {
      const invalidPayload = {
        subject: "Test Subject",
        // Missing 'to' field
        html: "<p>Test</p>",
      };

      const request = createRequestWithBody("/api/email/send", invalidPayload);
      const response = await sendEmail(request);

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it("should handle multiple recipients", async () => {
      const emailPayload = {
        to: "recipient1@example.com",
        cc: "recipient2@example.com",
        bcc: "recipient3@example.com",
        subject: "Test Multiple Recipients",
        html: "<p>This email has multiple recipients.</p>",
        text: "This email has multiple recipients.",
      };

      const request = createRequestWithBody("/api/email/send", emailPayload);
      const response = await sendEmail(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it("should send email with attachments", async () => {
      const emailPayload = {
        to: "test@example.com",
        subject: "Test Email with Attachment",
        html: "<p>Please see the attached document.</p>",
        text: "Please see the attached document.",
        attachments: [
          {
            filename: "test-document.pdf",
            content: Buffer.from("Test PDF content").toString("base64"),
            contentType: "application/pdf",
          },
        ],
      };

      const request = createRequestWithBody("/api/email/send", emailPayload);
      const response = await sendEmail(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe("Template Variable Processing", () => {
    it("should handle missing variables gracefully", () => {
      const template = {
        content: "Hello {name}, appointment with {doctor} on {date}.",
      };

      const variables = {
        name: "John",
        // doctor is missing
        date: "Jan 15",
      };

      let processed = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processed = processed.replace(regex, value);
      });

      expect(processed).toBe(
        "Hello John, appointment with {doctor} on Jan 15.",
      );
    });

    it("should handle special characters in content", () => {
      const template = {
        content: "Cost: $100 & 50% off! {client_name}'s appointment.",
      };

      const variables = {
        client_name: "O'Brien",
      };

      let processed = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processed = processed.replace(regex, value);
      });

      expect(processed).toBe("Cost: $100 & 50% off! O'Brien's appointment.");
    });
  });
});
