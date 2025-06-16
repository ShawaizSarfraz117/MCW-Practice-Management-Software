import { showErrorToast } from "@mcw/utils";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | Date | undefined | null;
}

export interface SendEmailOptions {
  emailType: string;
  variables: TemplateVariables;
  to: EmailRecipient | EmailRecipient[];
  cc?: string;
  bcc?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email Service that handles all email operations
 * - Fetches templates from database
 * - Processes variables
 * - Sends emails
 */
class EmailService {
  private apiEndpoint = "/api/email/send";
  private templatesEndpoint = "/api/email-templates";

  /**
   * Send email using a database template
   */
  async sendEmail(options: SendEmailOptions, toast?: unknown): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
      // Fetch and process template
      const template = await this.fetchAndProcessTemplate(
        options.emailType,
        options.variables,
      );

      // Send to all recipients
      const promises = recipients.map((recipient) =>
        this.sendSingleEmail({
          to: recipient.email,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          cc: options.cc,
          bcc: options.bcc,
          replyTo: options.replyTo,
          attachments: options.attachments,
        }),
      );

      await Promise.all(promises);

      // Show success message if toast is provided
      if (toast) {
        const recipientNames = recipients
          .map((r) => r.name || r.email)
          .join(", ");

        toast({
          title: "Email Sent Successfully",
          description: `Email sent to ${recipientNames}`,
          variant: "success",
        });
      }
    } catch (error) {
      if (toast) {
        showErrorToast(toast, error);
      }
      throw error;
    }
  }

  /**
   * Fetch template from database and process variables
   */
  private async fetchAndProcessTemplate(
    emailType: string,
    variables: TemplateVariables,
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    // Fetch template from API
    const response = await fetch(this.templatesEndpoint);
    if (!response.ok) {
      throw new Error("Failed to fetch email templates");
    }

    const { data: templates } = await response.json();
    const template = templates.find(
      (t: { email_type: string }) => t.email_type === emailType,
    );

    if (!template) {
      throw new Error(`Email template not found with email_type: ${emailType}`);
    }

    // Process variables
    let processedSubject = template.subject;
    let processedContent = template.content;

    // Replace variables in format {variableName}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
      const replacementValue = value?.toString() || "";

      processedSubject = processedSubject.replace(regex, replacementValue);
      processedContent = processedContent.replace(regex, replacementValue);
    });

    // Convert plain text to simple HTML if needed
    const htmlContent = processedContent.includes("<")
      ? processedContent
      : `<div style="font-family: Arial, sans-serif; white-space: pre-line;">${processedContent}</div>`;

    return {
      subject: processedSubject,
      htmlContent,
      textContent: processedContent,
    };
  }

  /**
   * Send a single email
   */
  private async sendSingleEmail(payload: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    cc?: string;
    bcc?: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  }): Promise<Response> {
    const response = await fetch(this.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }

    return response;
  }

  /**
   * Send batch emails with different data per recipient
   */
  async sendBatchEmails(
    emailType: string,
    recipientsWithData: Array<{
      recipient: EmailRecipient;
      variables: TemplateVariables;
    }>,
    commonOptions?: {
      cc?: string;
      bcc?: string;
      replyTo?: string;
      attachments?: EmailAttachment[];
    },
    toast?: unknown,
  ): Promise<void> {
    try {
      const promises = recipientsWithData.map(({ recipient, variables }) =>
        this.sendEmail(
          {
            emailType,
            variables,
            to: recipient,
            ...commonOptions,
          },
          toast,
        ),
      );

      await Promise.all(promises);

      if (toast) {
        toast({
          title: "Batch Emails Sent",
          description: `Successfully sent ${recipientsWithData.length} emails`,
          variant: "success",
        });
      }
    } catch (error) {
      if (toast) {
        showErrorToast(toast, error);
      }
      throw error;
    }
  }

  /**
   * Get all available templates
   */
  async getTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      subject: string;
      content: string;
      type: string;
      email_type?: string;
    }>
  > {
    const response = await fetch(this.templatesEndpoint);
    if (!response.ok) {
      throw new Error("Failed to fetch email templates");
    }

    const { data: templates } = await response.json();
    return templates;
  }

  /**
   * Preview a template with variables (useful for testing)
   */
  async previewTemplate(
    emailType: string,
    variables: TemplateVariables,
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    return this.fetchAndProcessTemplate(emailType, variables);
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper function for common email scenarios
export const emailHelpers = {
  /**
   * Send document reminder email
   */
  async sendDocumentReminder(
    params: {
      clientEmail: string;
      clientName: string;
      documents: string[];
      appointmentDate?: string;
      appointmentTime?: string;
      clinicianName: string;
      portalLink: string;
    },
    toast?: unknown,
  ) {
    await emailService.sendEmail(
      {
        emailType: "document_reminder",
        to: {
          email: params.clientEmail,
          name: params.clientName,
        },
        variables: {
          appointment_date:
            params.appointmentDate || new Date().toLocaleDateString(),
          appointment_time: params.appointmentTime || "TBD",
          clinician_full_name: params.clinicianName,
          client_document_request_names: params.documents.join("\n"),
          practice_client_portal_login_link: params.portalLink,
        },
      },
      toast,
    );
  },

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(
    params: {
      clientEmail: string;
      clientName: string;
      appointmentDate: Date;
      appointmentTime: string;
      clinicianName: string;
      location?: string;
    },
    toast?: unknown,
  ) {
    await emailService.sendEmail(
      {
        emailType: "appointment_reminder",
        to: {
          email: params.clientEmail,
          name: params.clientName,
        },
        variables: {
          client_name: params.clientName,
          appointment_date: params.appointmentDate.toLocaleDateString(),
          appointment_time: params.appointmentTime,
          clinician_name: params.clinicianName,
          location: params.location || "TBD",
        },
      },
      toast,
    );
  },
};
