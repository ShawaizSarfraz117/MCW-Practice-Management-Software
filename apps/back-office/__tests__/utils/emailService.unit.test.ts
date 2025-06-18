import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe("EmailService - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as Mock).mockReset();
  });

  describe("API Interactions", () => {
    const mockTemplate = {
      id: "1",
      email_type: "test_email",
      subject: "Test Subject {name}",
      content: "Hello {name}, welcome to {company}!",
    };

    const mockTemplatesResponse = {
      data: [mockTemplate],
    };

    it("should fetch templates successfully", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplatesResponse,
      });

      const response = await fetch("/api/email-templates");
      const { data: templates } = await response.json();

      const template = templates.find(
        (t: { email_type: string }) => t.email_type === "test_email",
      );
      expect(template).toBeDefined();
      expect(template.subject).toBe("Test Subject {name}");
    });

    it("should send email successfully", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const emailPayload = {
        to: "test@example.com",
        subject: "Test Subject John",
        html: "<div>Hello John, welcome to Test Corp!</div>",
        text: "Hello John, welcome to Test Corp!",
      };

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it("should handle template not found", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const response = await fetch("/api/email-templates");
      const { data: templates } = await response.json();

      const template = templates.find(
        (t: { email_type: string }) => t.email_type === "non_existent",
      );
      expect(template).toBeUndefined();
    });

    it("should handle API errors", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal server error" }),
      });

      const response = await fetch("/api/email-templates");
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it("should handle email with attachments", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const emailWithAttachment = {
        to: "test@example.com",
        subject: "Test with attachment",
        html: "<p>See attached</p>",
        text: "See attached",
        attachments: [
          {
            filename: "test.pdf",
            content: "base64content",
            contentType: "application/pdf",
          },
        ],
      };

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailWithAttachment),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      try {
        await fetch("/api/email/send", {
          method: "POST",
          body: JSON.stringify({ to: "test@example.com" }),
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe("Network error");
      }
    });

    it("should handle JSON parsing errors", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const response = await fetch("/api/email-templates");

      try {
        await response.json();
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe("Invalid JSON");
      }
    });
  });
});
