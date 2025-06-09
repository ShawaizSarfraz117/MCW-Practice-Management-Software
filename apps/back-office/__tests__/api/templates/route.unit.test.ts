import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE } from "@/api/templates/route";
import { GET as GETById, PUT } from "@/api/templates/[id]/route";
import prismaMock from "@mcw/database/mock";
import { TemplateType } from "@/types/templateTypes";

describe("Templates API", () => {
  const mockTemplate = {
    id: "test-id",
    name: "Test Template",
    content: "Test Content",
    type: "Test Type",
    description: "Test Description",
    frequency_options: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    is_default: false,
    requires_signature: false,
    is_shareable: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/templates", () => {
    it("should get all templates", async () => {
      const mockTemplates = [
        mockTemplate,
        { ...mockTemplate, id: "test-id-2" },
      ];
      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(mockTemplates);

      const response = await GET(createRequest("/api/templates"));

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toHaveLength(mockTemplates.length);
      expect(responseData.data[0]).toHaveProperty("id", mockTemplates[0].id);

      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should filter templates by type", async () => {
      const mockTemplates = [mockTemplate];
      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(mockTemplates);

      const response = await GET(
        createRequest("/api/templates?type=Test%20Type"),
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toHaveLength(mockTemplates.length);

      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: "Test Type",
        }),
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should filter templates by shareable", async () => {
      const mockTemplates = [mockTemplate];
      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(mockTemplates);

      const response = await GET(createRequest("/api/templates?sharable=true"));

      expect(response.status).toBe(200);

      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_shareable: true,
        }),
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should filter templates by search term", async () => {
      const mockTemplates = [mockTemplate];
      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(mockTemplates);

      const response = await GET(createRequest("/api/templates?search=Test"));

      expect(response.status).toBe(200);

      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "Test" } },
            { description: { contains: "Test" } },
          ],
        }),
        orderBy: {
          created_at: "desc",
        },
      });
    });
  });

  describe("POST /api/templates", () => {
    it("should create a new template", async () => {
      prismaMock.surveyTemplate.create.mockResolvedValueOnce(mockTemplate);

      const templateData = {
        name: "Test Template",
        content: "Test Content",
        type: "Test Type",
        description: "Test Description",
        is_shareable: false,
      };

      const response = await POST(
        createRequestWithBody("/api/templates", templateData),
      );

      expect(response.status).toBe(201);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toHaveProperty("id", mockTemplate.id);
      expect(responseData.data).toHaveProperty("name", mockTemplate.name);

      expect(prismaMock.surveyTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: templateData.name,
          content: templateData.content,
          type: templateData.type,
          updated_at: expect.any(Date),
        }),
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = {
        // Missing required fields
        description: "Incomplete Template",
      };

      const response = await POST(
        createRequestWithBody("/api/templates", incompleteData),
      );

      expect(response.status).toBe(400);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(prismaMock.surveyTemplate.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/templates/[id]", () => {
    it("should get a single template by id", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(mockTemplate);

      const response = await GETById(
        createRequest(`/api/templates/${mockTemplate.id}`),
        { params: { id: mockTemplate.id } },
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toHaveProperty("id", mockTemplate.id);
      expect(responseData.data).toHaveProperty("name", mockTemplate.name);

      expect(prismaMock.surveyTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
    });

    it("should return 404 for non-existent template", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(null);

      const response = await GETById(
        createRequest("/api/templates/non-existent-id"),
        { params: { id: "non-existent-id" } },
      );

      expect(response.status).toBe(404);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
    });
  });

  describe("PUT /api/templates/[id]", () => {
    it("should update an existing template", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(mockTemplate);

      const updatedTemplate = {
        ...mockTemplate,
        name: "Updated Template",
      };

      prismaMock.surveyTemplate.update.mockResolvedValueOnce(updatedTemplate);

      const updateData = {
        name: "Updated Template",
      };

      const response = await PUT(
        createRequestWithBody(`/api/templates/${mockTemplate.id}`, updateData),
        { params: { id: mockTemplate.id } },
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("data");
      expect(responseData.data).toHaveProperty("id", mockTemplate.id);
      expect(responseData.data).toHaveProperty("name", updateData.name);

      expect(prismaMock.surveyTemplate.update).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
        data: expect.objectContaining({
          name: updateData.name,
          updated_at: expect.any(Date),
        }),
      });
    });

    it("should return 404 if template does not exist", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(null);

      const response = await PUT(
        createRequestWithBody("/api/templates/non-existent-id", {
          name: "Updated Name",
        }),
        { params: { id: "non-existent-id" } },
      );

      expect(response.status).toBe(404);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(prismaMock.surveyTemplate.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/templates", () => {
    it("should delete a template", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(mockTemplate);
      prismaMock.surveyTemplate.delete.mockResolvedValueOnce(mockTemplate);

      const response = await DELETE(
        createRequest(`/api/templates?id=${mockTemplate.id}`),
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("message");
      expect(responseData.message).toBe("Template deleted successfully");

      expect(prismaMock.surveyTemplate.delete).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
    });

    it("should return 400 if template ID is missing", async () => {
      const response = await DELETE(createRequest("/api/templates"));

      expect(response.status).toBe(400);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(prismaMock.surveyTemplate.delete).not.toHaveBeenCalled();
    });

    it("should return 404 if template does not exist", async () => {
      prismaMock.surveyTemplate.findUnique.mockResolvedValueOnce(null);

      const response = await DELETE(
        createRequest("/api/templates?id=non-existent-id"),
      );

      expect(response.status).toBe(404);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(prismaMock.surveyTemplate.delete).not.toHaveBeenCalled();
    });
  });

  describe("Shareable Documents Feature - Unit Tests", () => {
    it("should filter templates for intake form with sharable=true and is_active=true", async () => {
      const mockShareableTemplates = [
        {
          ...mockTemplate,
          id: "consent-1",
          name: "Informed Consent",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          is_default: true,
        },
        {
          ...mockTemplate,
          id: "phq9-1",
          name: "PHQ-9",
          type: TemplateType.SCORED_MEASURES,
          is_shareable: true,
          is_active: true,
          frequency_options: JSON.stringify({
            options: ["once", "weekly", "monthly"],
          }),
        },
        {
          ...mockTemplate,
          id: "intake-1",
          name: "Adult Intake Form",
          type: TemplateType.INTAKE_FORMS,
          is_shareable: true,
          is_active: true,
        },
      ];

      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(
        mockShareableTemplates,
      );

      const response = await GET(
        createRequest("/api/templates?sharable=true&is_active=true"),
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData.data).toHaveLength(3);
      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: {
          is_shareable: true,
          is_active: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should handle combined filters correctly", async () => {
      const mockTemplates = [
        {
          ...mockTemplate,
          id: "consent-form-1",
          name: "Consent Form for Therapy",
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
        },
      ];

      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce(mockTemplates);

      const response = await GET(
        createRequest(
          `/api/templates?type=${TemplateType.OTHER_DOCUMENTS}&sharable=true&is_active=true&search=Consent`,
        ),
      );

      expect(response.status).toBe(200);
      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: {
          type: TemplateType.OTHER_DOCUMENTS,
          is_shareable: true,
          is_active: true,
          OR: [
            { name: { contains: "Consent" } },
            { description: { contains: "Consent" } },
          ],
        },
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should return empty array when no shareable templates exist", async () => {
      prismaMock.surveyTemplate.findMany.mockResolvedValueOnce([]);

      const response = await GET(
        createRequest("/api/templates?sharable=true&is_active=true"),
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData.data).toHaveLength(0);
      expect(prismaMock.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: {
          is_shareable: true,
          is_active: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should create a shareable template with all fields", async () => {
      const newShareableTemplate = {
        id: "new-shareable-id",
        name: "New Consent Form",
        content: "Consent content",
        type: TemplateType.OTHER_DOCUMENTS,
        description: "New consent form for clients",
        is_shareable: true,
        is_active: true,
        is_default: true,
        requires_signature: true,
        frequency_options: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaMock.surveyTemplate.create.mockResolvedValueOnce(
        newShareableTemplate,
      );

      const response = await POST(
        createRequestWithBody("/api/templates", {
          name: newShareableTemplate.name,
          content: newShareableTemplate.content,
          type: newShareableTemplate.type,
          description: newShareableTemplate.description,
          is_shareable: true,
          is_default: true,
          requires_signature: true,
        }),
      );

      expect(response.status).toBe(201);
      const responseData = await response.json();

      expect(responseData.data).toMatchObject({
        name: newShareableTemplate.name,
        type: newShareableTemplate.type,
        is_shareable: true,
        is_default: true,
        requires_signature: true,
      });

      expect(prismaMock.surveyTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          is_shareable: true,
          is_default: true,
          requires_signature: true,
        }),
      });
    });

    it("should handle error when database query fails", async () => {
      prismaMock.surveyTemplate.findMany.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const response = await GET(
        createRequest("/api/templates?sharable=true&is_active=true"),
      );

      expect(response.status).toBe(500);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toBe("Failed to fetch templates");
    });
  });
});
