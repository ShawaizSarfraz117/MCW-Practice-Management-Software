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
import { GET, POST } from "@/api/text-templates/route";

// Define a template interface for type safety
interface Template {
  id: string;
  type: string;
  content: string;
}

describe("Text Templates API Routes (Integration)", () => {
  // Clean up before tests
  beforeAll(async () => {
    // Delete any test templates
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: {
          startsWith: "TEST_",
        },
      },
    });
  });

  // Clean up after tests
  afterAll(async () => {
    // Delete test templates
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: {
          startsWith: "TEST_",
        },
      },
    });
  });

  describe("GET /api/text-templates", () => {
    it("should return text templates", async () => {
      // Create a few test templates in the database
      const testTemplates = [
        {
          id: crypto.randomUUID(),
          type: "TEST_REMINDER_1",
          content: "Test content 1",
        },
        {
          id: crypto.randomUUID(),
          type: "TEST_REMINDER_2",
          content: "Test content 2",
        },
      ];

      await prisma.reminderTextTemplates.createMany({
        data: testTemplates,
      });

      // Make the request
      const request = createRequest("/api/text-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);

      // Check if our test templates are in the response
      const foundTemplates = data.data.filter(
        (t: Template) =>
          t.type === "TEST_REMINDER_1" || t.type === "TEST_REMINDER_2",
      );
      expect(foundTemplates.length).toBe(2);
    });

    it("should filter text templates by type", async () => {
      // Create test templates if not already existing
      const testType = "TEST_FILTER_TYPE";
      const testTemplate = {
        id: crypto.randomUUID(),
        type: testType,
        content: "Test filter content",
      };

      await prisma.reminderTextTemplates.upsert({
        where: { id: testTemplate.id },
        update: {},
        create: testTemplate,
      });

      // Make the request with type filter
      const request = createRequest(`/api/text-templates?type=${testType}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);

      // Verify filtered results
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      expect(data.data.every((t: Template) => t.type === testType)).toBe(true);
    });
  });

  describe("POST /api/text-templates", () => {
    it("should create a new text template", async () => {
      const testId = crypto.randomUUID();
      const testType = "TEST_CREATE_TEMPLATE";
      const testContent = "Test create content";

      // Use vi.spyOn to mock the crypto.randomUUID function
      vi.spyOn(crypto, "randomUUID").mockImplementation(() => testId);

      const request = createRequestWithBody("/api/text-templates", {
        type: testType,
        content: testContent,
      });

      try {
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty("data");
        expect(data.data).toEqual({
          id: testId,
          type: testType,
          content: testContent,
        });
        expect(data.message).toBe("Text template created successfully");

        // Verify in database
        const template = await prisma.reminderTextTemplates.findUnique({
          where: { id: testId },
        });
        expect(template).not.toBeNull();
        expect(template?.type).toBe(testType);
        expect(template?.content).toBe(testContent);
      } finally {
        // Restore original crypto.randomUUID
        vi.mocked(crypto.randomUUID).mockRestore();
      }
    });

    it("should return 400 if type is missing", async () => {
      const request = createRequestWithBody("/api/text-templates", {
        content: "Test content without type",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });

    it("should return 400 if content is missing", async () => {
      const request = createRequestWithBody("/api/text-templates", {
        type: "TEST_TYPE_WITHOUT_CONTENT",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Type and content are required fields" });
    });
  });
});
