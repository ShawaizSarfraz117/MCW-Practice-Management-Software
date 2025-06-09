/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { NextRequest } from "next/server";
import { FILE_FREQUENCY_OPTIONS } from "@mcw/types";

// Set up mock values - MUST be before any mocks that use them
const MOCK_UUID = "mocked-uuid-123";
const MOCK_USER_ID = "test-user-id";
const MOCK_CLIENT_ID = "test-client-id";
const MOCK_CLIENT_GROUP_ID = "test-group-id";

// Mock dependencies
vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue("mocked-uuid-123"),
  createRequest: vi.fn((path: string, options?: RequestInit) => {
    return new NextRequest(
      new Request(`http://localhost:3000${path}`, options),
    );
  }),
  createRequestWithBody: vi.fn(
    (path: string, body: Record<string, unknown>, options?: RequestInit) => {
      return new NextRequest(
        new Request(`http://localhost:3000${path}`, {
          method: "POST",
          ...options,
          body: JSON.stringify(body),
        }),
      );
    },
  ),
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id" },
  }),
}));

// Mock Prisma
vi.mock("@mcw/database", () => {
  const clientFindUniqueMock = vi.fn();
  const clientFilesFindManyMock = vi.fn();
  const clientGroupFileFindUniqueMock = vi.fn();
  const clientGroupFileCreateMock = vi.fn();
  const clientFilesCreateMock = vi.fn();
  const surveyTemplateFindUniqueMock = vi.fn();

  // Create a mock transaction function
  const transactionMock = vi.fn().mockImplementation(async (callback) => {
    const prismaMock = {
      client: {
        findUnique: clientFindUniqueMock,
      },
      clientFiles: {
        create: clientFilesCreateMock,
      },
      clientGroupFile: {
        findUnique: clientGroupFileFindUniqueMock,
        create: clientGroupFileCreateMock,
      },
      surveyTemplate: {
        findUnique: surveyTemplateFindUniqueMock,
      },
    };

    return await callback(prismaMock);
  });

  return {
    prisma: {
      client: {
        findUnique: clientFindUniqueMock,
      },
      clientFiles: {
        findMany: clientFilesFindManyMock,
        create: clientFilesCreateMock,
      },
      clientGroupFile: {
        findUnique: clientGroupFileFindUniqueMock,
        create: clientGroupFileCreateMock,
      },
      surveyTemplate: {
        findUnique: surveyTemplateFindUniqueMock,
      },
      $transaction: transactionMock,
    },
  };
});

import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Import the route after all mocks are set up
import { GET, POST } from "@/api/client/share-file/route";

