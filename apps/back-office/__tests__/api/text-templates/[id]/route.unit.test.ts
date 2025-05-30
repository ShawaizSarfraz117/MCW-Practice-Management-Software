import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the modules before importing
vi.mock("@mcw/database", () => ({
  prisma: {
    reminderTextTemplates: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Now import the modules that use the mocks
import { GET, PUT, DELETE } from "@/api/text-templates/[id]/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";

describe("Text Template by ID API Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Mock template data
  const mockTemplate = {
    id: "template-id-1",
    type: "APPOINTMENT_REMINDER",
    content: "Your appointment is scheduled for {{date}}",
  };

  describe("GET /api/text-templates/[id]", () => {
    it("should return a text template when it exists", async () => {
      // Mock database response
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      // Create a mock request
      const request = createRequest("/api/text-templates/template-id-1");

      const response = await GET(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockTemplate });
      expect(prisma.reminderTextTemplates.findUnique).toHaveBeenCalledWith({
        where: { id: "template-id-1" },
      });
    });

    it("should return 404 when template doesn't exist", async () => {
      // Mock database response for non-existent template
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        null,
      );

      const request = createRequest("/api/text-templates/non-existent-id");

      const response = await GET(request, {
        params: { id: "non-existent-id" },
      });
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

    it("should handle database errors and return 500", async () => {
      // Mock database error
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("/api/text-templates/template-id-1");

      const response = await GET(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch text template" });
    });
  });

  describe("PUT /api/text-templates/[id]", () => {
    it("should update a text template when it exists", async () => {
      // Mock database responses
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      const updatedTemplate = {
        ...mockTemplate,
        content: "Updated content with {{date}}",
      };

      vi.mocked(prisma.reminderTextTemplates.update).mockResolvedValueOnce(
        updatedTemplate,
      );

      const request = createRequestWithBody(
        "/api/text-templates/template-id-1",
        {
          type: "APPOINTMENT_REMINDER",
          content: "Updated content with {{date}}",
        },
      );

      const response = await PUT(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: updatedTemplate,
        message: "Text template updated successfully",
      });
      expect(prisma.reminderTextTemplates.update).toHaveBeenCalledWith({
        where: { id: "template-id-1" },
        data: {
          type: "APPOINTMENT_REMINDER",
          content: "Updated content with {{date}}",
        },
      });
    });

    it("should return 404 when template doesn't exist", async () => {
      // Mock database response for non-existent template
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        null,
      );

      const request = createRequestWithBody(
        "/api/text-templates/non-existent-id",
        {
          type: "APPOINTMENT_REMINDER",
          content: "Updated content",
        },
      );

      const response = await PUT(request, {
        params: { id: "non-existent-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Text template not found" });
      expect(prisma.reminderTextTemplates.update).not.toHaveBeenCalled();
    });

    it("should return 400 if ID is missing", async () => {
      const request = createRequestWithBody("/api/text-templates/", {
        type: "APPOINTMENT_REMINDER",
        content: "Updated content",
      });

      const response = await PUT(request, { params: { id: "" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Template ID is required" });
    });

    it("should return 400 if type is missing", async () => {
      const request = createRequestWithBody(
        "/api/text-templates/template-id-1",
        {
          content: "Updated content",
        },
      );

      const response = await PUT(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });

    it("should return 400 if content is missing", async () => {
      const request = createRequestWithBody(
        "/api/text-templates/template-id-1",
        {
          type: "APPOINTMENT_REMINDER",
        },
      );

      const response = await PUT(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });

    it("should handle database errors and return 500", async () => {
      // Mock database responses
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      // Mock database error during update
      vi.mocked(prisma.reminderTextTemplates.update).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequestWithBody(
        "/api/text-templates/template-id-1",
        {
          type: "APPOINTMENT_REMINDER",
          content: "Updated content",
        },
      );

      const response = await PUT(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to update text template" });
    });
  });

  describe("DELETE /api/text-templates/[id]", () => {
    it("should delete a text template when it exists", async () => {
      // Mock database responses
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      vi.mocked(prisma.reminderTextTemplates.delete).mockResolvedValueOnce(
        mockTemplate,
      );

      const request = createRequest("/api/text-templates/template-id-1");

      const response = await DELETE(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Text template deleted successfully",
      });
      expect(prisma.reminderTextTemplates.delete).toHaveBeenCalledWith({
        where: { id: "template-id-1" },
      });
    });

    it("should return 404 when template doesn't exist", async () => {
      // Mock database response for non-existent template
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        null,
      );

      const request = createRequest("/api/text-templates/non-existent-id");

      const response = await DELETE(request, {
        params: { id: "non-existent-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Text template not found" });
      expect(prisma.reminderTextTemplates.delete).not.toHaveBeenCalled();
    });

    it("should return 400 if ID is missing", async () => {
      const request = createRequest("/api/text-templates/");

      const response = await DELETE(request, { params: { id: "" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Template ID is required" });
    });

    it("should handle database errors and return 500", async () => {
      // Mock database responses
      vi.mocked(prisma.reminderTextTemplates.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      // Mock database error during delete
      vi.mocked(prisma.reminderTextTemplates.delete).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("/api/text-templates/template-id-1");

      const response = await DELETE(request, {
        params: { id: "template-id-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to delete text template" });
    });
  });
});
