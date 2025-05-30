import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

// Mock logger before other imports
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { GET, PUT, DELETE } from "@/api/text-templates/[id]/route";

describe("Text Template by ID API Routes (Integration)", () => {
  const TEST_TEMPLATE_TYPE = "TEST_TEMPLATE_BY_ID";
  let templateId: string;

  // Setup: Create a template for testing
  beforeAll(async () => {
    // Clean up any existing test templates
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: TEST_TEMPLATE_TYPE,
      },
    });

    // Create a fresh test template
    const template = await prisma.reminderTextTemplates.create({
      data: {
        id: crypto.randomUUID(),
        type: TEST_TEMPLATE_TYPE,
        content: "Test template content {{variable}}",
      },
    });

    templateId = template.id;
  });

  // Clean up after tests
  afterAll(async () => {
    // Clean up test template
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: TEST_TEMPLATE_TYPE,
      },
    });
  });

  describe("GET /api/text-templates/[id]", () => {
    it("should retrieve a template by ID", async () => {
      const request = createRequest(`/api/text-templates/${templateId}`);
      const response = await GET(request, { params: { id: templateId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id", templateId);
      expect(data.data).toHaveProperty("type", TEST_TEMPLATE_TYPE);
      expect(data.data).toHaveProperty("content");
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "non-existent-id";
      const request = createRequest(`/api/text-templates/${nonExistentId}`);
      const response = await GET(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Text template not found" });
    });

    it("should return 400 if ID is missing", async () => {
      const request = createRequest("/api/text-templates/");
      const response = await GET(request, { params: { id: "" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Template ID is required" });
    });
  });

  describe("PUT /api/text-templates/[id]", () => {
    it("should update a template by ID", async () => {
      const updatedContent = "Updated content {{variable}}";
      const request = createRequestWithBody(
        `/api/text-templates/${templateId}`,
        {
          type: TEST_TEMPLATE_TYPE,
          content: updatedContent,
        },
      );

      const response = await PUT(request, { params: { id: templateId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id", templateId);
      expect(data.data).toHaveProperty("type", TEST_TEMPLATE_TYPE);
      expect(data.data).toHaveProperty("content", updatedContent);
      expect(data).toHaveProperty(
        "message",
        "Text template updated successfully",
      );

      // Verify in database
      const updatedTemplate = await prisma.reminderTextTemplates.findUnique({
        where: { id: templateId },
      });
      expect(updatedTemplate).not.toBeNull();
      expect(updatedTemplate?.content).toBe(updatedContent);
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "non-existent-id";
      const request = createRequestWithBody(
        `/api/text-templates/${nonExistentId}`,
        {
          type: "TEST_TYPE",
          content: "Test content",
        },
      );

      const response = await PUT(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Text template not found" });
    });

    it("should return 400 if ID is missing", async () => {
      const request = createRequestWithBody("/api/text-templates/", {
        type: "TEST_TYPE",
        content: "Test content",
      });

      const response = await PUT(request, { params: { id: "" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Template ID is required" });
    });

    it("should return 400 if type is missing", async () => {
      const request = createRequestWithBody(
        `/api/text-templates/${templateId}`,
        {
          content: "Test content without type",
        },
      );

      const response = await PUT(request, { params: { id: templateId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });

    it("should return 400 if content is missing", async () => {
      const request = createRequestWithBody(
        `/api/text-templates/${templateId}`,
        {
          type: TEST_TEMPLATE_TYPE,
        },
      );

      const response = await PUT(request, { params: { id: templateId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });
  });

  describe("DELETE /api/text-templates/[id]", () => {
    it("should delete a template and return 200", async () => {
      // Create a template specifically for deletion
      const deleteTemplate = await prisma.reminderTextTemplates.create({
        data: {
          id: crypto.randomUUID(),
          type: "TEST_DELETE_TEMPLATE",
          content: "Template to be deleted",
        },
      });

      const request = createRequest(`/api/text-templates/${deleteTemplate.id}`);
      const response = await DELETE(request, {
        params: { id: deleteTemplate.id },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Text template deleted successfully",
      });

      // Verify template was deleted from database
      const deletedTemplate = await prisma.reminderTextTemplates.findUnique({
        where: { id: deleteTemplate.id },
      });
      expect(deletedTemplate).toBeNull();
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "non-existent-id";
      const request = createRequest(`/api/text-templates/${nonExistentId}`);
      const response = await DELETE(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Text template not found" });
    });

    it("should return 400 if ID is missing", async () => {
      const request = createRequest("/api/text-templates/");
      const response = await DELETE(request, { params: { id: "" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Template ID is required" });
    });
  });
});
