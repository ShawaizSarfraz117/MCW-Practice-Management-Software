import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@mcw/email";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";

interface EmailSendPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Initialize email service
const emailService = new EmailService({
  gmail: {
    user: process.env.GMAIL_USER || "",
    appPassword: process.env.GMAIL_APP_PASSWORD || "",
    from: process.env.GMAIL_FROM || "MCW System <noreply@mcw.com>",
  },
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.error("Email configuration missing");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    // Parse request body
    const payload: EmailSendPayload = await request.json();

    // Validate required fields
    if (!payload.to || !payload.subject || !payload.html) {
      return NextResponse.json(
        {
          error: "Missing required fields: to, subject, and html are required",
        },
        { status: 400 },
      );
    }

    // Send email
    const result = await emailService.sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      cc: payload.cc,
      bcc: payload.bcc,
      replyTo: payload.replyTo,
      attachments: payload.attachments,
    });

    logger.info({
      message: "Email sent successfully",
      to: payload.to,
      subject: payload.subject,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error({
      message: "Failed to send email",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
