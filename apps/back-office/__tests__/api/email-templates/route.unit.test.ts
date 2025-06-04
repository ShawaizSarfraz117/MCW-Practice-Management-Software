import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST } from "@/api/email-templates/route";
import { GET as GETById, PUT } from "@/api/email-templates/[id]/route";
import prismaMock from "@mcw/database/mock";

describe("Email Templates API", () => {
  const mockTemplate = {
    id: "dffa4ae9-55a4-48f9-8ee2-d06996b828ea",
    name: "Test Template",
    subject: "Test Subject",
    content: "Test Content",
    type: "Test Type",
    email_type: "Test Email Type",
    created_by: "test-user-id",
    created_at: new Date("2025-05-23T22:17:38.248Z"),
    updated_at: new Date("2025-05-23T22:17:38.248Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/email-templates", () => {
    it("should get all email templates", async () => {
      prismaMock.emailTemplate.findMany.mockResolvedValueOnce([mockTemplate]);

      const req = createRequest("/api/email-templates");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toEqual([
        {
          ...mockTemplate,
          created_at: mockTemplate.created_at.toISOString(),
          updated_at: mockTemplate.updated_at.toISOString(),
        },
      ]);

      expect(prismaMock.emailTemplate.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should filter templates by type", async () => {
      prismaMock.emailTemplate.findMany.mockResolvedValueOnce([mockTemplate]);

      const req = createRequest("/api/email-templates?type=Test Type");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual([
        {
          ...mockTemplate,
          created_at: mockTemplate.created_at.toISOString(),
          updated_at: mockTemplate.updated_at.toISOString(),
        },
      ]);

      expect(prismaMock.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { type: "Test Type" },
        orderBy: {
          created_at: "desc",
        },
      });
    });
  });

  describe("POST /api/email-templates", () => {
    it("should create a new email template", async () => {
      const newTemplate = {
        name: "New Template",
        subject: "New Subject",
        content: "New Content",
        type: "New Type",
        email_type: "New Email Type",
      };

      const createdTemplate = {
        ...newTemplate,
        id: "new-id",
        created_by: "test-user-id",
        created_at: new Date("2025-05-23T22:17:38.248Z"),
        updated_at: new Date("2025-05-23T22:17:38.248Z"),
      };

      prismaMock.emailTemplate.create.mockResolvedValueOnce(createdTemplate);

      const req = createRequestWithBody("/api/email-templates", newTemplate, {
        headers: { "user-id": "test-user-id" },
      });
      const response = await POST(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        ...newTemplate,
        created_by: "test-user-id",
        created_at: createdTemplate.created_at.toISOString(),
        updated_at: createdTemplate.updated_at.toISOString(),
      });

      expect(prismaMock.emailTemplate.create).toHaveBeenCalledWith({
        data: {
          ...newTemplate,
          created_by: "test-user-id",
        },
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteTemplate = {
        name: "Incomplete Template",
        // Missing required fields
      };

      const req = createRequestWithBody(
        "/api/email-templates",
        incompleteTemplate,
        {
          headers: { "user-id": "test-user-id" },
        },
      );
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 401 if user-id is missing", async () => {
      const newTemplate = {
        name: "New Template",
        subject: "New Subject",
        content: "New Content",
        type: "New Type",
      };

      const req = createRequestWithBody("/api/email-templates", newTemplate);
      const response = await POST(req);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("GET /api/email-templates/[id]", () => {
    it("should get a single email template by id", async () => {
      prismaMock.emailTemplate.findUnique.mockResolvedValueOnce(mockTemplate);

      const req = createRequest(`/api/email-templates/${mockTemplate.id}`);
      const response = await GETById(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual({
        ...mockTemplate,
        created_at: mockTemplate.created_at.toISOString(),
        updated_at: mockTemplate.updated_at.toISOString(),
      });

      expect(prismaMock.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
    });

    it("should return 404 for non-existent template", async () => {
      prismaMock.emailTemplate.findUnique.mockResolvedValueOnce(null);

      const req = createRequest("/api/email-templates/non-existent-id");
      const response = await GETById(req, {
        params: { id: "non-existent-id" },
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("PUT /api/email-templates/[id]", () => {
    it("should update an existing email template", async () => {
      const updatedData = {
        name: "Updated Template",
        subject: "Updated Subject",
        content: "Updated Content",
        type: "Updated Type",
        email_type: "Updated Email Type",
      };

      const updatedTemplate = {
        ...mockTemplate,
        ...updatedData,
      };

      prismaMock.emailTemplate.findUnique.mockResolvedValueOnce(mockTemplate);
      prismaMock.emailTemplate.update.mockResolvedValueOnce(updatedTemplate);

      const req = createRequestWithBody(
        `/api/email-templates/${mockTemplate.id}`,
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        id: mockTemplate.id,
        ...updatedData,
        created_at: mockTemplate.created_at.toISOString(),
        updated_at: mockTemplate.updated_at.toISOString(),
      });

      expect(prismaMock.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });

      expect(prismaMock.emailTemplate.update).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
        data: updatedData,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = {
        name: "Incomplete Update",
        // Missing required fields
      };

      const req = createRequestWithBody(
        `/api/email-templates/${mockTemplate.id}`,
        incompleteData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("DELETE /api/email-templates", () => {
    it("should delete an email template", async () => {
      prismaMock.emailTemplate.delete.mockResolvedValueOnce(mockTemplate);

      const req = createRequest(`/api/email-templates/?id=${mockTemplate.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveProperty("success", true);

      expect(prismaMock.emailTemplate.delete).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
    });

    it("should return 400 if template ID is missing", async () => {
      const req = createRequest("/api/email-templates/", { method: "DELETE" });
      const response = await DELETE(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });
});
