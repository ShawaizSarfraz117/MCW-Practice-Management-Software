# @mcw/email

Secure email service for MCW Practice Management Software using Gmail SMTP.

## Quick Start

### 1. Configuration

Add Gmail credentials to your root `.env` file:

```bash
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
GMAIL_FROM="Your Practice Name <your-email@gmail.com>"
```

### 2. Usage in Your App

```typescript
import { EmailService } from "@mcw/email";

// Initialize service (usually in a utility or service file)
const emailService = new EmailService({
  gmail: {
    user: process.env.GMAIL_USER!,
    appPassword: process.env.GMAIL_APP_PASSWORD!,
    from: process.env.GMAIL_FROM!,
  },
});

// Send email
const result = await emailService.sendEmail({
  to: "patient@example.com",
  subject: "Appointment Reminder",
  html: "<p>Your appointment is tomorrow at 2 PM.</p>",
});
```

## Gmail App Password Setup

### Quick Steps

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification" → "App passwords"
   - Select "Mail" → "Other (Custom name)"
   - Enter "MCW Practice Management"
   - Copy the 16-character password

### Environment Variables

Add to your **root** `.env` file (same as other MCW configs):

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
GMAIL_FROM="Your Practice Name <your-email@gmail.com>"
```

## Application Integration

### In API Routes (Back Office)

```typescript
// app/api/send-reminder/route.ts
import { EmailService } from "@mcw/email";
import { NextRequest, NextResponse } from "next/server";

const emailService = new EmailService({
  gmail: {
    user: process.env.GMAIL_USER!,
    appPassword: process.env.GMAIL_APP_PASSWORD!,
    from: process.env.GMAIL_FROM!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { patientEmail, appointmentDate } = await request.json();

    const result = await emailService.sendEmail({
      to: patientEmail,
      subject: "Appointment Reminder",
      html: `<p>Your appointment is scheduled for ${appointmentDate}</p>`,
    });

    if (result.success) {
      return NextResponse.json({ sent: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
```

### In Services (Shared Logic)

```typescript
// utils/email.service.ts
import { EmailService } from "@mcw/email";

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService({
      gmail: {
        user: process.env.GMAIL_USER!,
        appPassword: process.env.GMAIL_APP_PASSWORD!,
        from: process.env.GMAIL_FROM!,
      },
    });
  }

  async sendAppointmentReminder(patientEmail: string, appointmentDetails: any) {
    return await this.emailService.sendEmail({
      to: patientEmail,
      subject: "Appointment Reminder",
      html: `<p>Reminder: ${appointmentDetails.date} at ${appointmentDetails.time}</p>`,
    });
  }

  async sendInvoice(patientEmail: string, invoicePdf: Buffer) {
    return await this.emailService.sendEmail({
      to: patientEmail,
      subject: "Invoice from Your Practice",
      html: "<p>Please find your invoice attached.</p>",
      attachments: [
        {
          filename: "invoice.pdf",
          content: invoicePdf,
          contentType: "application/pdf",
        },
      ],
    });
  }
}
```

## API Reference

### Send Email

```typescript
await emailService.sendEmail({
  to: "patient@example.com", // Required
  cc: ["nurse@practice.com"], // Optional
  bcc: ["admin@practice.com"], // Optional
  subject: "Appointment Reminder", // Required
  html: "<p>HTML content</p>", // Optional (HTML or text required)
  text: "Plain text content", // Optional
  attachments: [
    // Optional
    {
      filename: "invoice.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});
```

### Response Format

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string; // Gmail message ID if successful
  error?: string; // Error message if failed
}
```

## Features

- ✅ **Gmail SMTP** with app passwords
- ✅ **HTML & Text** emails
- ✅ **File Attachments** (PDF, Word, images)
- ✅ **Multiple Recipients** (to, cc, bcc)
- ✅ **Email Validation** and sanitization
- ✅ **Error Handling** with detailed messages
- ✅ **HIPAA Logging** (no sensitive data logged)
- ✅ **TypeScript** fully typed

## Limits & Security

- **Attachment Size**: 25MB per file (Gmail limit)
- **Rate Limits**: ~500 emails/day for free Gmail accounts
- **Allowed Types**: PDF, Word docs, images, plain text
- **Secure Transport**: TLS encryption via Gmail SMTP
- **No Logging**: Email content is never logged

## Testing

```bash
# Integration tests (sends real emails)
npm run test:integration

# Unit tests (mocked)
npm run test:unit
```

## Troubleshooting

**"Invalid login"** → Regenerate app password, check 2FA enabled  
**"Connection timeout"** → Check internet/firewall on port 587  
**"Authentication failed"** → Use app password, not regular password  
**"Attachment too large"** → Gmail 25MB limit, consider file sharing
