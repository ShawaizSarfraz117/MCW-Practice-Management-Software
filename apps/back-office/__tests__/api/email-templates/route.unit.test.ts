import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import { EmailTemplateFactory } from "@mcw/database/mock-data";
import { GET, PUT } from "@/api/email-templates/[id]/route";
import { GET as GET_ALL } from "@/api/email-templates/route";
import { NextRequest } from "next/server";

interface MockRequestParams {
  method: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

vi.mock("@mcw/database", () => ({
  prisma: {
    emailTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock the NextRequest
const createMockRequest = ({
  method,
  body,
  params,
}: MockRequestParams): NextRequest => {
  return {
    nextUrl: {
      searchParams: new URLSearchParams(params),
    },
    json: () => Promise.resolve(body),
    headers: new Headers(),
    method,
  } as NextRequest;
};

describe("Email Templates API", () => {
  const mockTemplate = EmailTemplateFactory.build();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/email-templates", () => {
    it("should fetch all email templates", async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(prisma.emailTemplate.findMany).mockResolvedValue(mockTemplates);

      const request = createMockRequest({ method: "GET" });
      const response = await GET_ALL(request);
      const data = await response.json();

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { created_at: "desc" },
      });
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockTemplates);
    });

    it("should filter templates by type", async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(prisma.emailTemplate.findMany).mockResolvedValue(mockTemplates);

      const request = createMockRequest({
        method: "GET",
        params: { type: "automated" },
      });
      const response = await GET_ALL(request);
      const data = await response.json();

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { type: "automated" },
        orderBy: { created_at: "desc" },
      });
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockTemplates);
    });

    it("should handle database errors", async () => {
      vi.mocked(prisma.emailTemplate.findMany).mockRejectedValue(
        new Error("Database error"),
      );

      const request = createMockRequest({ method: "GET" });
      const response = await GET_ALL(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch email templates");
    });
  });

  describe("GET /api/email-templates/[id]", () => {
    it("should fetch a single email template by id", async () => {
      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(
        mockTemplate,
      );

      const request = createMockRequest({ method: "GET" });
      const response = await GET(request, { params: { id: mockTemplate.id } });
      const data = await response.json();

      expect(prisma.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
      });
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockTemplate);
    });

    it("should return 404 for non-existent template", async () => {
      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(null);

      const request = createMockRequest({ method: "GET" });
      const response = await GET(request, {
        params: { id: "non-existent-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Template not found");
    });

    it("should return 400 for invalid template id", async () => {
      const request = createMockRequest({ method: "GET" });
      const response = await GET(request, { params: { id: "undefined" } });
      const data = await response.json();

      expect(prisma.emailTemplate.findUnique).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid template ID");
    });

    it("should handle database errors", async () => {
      vi.mocked(prisma.emailTemplate.findUnique).mockRejectedValue(
        new Error("Database error"),
      );

      const request = createMockRequest({ method: "GET" });
      const response = await GET(request, { params: { id: mockTemplate.id } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch email template");
    });
  });

  describe("PUT /api/email-templates/[id]", () => {
    const validUpdateData = {
      name: "Updated Template",
      subject: "Updated Subject",
      content: "Updated Content",
      type: "automated",
      isActive: true,
    };

    it("should update an existing email template", async () => {
      const updatedTemplate = { ...mockTemplate, ...validUpdateData };
      vi.mocked(prisma.emailTemplate.update).mockResolvedValue(updatedTemplate);

      const request = createMockRequest({
        method: "PUT",
        body: validUpdateData,
      });
      const response = await PUT(request, { params: { id: mockTemplate.id } });
      const data = await response.json();

      expect(prisma.emailTemplate.update).toHaveBeenCalledWith({
        where: { id: mockTemplate.id },
        data: {
          name: validUpdateData.name,
          subject: validUpdateData.subject,
          content: validUpdateData.content,
          type: validUpdateData.type,
          is_active: validUpdateData.isActive,
        },
      });
      expect(response.status).toBe(200);
      expect(data.data).toEqual(updatedTemplate);
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        name: "Updated Template",
        // Missing required fields: subject, content, type
      };

      const request = createMockRequest({
        method: "PUT",
        body: invalidData,
      });
      const response = await PUT(request, { params: { id: mockTemplate.id } });
      const data = await response.json();

      expect(prisma.emailTemplate.update).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 400 for invalid template id", async () => {
      const request = createMockRequest({
        method: "PUT",
        body: validUpdateData,
      });
      const response = await PUT(request, { params: { id: "undefined" } });
      const data = await response.json();

      expect(prisma.emailTemplate.update).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid template ID");
    });

    it("should handle database errors", async () => {
      vi.mocked(prisma.emailTemplate.update).mockRejectedValue(
        new Error("Database error"),
      );

      const request = createMockRequest({
        method: "PUT",
        body: validUpdateData,
      });
      const response = await PUT(request, { params: { id: mockTemplate.id } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update email template");
    });
  });
});
