import { SurveyTemplate, prisma } from "@mcw/database";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST } from "@/api/templates/route";
import { GET as GETById, PUT } from "@/api/templates/[id]/route";
import { Prisma } from "@prisma/client";

describe("Templates API Integration Tests", () => {
  let testTemplate: SurveyTemplate;
  let createdTemplateIds: string[] = [];

  beforeEach(async () => {
    // Create a test template with all fields using prisma directly
    testTemplate = await prisma.surveyTemplate.create({
      data: {
        name: "Test Template",
        content: "Test Content",
        type: "Test Type",
        description: "Test Description",
        is_active: true,
        is_default: false,
        requires_signature: false,
        is_shareable: false,
        updated_at: new Date(),
      },
    });
    createdTemplateIds.push(testTemplate.id);
  });

  afterEach(async () => {
    // Clean up all created templates
    if (createdTemplateIds.length > 0) {
      await prisma.surveyTemplate.deleteMany({
        where: {
          id: {
            in: createdTemplateIds,
          },
        },
      });
      createdTemplateIds = [];
    }
  });

  describe("GET /api/templates", () => {
    it("should get all templates", async () => {
      const req = createRequest("/api/templates");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("data");
      expect(Array.isArray(responseData.data)).toBe(true);
      
      // Find our test template in the results
      const foundTemplate = responseData.data.find(
        (template: SurveyTemplate) => template.id === testTemplate.id
      );
      expect(foundTemplate).toBeDefined();
      expect(foundTemplate).toMatchObject({
        id: testTemplate.id,
        name: testTemplate.name,
        content: testTemplate.content,
        type: testTemplate.type,
        description: testTemplate.description,
      });
    });

    it("should filter templates by type", async () => {
      const req = createRequest(`/api/templates?type=${testTemplate.type}`);
      const response = await GET(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("data");
      expect(Array.isArray(responseData.data)).toBe(true);
      
      // All returned templates should have the specified type
      responseData.data.forEach((template: SurveyTemplate) => {
        expect(template.type).toBe(testTemplate.type);
      });
    });
  });

  describe("POST /api/templates", () => {
    it("should create a new template", async () => {
      const newTemplate = {
        name: "New Template",
        content: "New Content",
        type: "New Type",
        description: "New Description",
        is_active: true,
        is_default: true,
        requires_signature: true,
        is_shareable: true,
        updated_at: new Date(),
      };

      const req = createRequestWithBody("/api/templates", newTemplate);
      const response = await POST(req);

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("data");
      
      // Store ID for cleanup
      createdTemplateIds.push(responseData.data.id);
      
      // Verify key properties were saved correctly
      expect(responseData.data).toMatchObject({
        name: newTemplate.name,
        content: newTemplate.content,
        type: newTemplate.type,
        description: newTemplate.description,
        is_default: newTemplate.is_default,
        requires_signature: newTemplate.requires_signature,
        is_shareable: newTemplate.is_shareable,
      });
      
      // Verify template was created in database
      const createdTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: responseData.data.id },
      });
      expect(createdTemplate).not.toBeNull();
      expect(createdTemplate?.name).toBe(newTemplate.name);
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteTemplate = {
        name: "Incomplete Template",
        // Missing content and type
      };

      const req = createRequestWithBody("/api/templates", incompleteTemplate);
      const response = await POST(req);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Name, content, and type are required fields");
    });
  });

  describe("GET /api/templates/[id]", () => {
    it("should get a single template by id", async () => {
      const req = createRequest(`/api/templates/${testTemplate.id}`);
      const response = await GETById(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toMatchObject({
        id: testTemplate.id,
        name: testTemplate.name,
        content: testTemplate.content,
        type: testTemplate.type,
        description: testTemplate.description,
      });
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const req = createRequest(`/api/templates/${nonExistentId}`);
      const response = await GETById(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Template not found");
    });
  });

  describe("PUT /api/templates/[id]", () => {
    it("should update an existing template", async () => {
      const updateData = {
        name: "Updated Template",
        content: "Updated Content",
        type: "Updated Type",
        description: "Updated Description",
        is_active: false,
        is_default: true,
        requires_signature: true,
        is_shareable: true,
      };

      const req = createRequestWithBody(
        `/api/templates/${testTemplate.id}`,
        updateData,
        { method: "PUT" }
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("data");
      
      // Verify key properties were updated correctly
      expect(responseData.data).toMatchObject({
        id: testTemplate.id,
        name: updateData.name,
        content: updateData.content,
        type: updateData.type,
        description: updateData.description,
        is_default: updateData.is_default,
        requires_signature: updateData.requires_signature,
        is_shareable: updateData.is_shareable,
      });

      // Verify template was updated in database
      const updatedTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: testTemplate.id },
      });
      expect(updatedTemplate).not.toBeNull();
      expect(updatedTemplate?.name).toBe(updateData.name);
    });

    it("should return 404 if template does not exist", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const updateData = {
        name: "Updated Template",
        content: "Updated Content",
        type: "Updated Type",
      };

      const req = createRequestWithBody(
        `/api/templates/${nonExistentId}`,
        updateData,
        { method: "PUT" }
      );
      const response = await PUT(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Template not found");
    });
  });

  describe("DELETE /api/templates", () => {
    it("should delete a template", async () => {
      const req = createRequest(`/api/templates/?id=${testTemplate.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("message");
      expect(responseData.message).toBe("Template deleted successfully");

      // Verify template was deleted from database
      const deletedTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: testTemplate.id },
      });
      expect(deletedTemplate).toBeNull();

      // Remove from createdTemplateIds since it's been deleted
      createdTemplateIds = createdTemplateIds.filter(id => id !== testTemplate.id);
    });

    it("should return 400 if template ID is missing", async () => {
      const req = createRequest("/api/templates/", { method: "DELETE" });
      const response = await DELETE(req);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Template ID is required");
    });
  });
}); 