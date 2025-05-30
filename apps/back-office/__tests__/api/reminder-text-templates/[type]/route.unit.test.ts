/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/reminder-text-templates/[type]/route";

interface ReminderTextTemplate {
  id: string;
  type: string;
  content: string;
}

// Mock the logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  getDbLogger: vi.fn(),
}));

describe("GET /api/reminder-text-templates/[type] Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return a template when it exists", async () => {
    const mockTemplate = {
      id: "test-id",
      type: "appointment",
      content: "Test appointment template",
    };

    prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(
      mockTemplate,
    );

    const mockRequest = createRequest(
      "/api/reminder-text-templates/appointment",
    );
    const response = await GET(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = (await response.json()) as ReminderTextTemplate;

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTemplate);
    expect(prismaMock.reminderTextTemplates.findFirst).toHaveBeenCalledWith({
      where: { type: "appointment" },
    });
  });

  it("should return 404 when template does not exist", async () => {
    prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(null);

    const mockRequest = createRequest(
      "/api/reminder-text-templates/appointment",
    );
    const response = await GET(mockRequest as any, {
      params: { type: "appointment" },
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

  it("should handle database errors and return 500", async () => {
    prismaMock.reminderTextTemplates.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const mockRequest = createRequest(
      "/api/reminder-text-templates/appointment",
    );
    const response = await GET(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Internal server error");
  });

  it("should validate all valid template types", async () => {
    const validTypes = [
      "appointment",
      "telehealth",
      "document",
      "cancellation",
    ];

    for (const type of validTypes) {
      // Reset the mock for each iteration
      vi.resetAllMocks();

      const mockTemplate = {
        id: `test-id-${type}`,
        type,
        content: `Test ${type} template`,
      };

      prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(
        mockTemplate,
      );

      const mockRequest = createRequest(`/api/reminder-text-templates/${type}`);
      const response = await GET(mockRequest as any, { params: { type } });

      expect(response.status).toBe(200);

      const data = (await response.json()) as ReminderTextTemplate;
      expect(data.type).toBe(type);
    }
  });
});

describe("PUT /api/reminder-text-templates/[type] Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should update a template when it exists", async () => {
    const existingTemplate = {
      id: "test-id",
      type: "appointment",
      content: "Old content",
    };

    const updatedTemplate = {
      id: "test-id",
      type: "appointment",
      content: "New content",
    };

    prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(
      existingTemplate,
    );
    prismaMock.reminderTextTemplates.update.mockResolvedValueOnce(
      updatedTemplate,
    );

    const mockRequest = createRequestWithBody(
      "/api/reminder-text-templates/appointment",
      { content: "New content" },
      { method: "PUT" },
    );

    const response = await PUT(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = (await response.json()) as ReminderTextTemplate;

    expect(response.status).toBe(200);
    expect(data).toEqual(updatedTemplate);
    expect(prismaMock.reminderTextTemplates.update).toHaveBeenCalledWith({
      where: { id: "test-id" },
      data: { content: "New content" },
    });
  });

  it("should return 404 when template does not exist for update", async () => {
    prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(null);

    const mockRequest = createRequestWithBody(
      "/api/reminder-text-templates/appointment",
      { content: "New content" },
      { method: "PUT" },
    );

    const response = await PUT(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error", "Template not found");
  });

  it("should return 400 for invalid template type on update", async () => {
    const mockRequest = createRequestWithBody(
      "/api/reminder-text-templates/invalid",
      { content: "New content" },
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

  it("should return 400 for non-string content", async () => {
    const mockRequest = createRequestWithBody(
      "/api/reminder-text-templates/appointment",
      { content: 123 },
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

  it("should handle database errors during update", async () => {
    const existingTemplate = {
      id: "test-id",
      type: "appointment",
      content: "Old content",
    };

    prismaMock.reminderTextTemplates.findFirst.mockResolvedValueOnce(
      existingTemplate,
    );
    prismaMock.reminderTextTemplates.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const mockRequest = createRequestWithBody(
      "/api/reminder-text-templates/appointment",
      { content: "New content" },
      { method: "PUT" },
    );

    const response = await PUT(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Internal server error");
  });

  it("should handle malformed JSON in request body", async () => {
    // Create a request with malformed JSON by mocking the json() method
    const mockRequest = {
      json: vi.fn().mockRejectedValueOnce(new SyntaxError("Unexpected token")),
    };

    const response = await PUT(mockRequest as any, {
      params: { type: "appointment" },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Internal server error");
  });
});
