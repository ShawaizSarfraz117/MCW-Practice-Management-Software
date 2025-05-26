import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, type ReminderTextTemplates } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET } from "@/api/reminder-text-templates/route";
import { GET as GETById, PUT } from "@/api/reminder-text-templates/[id]/route";

describe("Reminder Text Templates API Integration Tests", () => {
  let testTemplate: ReminderTextTemplates | null = null;

  beforeAll(async () => {
    // Create a test template with all fields using prisma directly
    testTemplate = await prisma.reminderTextTemplates.create({
      data: {
        id: "test-template-id", // Providing ID explicitly to fix type error
        type: "appointment",
        content:
          "Reminder for your appointment on {appointment_date} at {appointment_time}",
      },
    });
  });

  afterAll(async () => {
    if (testTemplate?.id) {
      await prisma.reminderTextTemplates.deleteMany({
        where: {
          id: testTemplate.id,
        },
      });
    }
  });

  describe("GET /api/reminder-text-templates", () => {
    it("should get all reminder text templates", async () => {
      const req = createRequest("/api/reminder-text-templates");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testTemplate?.id,
            type: testTemplate?.type,
            content: testTemplate?.content,
          }),
        ]),
      );
    });

    it("should filter templates by type", async () => {
      const req = createRequest(
        `/api/reminder-text-templates?type=${testTemplate?.type}`,
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: testTemplate?.type,
          }),
        ]),
      );
    });
  });

  describe("GET /api/reminder-text-templates/[id]", () => {
    it("should get a single reminder text template by id", async () => {
      if (!testTemplate) {
        throw new Error("Test template is null");
      }

      const req = createRequest(
        `/api/reminder-text-templates/${testTemplate.id}`,
      );
      const response = await GETById(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        id: testTemplate.id,
        type: testTemplate.type,
        content: testTemplate.content,
      });
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "dffa4ae9-55a4-48f9-8ee2-d06996b828eb";
      const req = createRequest(
        `/api/reminder-text-templates/${nonExistentId}`,
      );
      const response = await GETById(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Reminder text template not found");
    });
  });

  describe("PUT /api/reminder-text-templates/[id]", () => {
    it("should update an existing reminder text template", async () => {
      if (!testTemplate) {
        throw new Error("Test template is null");
      }

      const updatedData = {
        content: "Updated reminder content for testing",
      };

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${testTemplate.id}`,
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Reminder text template updated successfully",
      );
      expect(json).toHaveProperty("template");
      expect(json.template).toMatchObject({
        id: testTemplate.id,
        content: updatedData.content,
      });

      // Verify the database was updated
      const updatedTemplate = await prisma.reminderTextTemplates.findUnique({
        where: { id: testTemplate.id },
      });
      expect(updatedTemplate).toMatchObject({
        content: updatedData.content,
      });
    });

    it("should return 400 if content is empty", async () => {
      if (!testTemplate) {
        throw new Error("Test template is null");
      }

      const invalidData = {
        content: "",
      };

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${testTemplate.id}`,
        invalidData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty("details");
    });

    it("should return 400 if content exceeds character limit", async () => {
      if (!testTemplate) {
        throw new Error("Test template is null");
      }

      // Create a string longer than the 160 character limit
      const longContent = "A".repeat(161);
      const invalidData = {
        content: longContent,
      };

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${testTemplate.id}`,
        invalidData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty("details");
    });
  });
});
