import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EmailTemplate, prisma } from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { GET } from "@/api/email-templates/route";

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

describe("Email Template Integration Tests", () => {
  let testTemplate: EmailTemplate;
  const TEST_USER_ID = "dffa4ae9-55a4-48f9-8ee2-d06996b828ea";

  beforeAll(async () => {
    // Clean up any existing test templates
    await prisma.emailTemplate.deleteMany({
      where: {
        email_type: "test_template_fetch",
      },
    });

    // Create test email template
    testTemplate = await prisma.emailTemplate.create({
      data: {
        name: "Test Template Fetch",
        type: "test_type",
        email_type: "test_template_fetch",
        subject: "Test Subject - {variable}",
        content: "Test content with {variable}",
        created_by: TEST_USER_ID,
        updated_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (testTemplate?.id) {
      await prisma.emailTemplate.delete({
        where: { id: testTemplate.id },
      });
    }
  });

  describe("Template Fetching", () => {
    it("should fetch all templates", async () => {
      const request = createRequest("/api/email-templates");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("should fetch specific template by email_type", async () => {
      const request = createRequest(
        `/api/email-templates?email_type=${testTemplate.email_type}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      const foundTemplate = json.data.find(
        (t: EmailTemplate) => t.id === testTemplate.id,
      );

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate).toMatchObject({
        id: testTemplate.id,
        email_type: testTemplate.email_type,
        subject: testTemplate.subject,
      });
    });

    it("should fetch templates by type", async () => {
      const request = createRequest(
        `/api/email-templates?type=${testTemplate.type}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      const templates = json.data.filter(
        (t: EmailTemplate) => t.type === testTemplate.type,
      );

      expect(templates.length).toBeGreaterThanOrEqual(1);
      expect(
        templates.some((t: EmailTemplate) => t.id === testTemplate.id),
      ).toBe(true);
    });
  });

  describe("Database Operations", () => {
    it("should update email template", async () => {
      const updatedData = {
        subject: "Updated Subject - {new_var}",
        content: "Updated content for {new_var}",
      };

      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id: testTemplate.id },
        data: updatedData,
      });

      expect(updatedTemplate.subject).toBe(updatedData.subject);
      expect(updatedTemplate.content).toBe(updatedData.content);
    });

    it("should handle concurrent template fetches", async () => {
      const promises = [
        prisma.emailTemplate.findUnique({
          where: { id: testTemplate.id },
        }),
        prisma.emailTemplate.findMany({
          where: { type: testTemplate.type },
        }),
        prisma.emailTemplate.findMany({
          where: { email_type: testTemplate.email_type },
        }),
      ];

      const results = await Promise.all(promises);

      expect(results[0]?.id).toBe(testTemplate.id);
      expect(Array.isArray(results[1])).toBe(true);
      expect(Array.isArray(results[2])).toBe(true);
    });
  });
});
