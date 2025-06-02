export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  contentDisposition?: "attachment" | "inline";
  cid?: string; // Content-ID for inline images
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: "high" | "normal" | "low";
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  gmail: {
    user: string;
    appPassword: string;
    from: string;
  };
  maxAttachmentSize?: number; // in bytes, default 25MB
  allowedAttachmentTypes?: string[]; // MIME types
}
