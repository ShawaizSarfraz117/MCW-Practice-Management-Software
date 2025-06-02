import nodemailer from "nodemailer";
import { logger } from "@mcw/logger";
import type {
  EmailOptions,
  EmailResult,
  EmailServiceConfig,
  EmailConfig,
  EmailAttachment,
} from "./types";

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailServiceConfig;
  private defaultFrom: string;

  constructor(config: EmailServiceConfig) {
    this.config = {
      maxAttachmentSize: 25 * 1024 * 1024, // 25MB default
      allowedAttachmentTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
      ],
      ...config,
    };

    this.defaultFrom = config.gmail.from;

    const emailConfig: EmailConfig = {
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.gmail.user,
        pass: config.gmail.appPassword,
      },
      from: config.gmail.from,
    };

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: {
        rejectUnauthorized: false,
      },
    });

    logger.info("Email service initialized with Gmail SMTP");
  }

  private validateAttachments(attachments: EmailAttachment[]): void {
    if (!attachments || attachments.length === 0) return;

    for (const attachment of attachments) {
      // Check file size
      const size = Buffer.isBuffer(attachment.content)
        ? attachment.content.length
        : Buffer.byteLength(attachment.content);

      if (size > this.config.maxAttachmentSize!) {
        throw new Error(
          `Attachment ${attachment.filename} exceeds maximum size of ${this.config.maxAttachmentSize! / 1024 / 1024}MB`,
        );
      }

      // Check file type if contentType is provided
      if (attachment.contentType && this.config.allowedAttachmentTypes) {
        if (
          !this.config.allowedAttachmentTypes.includes(attachment.contentType)
        ) {
          throw new Error(
            `Attachment type ${attachment.contentType} is not allowed`,
          );
        }
      }

      // Basic filename validation
      if (!attachment.filename || attachment.filename.trim() === "") {
        throw new Error("Attachment filename is required");
      }
    }
  }

  private sanitizeEmailAddresses(addresses: string | string[]): string[] {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];

    const sanitized = addressArray
      .map((addr) => addr.trim().toLowerCase())
      .filter((addr) => {
        if (!emailRegex.test(addr)) {
          logger.warn(`Invalid email address format: ${addr}`);
          return false;
        }
        return true;
      });

    if (sanitized.length === 0) {
      throw new Error("No valid email addresses provided");
    }

    return sanitized;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate required fields
      if (!options.to) {
        throw new Error("Recipient email address(es) required");
      }

      if (!options.subject || options.subject.trim() === "") {
        throw new Error("Email subject is required");
      }

      if (!options.html && !options.text) {
        throw new Error("Either HTML or text content is required");
      }

      // Sanitize email addresses
      const to = this.sanitizeEmailAddresses(options.to);
      const cc = options.cc
        ? this.sanitizeEmailAddresses(options.cc)
        : undefined;
      const bcc = options.bcc
        ? this.sanitizeEmailAddresses(options.bcc)
        : undefined;

      // Validate attachments
      if (options.attachments) {
        this.validateAttachments(options.attachments);
      }

      // Prepare mail options
      const mailOptions = {
        from: this.defaultFrom,
        to: to.join(", "),
        cc: cc?.join(", "),
        bcc: bcc?.join(", "),
        subject: options.subject.trim(),
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        priority: options.priority || "normal",
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          contentDisposition: att.contentDisposition || "attachment",
          cid: att.cid,
        })),
      };

      logger.info(
        {
          to: to.length,
          cc: cc?.length || 0,
          bcc: bcc?.length || 0,
          subject: options.subject,
          hasAttachments: (options.attachments?.length || 0) > 0,
          attachmentCount: options.attachments?.length || 0,
        },
        `Sending email to ${to.length} recipient(s)`,
      );

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(
        {
          messageId: info.messageId,
          response: info.response,
        },
        "Email sent successfully",
      );

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      logger.error(
        {
          error: errorMessage,
          to: options.to,
          subject: options.subject,
        },
        "Failed to send email",
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("Email service connection verified successfully");
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        { error: errorMessage },
        "Email service connection verification failed",
      );
      return false;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
    logger.info("Email service connection closed");
  }
}
