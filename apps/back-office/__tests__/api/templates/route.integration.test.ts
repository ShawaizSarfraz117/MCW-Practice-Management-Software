import { SurveyTemplate, prisma } from "@mcw/database";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST } from "@/api/templates/route";
import { GET as GETById, PUT } from "@/api/templates/[id]/route";
import { TemplateType } from "@/types/templateTypes";

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
        (template: SurveyTemplate) => template.id === testTemplate.id,
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

    it("should filter templates by is_active status", async () => {
      // Create an inactive template
      const inactiveTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Inactive Template",
          content: "Inactive Content",
          type: testTemplate.type,
          description: "Inactive Description",
          is_active: false,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(inactiveTemplate.id);

      // Test filtering by active status
      const reqActive = createRequest("/api/templates?is_active=true");
      const responseActive = await GET(reqActive);
      expect(responseActive.status).toBe(200);
      const activeData = await responseActive.json();

      // All returned templates should be active
      activeData.data.forEach((template: SurveyTemplate) => {
        expect(template.is_active).toBe(true);
      });

      // Test filtering by inactive status
      const reqInactive = createRequest("/api/templates?is_active=false");
      const responseInactive = await GET(reqInactive);
      expect(responseInactive.status).toBe(200);
      const inactiveData = await responseInactive.json();

      // All returned templates should be inactive
      inactiveData.data.forEach((template: SurveyTemplate) => {
        expect(template.is_active).toBe(false);
      });

      // Find our inactive template in the results
      const foundInactiveTemplate = inactiveData.data.find(
        (template: SurveyTemplate) => template.id === inactiveTemplate.id,
      );
      expect(foundInactiveTemplate).toBeDefined();
    });

    it("should filter templates by search term", async () => {
      // Create a template with unique name to search for
      const uniqueTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "UniqueSearchableName",
          content: "Unique Content",
          type: "Unique Type",
          description: "Unique Description",
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(uniqueTemplate.id);

      // Search by the unique name
      const req = createRequest("/api/templates?search=UniqueSearchableName");
      const response = await GET(req);
      expect(response.status).toBe(200);
      const responseData = await response.json();

      // Should find our unique template
      const foundTemplate = responseData.data.find(
        (template: SurveyTemplate) => template.id === uniqueTemplate.id,
      );
      expect(foundTemplate).toBeDefined();
      expect(foundTemplate).toMatchObject({
        name: "UniqueSearchableName",
      });
    });

    it("should filter templates by sharable status", async () => {
      // Create shareable and non-shareable templates
      const shareableTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Shareable Template",
          content: "Content",
          type: "INTAKE_FORMS",
          is_shareable: true,
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(shareableTemplate.id);

      const nonShareableTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Non-Shareable Template",
          content: "Content",
          type: "PROGRESS_NOTES",
          is_shareable: false,
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(nonShareableTemplate.id);

      // Test filtering by shareable=true
      const reqShareable = createRequest("/api/templates?sharable=true");
      const responseShareable = await GET(reqShareable);
      expect(responseShareable.status).toBe(200);
      const shareableData = await responseShareable.json();

      // All returned templates should be shareable
      shareableData.data.forEach((template: SurveyTemplate) => {
        expect(template.is_shareable).toBe(true);
      });

      // Should find our shareable template
      const foundShareableTemplate = shareableData.data.find(
        (template: SurveyTemplate) => template.id === shareableTemplate.id,
      );
      expect(foundShareableTemplate).toBeDefined();

      // Test filtering by shareable=false
      const reqNonShareable = createRequest("/api/templates?sharable=false");
      const responseNonShareable = await GET(reqNonShareable);
      expect(responseNonShareable.status).toBe(200);
      const nonShareableData = await responseNonShareable.json();

      // All returned templates should be non-shareable
      nonShareableData.data.forEach((template: SurveyTemplate) => {
        expect(template.is_shareable).toBe(false);
      });

      // Should find our non-shareable template
      const foundNonShareableTemplate = nonShareableData.data.find(
        (template: SurveyTemplate) => template.id === nonShareableTemplate.id,
      );
      expect(foundNonShareableTemplate).toBeDefined();
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
      expect(responseData.error).toBe(
        "Name, content, and type are required fields",
      );
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
        { method: "PUT" },
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

    it("should perform a partial update with only specified fields", async () => {
      // Capture original template data before update
      const originalTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: testTemplate.id },
      });

      // Update only the name and description
      const partialUpdateData = {
        name: "Partially Updated Template",
        description: "Partially Updated Description",
      };

      const req = createRequestWithBody(
        `/api/templates/${testTemplate.id}`,
        partialUpdateData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const responseData = await response.json();

      // Verify only specified fields were updated
      expect(responseData.data).toMatchObject({
        id: testTemplate.id,
        name: partialUpdateData.name,
        description: partialUpdateData.description,
      });

      // Verify unspecified fields retained their original values
      expect(responseData.data.content).toBe(originalTemplate?.content);
      expect(responseData.data.type).toBe(originalTemplate?.type);
      expect(responseData.data.is_active).toBe(originalTemplate?.is_active);

      // Verify database was updated correctly
      const updatedTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: testTemplate.id },
      });
      expect(updatedTemplate?.name).toBe(partialUpdateData.name);
      expect(updatedTemplate?.description).toBe(partialUpdateData.description);
      expect(updatedTemplate?.content).toBe(originalTemplate?.content);
    });

    it("should update boolean fields correctly", async () => {
      // Create a template with specific boolean values
      const booleanTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Boolean Test Template",
          content: "Boolean Test Content",
          type: "Boolean Test Type",
          description: "Boolean Test Description",
          is_active: true,
          is_default: false,
          requires_signature: false,
          is_shareable: false,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(booleanTemplate.id);

      // Update all boolean fields to their opposite values
      const booleanUpdateData = {
        // Note: is_active might not be directly updatable through the API
        // depending on implementation details
        is_default: true,
        requires_signature: true,
        is_shareable: true,
      };

      const req = createRequestWithBody(
        `/api/templates/${booleanTemplate.id}`,
        booleanUpdateData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: booleanTemplate.id } });

      expect(response.status).toBe(200);
      const responseData = await response.json();

      // Verify all boolean fields were updated correctly
      expect(responseData.data).toMatchObject({
        id: booleanTemplate.id,
        is_default: booleanUpdateData.is_default,
        requires_signature: booleanUpdateData.requires_signature,
        is_shareable: booleanUpdateData.is_shareable,
      });

      // Verify database was updated correctly
      const updatedTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: booleanTemplate.id },
      });
      expect(updatedTemplate?.is_default).toBe(booleanUpdateData.is_default);
      expect(updatedTemplate?.requires_signature).toBe(
        booleanUpdateData.requires_signature,
      );
      expect(updatedTemplate?.is_shareable).toBe(
        booleanUpdateData.is_shareable,
      );
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
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Template not found");
    });

    it("should return 400 if template ID is invalid", async () => {
      const invalidId = "undefined";
      const updateData = {
        name: "Updated Template",
      };

      const req = createRequestWithBody(
        `/api/templates/${invalidId}`,
        updateData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: invalidId } });

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Invalid template ID");
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
      createdTemplateIds = createdTemplateIds.filter(
        (id) => id !== testTemplate.id,
      );
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

  describe("Shareable Documents Feature", () => {
    it("should return only shareable and active templates for intake form", async () => {
      // Create multiple templates with different configurations
      const shareableActiveConsent = await prisma.surveyTemplate.create({
        data: {
          name: "Consent Form - Shareable Active",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          is_default: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(shareableActiveConsent.id);

      const shareableInactiveConsent = await prisma.surveyTemplate.create({
        data: {
          name: "Consent Form - Shareable Inactive",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: false,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(shareableInactiveConsent.id);

      const nonShareableActive = await prisma.surveyTemplate.create({
        data: {
          name: "Internal Form - Not Shareable",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: false,
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(nonShareableActive.id);

      const shareableScoredMeasure = await prisma.surveyTemplate.create({
        data: {
          name: "PHQ-9 - Shareable Active",
          content: "Content",
          type: TemplateType.SCORED_MEASURES,
          is_shareable: true,
          is_active: true,
          frequency_options: "{}",
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(shareableScoredMeasure.id);

      // Query for shareable and active templates (as intake form does)
      const req = createRequest("/api/templates?sharable=true&is_active=true");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();

      // Should include only shareable and active templates
      const templateIds = responseData.data.map((t: SurveyTemplate) => t.id);
      expect(templateIds).toContain(shareableActiveConsent.id);
      expect(templateIds).toContain(shareableScoredMeasure.id);
      expect(templateIds).not.toContain(shareableInactiveConsent.id); // inactive
      expect(templateIds).not.toContain(nonShareableActive.id); // not shareable
    });

    it("should categorize templates correctly by type", async () => {
      // Create templates of different types
      const consentTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Informed Consent Form",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(consentTemplate.id);

      const scoredMeasure = await prisma.surveyTemplate.create({
        data: {
          name: "GAD-7",
          content: "Content",
          type: TemplateType.SCORED_MEASURES,
          is_shareable: true,
          is_active: true,
          frequency_options: "{}",
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(scoredMeasure.id);

      const intakeForm = await prisma.surveyTemplate.create({
        data: {
          name: "Adult Intake Questionnaire",
          content: "Content",
          type: TemplateType.INTAKE_FORMS,
          is_shareable: true,
          is_active: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(intakeForm.id);

      // Query for shareable templates
      const req = createRequest("/api/templates?sharable=true&is_active=true");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();

      // Verify templates are returned with correct types
      const consentDoc = responseData.data.find(
        (t: SurveyTemplate) => t.id === consentTemplate.id,
      );
      expect(consentDoc).toBeDefined();
      expect(consentDoc.type).toBe(TemplateType.OTHER_DOCUMENTS);

      const scored = responseData.data.find(
        (t: SurveyTemplate) => t.id === scoredMeasure.id,
      );
      expect(scored).toBeDefined();
      expect(scored.type).toBe(TemplateType.SCORED_MEASURES);
      expect(scored.frequency_options).toBeDefined();

      const intake = responseData.data.find(
        (t: SurveyTemplate) => t.id === intakeForm.id,
      );
      expect(intake).toBeDefined();
      expect(intake.type).toBe(TemplateType.INTAKE_FORMS);
    });

    it("should return templates with default checked status", async () => {
      const defaultTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Default Consent Form",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          is_default: true,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(defaultTemplate.id);

      const nonDefaultTemplate = await prisma.surveyTemplate.create({
        data: {
          name: "Optional Form",
          content: "Content",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          is_default: false,
          updated_at: new Date(),
        },
      });
      createdTemplateIds.push(nonDefaultTemplate.id);

      const req = createRequest("/api/templates?sharable=true&is_active=true");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const responseData = await response.json();

      const defaultDoc = responseData.data.find(
        (t: SurveyTemplate) => t.id === defaultTemplate.id,
      );
      expect(defaultDoc).toBeDefined();
      expect(defaultDoc.is_default).toBe(true);

      const nonDefaultDoc = responseData.data.find(
        (t: SurveyTemplate) => t.id === nonDefaultTemplate.id,
      );
      expect(nonDefaultDoc).toBeDefined();
      expect(nonDefaultDoc.is_default).toBe(false);
    });
  });
});
