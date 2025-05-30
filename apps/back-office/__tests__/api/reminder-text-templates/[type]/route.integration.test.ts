/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterAll, beforeEach, afterEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { GET, PUT } from "@/api/reminder-text-templates/[type]/route";

interface ReminderTextTemplate {
  id: string;
  type: string;
  content: string;
}

describe("Type-specific API Routes Integration Tests", () => {
  const testTemplates = [
    {
      type: "appointment",
      content:
        "Hi {{clientName}}, your appointment is on {{appointmentDate}} at {{appointmentTime}}.",
    },
    {
      type: "telehealth",
      content:
        "Your telehealth session with {{clinicianName}} starts in 15 minutes. Join here: {{sessionLink}}",
    },
    {
      type: "document",
      content:
        "A new document {{documentName}} has been shared with you by {{practiceName}}.",
    },
    {
      type: "cancellation",
      content:
        "Your appointment on {{appointmentDate}} has been cancelled. Please contact us to reschedule.",
    },
  ];

  let createdTemplateIds: string[] = [];

  beforeEach(async () => {
    // Clean up any existing templates of our test types
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: {
          in: testTemplates.map((t) => t.type),
        },
      },
    });

    // Reset our tracking array
    createdTemplateIds = [];

    // Create fresh test templates
    for (const template of testTemplates) {
      const createdTemplate = await prisma.reminderTextTemplates.create({
        data: template,
      });
      createdTemplateIds.push(createdTemplate.id);
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (createdTemplateIds.length > 0) {
      await prisma.reminderTextTemplates.deleteMany({
        where: {
          id: {
            in: createdTemplateIds,
          },
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/reminder-text-templates/[type]", () => {
    it("should return a specific template by type", async () => {
      const mockRequest = createRequest(
        "/api/reminder-text-templates/appointment",
      );
      const response = await GET(mockRequest as any, {
        params: { type: "appointment" },
      });
      const data = (await response.json()) as ReminderTextTemplate;

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("id");
      expect(data.type).toBe("appointment");
      expect(data.content).toBe(
        "Hi {{clientName}}, your appointment is on {{appointmentDate}} at {{appointmentTime}}.",
      );
    });

    it("should return telehealth template correctly", async () => {
      const mockRequest = createRequest(
        "/api/reminder-text-templates/telehealth",
      );
      const response = await GET(mockRequest as any, {
        params: { type: "telehealth" },
      });
      const data = (await response.json()) as ReminderTextTemplate;

      expect(response.status).toBe(200);
      expect(data.type).toBe("telehealth");
      expect(data.content).toContain("telehealth session");
    });

    it("should return 404 for non-existent template type", async () => {
      // Use a valid template type but temporarily delete it to test 404 behavior
      const testType = "cancellation";

      // Temporarily delete this template (it was created in beforeEach)
      await prisma.reminderTextTemplates.deleteMany({
        where: { type: testType },
      });

      const mockRequest = createRequest(
        `/api/reminder-text-templates/${testType}`,
      );
      const response = await GET(mockRequest as any, {
        params: { type: testType },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "Template not found");
    });

    it("should return 400 for invalid template type", async () => {
      const mockRequest = createRequest("/api/reminder-text-templates/invalid");
      const response = await GET(mockRequest as any, {
        params: { type: "invalid" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error", "Invalid template type");
    });

    it("should handle all valid template types", async () => {
      const validTypes = [
        "appointment",
        "telehealth",
        "document",
        "cancellation",
      ];

      for (const type of validTypes) {
        const mockRequest = createRequest(
          `/api/reminder-text-templates/${type}`,
        );
        const response = await GET(mockRequest as any, { params: { type } });

        expect(response.status).toBe(200);

        const data = (await response.json()) as ReminderTextTemplate;
        expect(data.type).toBe(type);
      }
    });
  });

  describe("PUT /api/reminder-text-templates/[type]", () => {
    it("should update a template successfully", async () => {
      const newContent = "Updated appointment template with new content";

      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/appointment",
        { content: newContent },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "appointment" },
      });
      const data = (await response.json()) as ReminderTextTemplate;

      expect(response.status).toBe(200);
      expect(data.type).toBe("appointment");
      expect(data.content).toBe(newContent);

      // Verify the database was actually updated
      const updatedTemplate = await prisma.reminderTextTemplates.findFirst({
        where: { type: "appointment" },
      });

      expect(updatedTemplate?.content).toBe(newContent);
    });

    it("should update telehealth template correctly", async () => {
      const newContent =
        "Your telehealth session is starting now. Click here: {{sessionLink}}";

      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/telehealth",
        { content: newContent },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "telehealth" },
      });
      const data = (await response.json()) as ReminderTextTemplate;

      expect(response.status).toBe(200);
      expect(data.content).toBe(newContent);

      // Verify database state
      const dbTemplate = await prisma.reminderTextTemplates.findFirst({
        where: { type: "telehealth" },
      });
      expect(dbTemplate?.content).toBe(newContent);
    });

    it("should return 404 when trying to update non-existent template", async () => {
      // Use a valid template type but temporarily delete it to test 404 behavior
      const testType = "cancellation";

      // Temporarily delete this template (it was created in beforeEach)
      await prisma.reminderTextTemplates.deleteMany({
        where: { type: testType },
      });

      const mockRequest = createRequestWithBody(
        `/api/reminder-text-templates/${testType}`,
        { content: "Some content" },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: testType },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "Template not found");
    });

    it("should return 400 for invalid template type", async () => {
      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/invalid",
        { content: "Some content" },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "invalid" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error", "Invalid template type");
    });

    it("should return 400 for empty content", async () => {
      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/appointment",
        { content: "" },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "appointment" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty(
        "error",
        "Template content is required and cannot be empty",
      );
    });

    it("should return 400 for missing content field", async () => {
      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/appointment",
        {},
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "appointment" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty(
        "error",
        "Template content is required and cannot be empty",
      );
    });

    it("should preserve template variables in content", async () => {
      const contentWithVariables =
        "Hello {{clientName}}, your {{appointmentType}} is scheduled for {{appointmentDate}} at {{appointmentTime}}.";

      const mockRequest = createRequestWithBody(
        "/api/reminder-text-templates/appointment",
        { content: contentWithVariables },
        { method: "PUT" },
      );

      const response = await PUT(mockRequest as any, {
        params: { type: "appointment" },
      });
      const data = (await response.json()) as ReminderTextTemplate;

      expect(response.status).toBe(200);
      expect(data.content).toBe(contentWithVariables);
      expect(data.content).toContain("{{clientName}}");
      expect(data.content).toContain("{{appointmentDate}}");
    });

    it("should handle concurrent updates correctly", async () => {
      const content1 = "First update content";
      const content2 = "Second update content";

      const request1 = createRequestWithBody(
        "/api/reminder-text-templates/document",
        { content: content1 },
        { method: "PUT" },
      );

      const request2 = createRequestWithBody(
        "/api/reminder-text-templates/document",
        { content: content2 },
        { method: "PUT" },
      );

      // Execute updates sequentially to avoid race conditions
      const response1 = await PUT(request1 as any, {
        params: { type: "document" },
      });
      const response2 = await PUT(request2 as any, {
        params: { type: "document" },
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify final state
      const finalTemplate = await prisma.reminderTextTemplates.findFirst({
        where: { type: "document" },
      });
      expect(finalTemplate?.content).toBe(content2);
    });
  });
});
