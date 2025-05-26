import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET } from "@/api/reminder-text-templates/route";
import { GET as GETById, PUT } from "@/api/reminder-text-templates/[id]/route";
import prismaMock from "@mcw/database/mock";

// Mock logger to prevent test output pollution
vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Reminder Text Templates API", () => {
  const mockTemplate = {
    id: "dffa4ae9-55a4-48f9-8ee2-d06996b828ea",
    type: "appointment",
    content:
      "Reminder for your appointment on {appointment_date} at {appointment_time}",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/reminder-text-templates", () => {
    it("should get all reminder text templates", async () => {
      prismaMock.reminderTextTemplates.findMany.mockResolvedValueOnce([
        mockTemplate,
      ]);

      const req = createRequest("/api/reminder-text-templates");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json).toEqual([mockTemplate]);

      expect(prismaMock.reminderTextTemplates.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: {
          type: "asc",
        },
      });
    });

    it("should filter templates by type", async () => {
      prismaMock.reminderTextTemplates.findMany.mockResolvedValueOnce([
        mockTemplate,
      ]);

      const req = createRequest(
        "/api/reminder-text-templates?type=appointment",
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([mockTemplate]);

      expect(prismaMock.reminderTextTemplates.findMany).toHaveBeenCalledWith({
        where: { type: "appointment" },
        orderBy: {
          type: "asc",
        },
      });
    });

    it("should handle database errors", async () => {
      prismaMock.reminderTextTemplates.findMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const req = createRequest("/api/reminder-text-templates");
      const response = await GET(req);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to fetch reminder text templates",
      );
    });
  });

  describe("GET /api/reminder-text-templates/[id]", () => {
    it("should get a single reminder text template by id", async () => {
      prismaMock.reminderTextTemplates.findUnique.mockResolvedValueOnce(
        mockTemplate,
      );

      const req = createRequest(
        `/api/reminder-text-templates/${mockTemplate.id}`,
      );
      const response = await GETById(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(mockTemplate);

      expect(prismaMock.reminderTextTemplates.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
    });

    it("should return 404 for non-existent template", async () => {
      prismaMock.reminderTextTemplates.findUnique.mockResolvedValueOnce(null);

      const req = createRequest("/api/reminder-text-templates/non-existent-id");
      const response = await GETById(req, {
        params: { id: "non-existent-id" },
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Reminder text template not found");
    });

    it("should handle database errors", async () => {
      prismaMock.reminderTextTemplates.findUnique.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const req = createRequest(
        `/api/reminder-text-templates/${mockTemplate.id}`,
      );
      const response = await GETById(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to retrieve reminder text template",
      );
    });
  });

  describe("PUT /api/reminder-text-templates/[id]", () => {
    it("should update an existing reminder text template", async () => {
      const updatedData = {
        content: "Updated reminder content",
      };

      const updatedTemplate = {
        ...mockTemplate,
        ...updatedData,
      };

      prismaMock.reminderTextTemplates.findUnique.mockResolvedValueOnce(
        mockTemplate,
      );
      prismaMock.reminderTextTemplates.update.mockResolvedValueOnce(
        updatedTemplate,
      );

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${mockTemplate.id}`,
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Reminder text template updated successfully",
      );
      expect(json).toHaveProperty("template");
      expect(json.template).toMatchObject({
        id: mockTemplate.id,
        content: updatedData.content,
      });

      expect(prismaMock.reminderTextTemplates.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });

      expect(prismaMock.reminderTextTemplates.update).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
        data: {
          content: updatedData.content,
        },
      });
    });

    it("should return 400 if content is empty", async () => {
      const invalidData = {
        content: "",
      };

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${mockTemplate.id}`,
        invalidData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty("details");
    });

    it("should return 400 if content exceeds character limit", async () => {
      // Create a string longer than the 160 character limit
      const longContent = "A".repeat(161);
      const invalidData = {
        content: longContent,
      };

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${mockTemplate.id}`,
        invalidData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty("details");
    });

    it("should return 404 for non-existent template", async () => {
      const updatedData = {
        content: "Updated content",
      };

      prismaMock.reminderTextTemplates.findUnique.mockResolvedValueOnce(null);

      const req = createRequestWithBody(
        "/api/reminder-text-templates/non-existent-id",
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: "non-existent-id" } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Reminder text template not found");
    });

    it("should handle database errors", async () => {
      const updatedData = {
        content: "Updated content",
      };

      prismaMock.reminderTextTemplates.findUnique.mockResolvedValueOnce(
        mockTemplate,
      );
      prismaMock.reminderTextTemplates.update.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const req = createRequestWithBody(
        `/api/reminder-text-templates/${mockTemplate.id}`,
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: mockTemplate.id } });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to update reminder text template",
      );
    });
  });
});