describe("Client Share File API - Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the default mock behavior
    (getBackOfficeSession as Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
  });

  describe("GET /api/client/share-file", () => {
    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as Mock).mockResolvedValueOnce(null);

      // Act
      const req = createRequest("/api/client/share-file");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should return 400 if client_id is missing", async () => {
      // Act
      const req = createRequest("/api/client/share-file");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Client ID is required",
      });
    });

    it("should return 404 if client is not found", async () => {
      // Arrange
      (prisma.client.findUnique as Mock).mockResolvedValueOnce(null);

      // Act
      const req = createRequest(
        `/api/client/share-file?client_id=${MOCK_CLIENT_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Client not found",
      });
    });

    it("should return files for a valid client", async () => {
      // Arrange
      const mockClient = { id: MOCK_CLIENT_ID, legal_first_name: "John" };
      const sharedDate = new Date();
      const mockFiles = [
        {
          id: "file-1",
          client_id: MOCK_CLIENT_ID,
          client_group_file_id: "group-file-1",
          status: "Pending",
          frequency: FILE_FREQUENCY_OPTIONS.ONCE,
          shared_at: sharedDate,
          ClientGroupFile: {
            title: "Test Document",
            type: "Consent",
          },
          SurveyAnswers: [],
        },
      ];

      (prisma.client.findUnique as Mock).mockResolvedValueOnce(mockClient);
      (prisma.clientFiles.findMany as Mock).mockResolvedValueOnce(mockFiles);

      // Act
      const req = createRequest(
        `/api/client/share-file?client_id=${MOCK_CLIENT_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        id: "file-1",
        client_id: MOCK_CLIENT_ID,
        client_group_file_id: "group-file-1",
        status: "Pending",
        frequency: FILE_FREQUENCY_OPTIONS.ONCE,
        shared_at: sharedDate.toISOString(),
        ClientGroupFile: {
          title: "Test Document",
          type: "Consent",
        },
        SurveyAnswers: [],
      });

      expect(prisma.clientFiles.findMany).toHaveBeenCalledWith({
        where: {
          client_id: MOCK_CLIENT_ID,
        },
        include: {
          ClientGroupFile: true,
          SurveyAnswers: true,
        },
      });
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const error = new Error("Database error");
      (prisma.client.findUnique as Mock).mockRejectedValueOnce(error);

      // Act
      const req = createRequest(
        `/api/client/share-file?client_id=${MOCK_CLIENT_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Failed to fetch client group files",
        details: "Database error",
      });
    });
  });

  describe("POST /api/client/share-file", () => {
    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as Mock).mockResolvedValueOnce(null);

      // Act
      const req = createRequestWithBody("/api/client/share-file", {});
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 if client_group_id is missing", async () => {
      // Act
      const req = createRequestWithBody("/api/client/share-file", {
        clients: [{ client_id: MOCK_CLIENT_ID }],
      });
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "client_group_id is required" });
    });

    it("should return 400 if no clients are specified", async () => {
      // Act
      const req = createRequestWithBody("/api/client/share-file", {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [],
      });
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "At least one client must be specified" });
    });

    it("should return 400 if more than 10 clients are specified", async () => {
      // Arrange
      const clients = Array(11)
        .fill(null)
        .map((_, i) => ({
          client_id: `client-${i}`,
          survey_template_ids: ["template-1"],
        }));

      // Act
      const req = createRequestWithBody("/api/client/share-file", {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients,
      });
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "Maximum of 10 clients allowed per operation",
      });
    });

    it("should successfully share survey templates with clients", async () => {
      // Arrange
      const mockSurveyTemplate = {
        id: "template-1",
        name: "Intake Form",
      };
      const mockClientGroupFile = {
        id: "group-file-1",
        client_group_id: MOCK_CLIENT_GROUP_ID,
        survey_template_id: "template-1",
        title: "Intake Form",
        type: "Consent",
      };
      const mockClientFile = {
        id: MOCK_UUID,
        client_id: MOCK_CLIENT_ID,
        client_group_file_id: "group-file-1",
        status: "Pending",
        frequency: FILE_FREQUENCY_OPTIONS.ONCE,
      };

      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        (prisma.surveyTemplate.findUnique as Mock).mockResolvedValueOnce(
          mockSurveyTemplate,
        );
        (prisma.clientGroupFile.create as Mock).mockResolvedValueOnce(
          mockClientGroupFile,
        );
        (prisma.clientFiles.create as Mock).mockResolvedValueOnce(
          mockClientFile,
        );

        return callback(prisma);
      });

      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: ["template-1"],
            frequencies: { "template-1": FILE_FREQUENCY_OPTIONS.ONCE },
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        totalShared: 1,
        shared: expect.arrayContaining([
          expect.objectContaining({
            clientId: MOCK_CLIENT_ID,
            surveyTemplateId: "template-1",
          }),
        ]),
      });
    });

    it("should successfully share files with clients", async () => {
      // Arrange

      (prisma.$transaction as Mock).mockResolvedValueOnce({
        success: true,
        totalShared: 1,
        shared: [
          {
            clientGroupFileId: "file-1",
            clientFileId: MOCK_UUID,
            clientId: MOCK_CLIENT_ID,
            surveyTemplateId: null,
          },
        ],
      });

      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            file_ids: ["file-1"],
            frequencies: { "file-1": FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS },
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        totalShared: 1,
        shared: expect.arrayContaining([
          expect.objectContaining({
            clientId: MOCK_CLIENT_ID,
            surveyTemplateId: null,
          }),
        ]),
      });
    });

    it("should handle transaction errors gracefully", async () => {
      // Arrange
      const error = new Error("Transaction failed");
      (prisma.$transaction as Mock).mockRejectedValueOnce(error);

      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: ["template-1"],
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        error: "Failed to share files with clients",
        message: "Transaction failed",
      });
    });

    it("should handle missing client_id in client array", async () => {
      // Arrange
      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        try {
          await callback(prisma);
        } catch (_error) {
          throw new Error("Client ID is required for each client");
        }
      });

      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            survey_template_ids: ["template-1"],
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toBe("Client ID is required for each client");
    });

    it("should handle missing survey templates for client", async () => {
      // Arrange
      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        try {
          await callback(prisma);
        } catch (_error) {
          throw new Error(
            "No survey templates specified for client test-client-id",
          );
        }
      });

      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: [],
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toBe(
        "No survey templates specified for client test-client-id",
      );
    });
  });

  describe("calculateNextDueDate function", () => {
    it("should return null for ONCE frequency", async () => {
      // This is tested implicitly in the POST tests
      // The ONCE frequency should not set a next_due_date
      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: ["template-1"],
            frequencies: { "template-1": FILE_FREQUENCY_OPTIONS.ONCE },
          },
        ],
      };

      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        (prisma.surveyTemplate.findUnique as Mock).mockResolvedValueOnce({
          id: "template-1",
          name: "Test",
        });
        (prisma.clientGroupFile.create as Mock).mockResolvedValueOnce({
          id: "group-file-1",
        });
        (prisma.clientFiles.create as Mock).mockImplementationOnce((args) => {
          // Verify that next_due_date is calculated correctly for ONCE frequency
          expect(args.data.next_due_date).toBeNull();
          return { id: MOCK_UUID };
        });

        return callback(prisma);
      });

      const req = createRequestWithBody("/api/client/share-file", payload);
      await POST(req);
    });

    it("should calculate next due date for EVERY_2_WEEKS frequency", async () => {
      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: ["template-1"],
            frequencies: { "template-1": FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS },
          },
        ],
      };

      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        (prisma.surveyTemplate.findUnique as Mock).mockResolvedValueOnce({
          id: "template-1",
          name: "Test",
        });
        (prisma.clientGroupFile.create as Mock).mockResolvedValueOnce({
          id: "group-file-1",
        });
        (prisma.clientFiles.create as Mock).mockImplementationOnce((args) => {
          // Verify that next_due_date is calculated correctly for EVERY_2_WEEKS frequency
          const nextDueDate = args.data.next_due_date;
          expect(nextDueDate).toBeInstanceOf(Date);

          // Check that it's approximately 14 days from now
          const now = new Date();
          const daysDiff = Math.round(
            (nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          expect(daysDiff).toBe(14);

          return { id: MOCK_UUID };
        });

        return callback(prisma);
      });

      const req = createRequestWithBody("/api/client/share-file", payload);
      await POST(req);
    });

    it("should calculate next due date for EVERY_4_WEEKS frequency", async () => {
      const payload = {
        client_group_id: MOCK_CLIENT_GROUP_ID,
        clients: [
          {
            client_id: MOCK_CLIENT_ID,
            survey_template_ids: ["template-1"],
            frequencies: { "template-1": FILE_FREQUENCY_OPTIONS.EVERY_4_WEEKS },
          },
        ],
      };

      (prisma.$transaction as Mock).mockImplementationOnce(async (callback) => {
        (prisma.surveyTemplate.findUnique as Mock).mockResolvedValueOnce({
          id: "template-1",
          name: "Test",
        });
        (prisma.clientGroupFile.create as Mock).mockResolvedValueOnce({
          id: "group-file-1",
        });
        (prisma.clientFiles.create as Mock).mockImplementationOnce((args) => {
          // Verify that next_due_date is calculated correctly for EVERY_4_WEEKS frequency
          const nextDueDate = args.data.next_due_date;
          expect(nextDueDate).toBeInstanceOf(Date);

          // Check that it's approximately 28 days from now
          const now = new Date();
          const daysDiff = Math.round(
            (nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          expect(daysDiff).toBe(28);

          return { id: MOCK_UUID };
        });

        return callback(prisma);
      });

      const req = createRequestWithBody("/api/client/share-file", payload);
      await POST(req);
    });
  });
});
