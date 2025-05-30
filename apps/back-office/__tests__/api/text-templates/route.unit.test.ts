import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the modules before importing
vi.mock("@mcw/database", () => ({
  prisma: {
    reminderTextTemplates: {
      findMany: vi.fn(),
      create: vi.fn(),
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
import { GET, POST } from "@/api/text-templates/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
vi.stubGlobal("crypto", {
  randomUUID: () => mockUUID,
});

describe("Text Templates API Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/text-templates", () => {
    it("should return all text templates when no type is specified", async () => {
      // Mock database response
      const mockTemplates = [
        {
          id: "1",
          type: "APPOINTMENT_REMINDER",
          content: "Your appointment is scheduled for {{date}}",
        },
        {
          id: "2",
          type: "CANCELLATION",
          content: "Your appointment has been canceled",
        },
      ];

      vi.mocked(prisma.reminderTextTemplates.findMany).mockResolvedValueOnce(
        mockTemplates,
      );

      // Create a mock request with empty search params
      const request = createRequest("/api/text-templates");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockTemplates });
      expect(prisma.reminderTextTemplates.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: {
          type: "asc",
        },
      });
    });

    it("should filter text templates by type when type is specified", async () => {
      // Mock database response
      const mockTemplates = [
        {
          id: "1",
          type: "APPOINTMENT_REMINDER",
          content: "Your appointment is scheduled for {{date}}",
        },
      ];

      vi.mocked(prisma.reminderTextTemplates.findMany).mockResolvedValueOnce(
        mockTemplates,
      );

      // Create a mock request with type search param
      const request = createRequest(
        "/api/text-templates?type=APPOINTMENT_REMINDER",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockTemplates });
      expect(prisma.reminderTextTemplates.findMany).toHaveBeenCalledWith({
        where: { type: "APPOINTMENT_REMINDER" },
        orderBy: {
          type: "asc",
        },
      });
    });

    it("should handle database errors and return 500", async () => {
      // Mock database error
      vi.mocked(prisma.reminderTextTemplates.findMany).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("/api/text-templates");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch text templates" });
    });
  });

  describe("POST /api/text-templates", () => {
    it("should create a new text template with valid data", async () => {
      // Mock database response
      const mockTemplate = {
        id: mockUUID,
        type: "APPOINTMENT_REMINDER",
        content: "Your appointment is scheduled for {{date}}",
      };

      vi.mocked(prisma.reminderTextTemplates.create).mockResolvedValueOnce(
        mockTemplate,
      );

      const request = createRequestWithBody("/api/text-templates", {
        type: "APPOINTMENT_REMINDER",
        content: "Your appointment is scheduled for {{date}}",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        data: mockTemplate,
        message: "Text template created successfully",
      });
      expect(prisma.reminderTextTemplates.create).toHaveBeenCalledWith({
        data: {
          id: mockUUID,
          type: "APPOINTMENT_REMINDER",
          content: "Your appointment is scheduled for {{date}}",
        },
      });
    });

    it("should return 400 if type is missing", async () => {
      const request = createRequestWithBody("/api/text-templates", {
        content: "Your appointment is scheduled for {{date}}",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
      expect(prisma.reminderTextTemplates.create).not.toHaveBeenCalled();
    });

    it("should return 400 if content is missing", async () => {
      const request = createRequestWithBody("/api/text-templates", {
        type: "APPOINTMENT_REMINDER",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
      expect(prisma.reminderTextTemplates.create).not.toHaveBeenCalled();
    });

    it("should handle database errors and return 500", async () => {
      // Mock database error
      vi.mocked(prisma.reminderTextTemplates.create).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequestWithBody("/api/text-templates", {
        type: "APPOINTMENT_REMINDER",
        content: "Your appointment is scheduled for {{date}}",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to create text template" });
    });
  });
});
