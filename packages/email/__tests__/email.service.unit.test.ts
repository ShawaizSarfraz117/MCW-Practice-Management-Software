import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import nodemailer from "nodemailer";
import { EmailService } from "../src/email.service";
import type { EmailServiceConfig, EmailOptions } from "../src/types";

// Mock nodemailer
vi.mock("nodemailer");
const mockedNodemailer = vi.mocked(nodemailer);

// Mock logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
}));

describe("EmailService", () => {
  let emailService: EmailService;
  let mockTransporter: nodemailer.Transporter;
  let config: EmailServiceConfig;

  beforeEach(() => {
    mockTransporter = mockDeep<nodemailer.Transporter>();
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);

    config = {
      gmail: {
        user: "test@gmail.com",
        appPassword: "test-app-password",
        from: "Test Sender <test@gmail.com>",
      },
      maxAttachmentSize: 25 * 1024 * 1024,
      allowedAttachmentTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    emailService = new EmailService(config);
  });

  describe("constructor", () => {
    it("should initialize EmailService with correct configuration", () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@gmail.com",
          pass: "test-app-password",
        },
      });
    });

    it("should use default values for optional config", () => {
      const minimalConfig = {
        gmail: {
          user: "test@gmail.com",
          appPassword: "password",
          from: "test@gmail.com",
        },
      };

      new EmailService(minimalConfig);
      expect(mockedNodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe("sendEmail - basic functionality", () => {
    const validEmailOptions: EmailOptions = {
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
      text: "Test text content",
    };

    it("should send email successfully with valid options", async () => {
      const mockInfo = {
        messageId: "test-message-id",
        response: "Email sent successfully",
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await emailService.sendEmail(validEmailOptions);

      expect(result).toEqual({
        success: true,
        messageId: "test-message-id",
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "Test Sender <test@gmail.com>",
        to: "recipient@example.com",
        cc: undefined,
        bcc: undefined,
        subject: "Test Subject",
        text: "Test text content",
        html: "<p>Test HTML content</p>",
        replyTo: undefined,
        priority: "normal",
        attachments: undefined,
      });
    });

    it("should handle multiple recipients", async () => {
      const mockInfo = { messageId: "test-id", response: "OK" };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options: EmailOptions = {
        ...validEmailOptions,
        to: ["user1@example.com", "user2@example.com"],
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user1@example.com, user2@example.com",
          cc: "cc@example.com",
          bcc: "bcc@example.com",
        }),
      );
    });

    it("should handle attachments", async () => {
      const mockInfo = { messageId: "test-id", response: "OK" };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const attachment = {
        filename: "test.pdf",
        content: Buffer.from("test content"),
        contentType: "application/pdf",
      };

      const options: EmailOptions = {
        ...validEmailOptions,
        attachments: [attachment],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: "test.pdf",
              content: Buffer.from("test content"),
              contentType: "application/pdf",
              contentDisposition: "attachment",
              cid: undefined,
            },
          ],
        }),
      );
    });

    it("should handle nodemailer errors", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("SMTP connection failed"),
      );

      const result = await emailService.sendEmail(validEmailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection failed");
    });
  });

  describe("sendEmail - validation", () => {
    const validEmailOptions: EmailOptions = {
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
      text: "Test text content",
    };

    it("should validate required fields", async () => {
      const invalidOptions = [
        { ...validEmailOptions, to: "" },
        { ...validEmailOptions, subject: "" },
        { ...validEmailOptions, html: undefined, text: undefined },
      ];

      for (const options of invalidOptions) {
        const result = await emailService.sendEmail(options);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it("should validate email addresses", async () => {
      const options: EmailOptions = {
        ...validEmailOptions,
        to: "invalid-email",
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No valid email addresses provided");
    });

    it("should validate attachment size", async () => {
      const largeContent = Buffer.alloc(30 * 1024 * 1024); // 30MB
      const options: EmailOptions = {
        ...validEmailOptions,
        attachments: [
          {
            filename: "large.pdf",
            content: largeContent,
            contentType: "application/pdf",
          },
        ],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("exceeds maximum size");
    });

    it("should validate attachment type", async () => {
      const options: EmailOptions = {
        ...validEmailOptions,
        attachments: [
          {
            filename: "script.exe",
            content: Buffer.from("content"),
            contentType: "application/x-executable",
          },
        ],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("should sanitize and normalize email addresses", async () => {
      const mockInfo = { messageId: "test-id", response: "OK" };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options: EmailOptions = {
        ...validEmailOptions,
        to: [" USER@EXAMPLE.COM ", "user2@example.com "],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com, user2@example.com",
        }),
      );
    });
  });

  describe("verifyConnection", () => {
    it("should return true when connection is verified", async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it("should return false when connection verification fails", async () => {
      mockTransporter.verify.mockRejectedValue(new Error("Connection failed"));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe("close", () => {
    it("should close the transporter connection", async () => {
      mockTransporter.close.mockResolvedValue(undefined);

      await emailService.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });
});
