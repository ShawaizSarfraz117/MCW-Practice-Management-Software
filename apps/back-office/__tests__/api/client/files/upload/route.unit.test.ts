/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { NextRequest } from "next/server";

// Set up mock values - MUST be before any mocks that use them
const MOCK_USER_ID = "test-user-id";
const MOCK_CLINICIAN_ID = "test-clinician-id";
const MOCK_CLIENT_GROUP_ID = "test-group-id";

// Mock dependencies
vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue("mocked-uuid-123"),
  createRequest: (path: string, options?: RequestInit) => {
    return new NextRequest(
      new Request(`http://localhost:3000${path}`, options),
    );
  },
  createRequestWithFormData: (
    path: string,
    formData: FormData,
    options?: RequestInit,
  ) => {
    return new NextRequest(
      new Request(`http://localhost:3000${path}`, {
        method: "POST",
        ...options,
        body: formData,
      }),
    );
  },
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
  getClinicianInfo: vi.fn().mockResolvedValue({
    isClinician: true,
    clinicianId: "test-clinician-id",
  }),
}));

vi.mock("@/utils/azureStorage", () => ({
  uploadToAzureStorage: vi.fn(),
}));

// Mock Prisma
vi.mock("@mcw/database", () => {
  const clientGroupFindUniqueMock = vi.fn();
  const clientGroupFileCreateMock = vi.fn();
  const clientGroupFileFindManyMock = vi.fn();

  return {
    prisma: {
      clientGroup: {
        findUnique: clientGroupFindUniqueMock,
      },
      clientGroupFile: {
        create: clientGroupFileCreateMock,
        findMany: clientGroupFileFindManyMock,
      },
    },
  };
});

import { prisma } from "@mcw/database";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";
import { uploadToAzureStorage } from "@/utils/azureStorage";
import { createRequest, createRequestWithFormData } from "@mcw/utils";

// Import the route after all mocks are set up
import { GET, POST } from "@/api/client/files/upload/route";

// Helper to create a mock File
function createMockFile(name: string, type: string, size: number): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe("Client Files Upload API - Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the default mock behavior
    (getBackOfficeSession as Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (getClinicianInfo as Mock).mockResolvedValue({
      isClinician: true,
      clinicianId: MOCK_CLINICIAN_ID,
    });
    (uploadToAzureStorage as Mock).mockResolvedValue({
      url: "https://example.blob.core.windows.net/test-file.pdf",
      blobName: "test-group-id/uploads/test-file.pdf",
    });
  });

  describe("POST /api/client/files/upload", () => {
    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as Mock).mockResolvedValueOnce(null);
      const formData = new FormData();

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should return 401 if clinician info is not found", async () => {
      // Arrange
      (getClinicianInfo as Mock).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });
      const formData = new FormData();

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Unauthorized. Clinician information not found.",
      });
    });

    it("should return 400 if no file is provided", async () => {
      // Arrange
      const formData = new FormData();
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "No file provided",
      });
    });

    it("should return 400 if client_group_id is missing", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "client_group_id is required",
      });
    });

    it("should return 400 for invalid file type", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile("test.exe", "application/x-msdownload", 1000);
      formData.append("file", file);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      (prisma.clientGroup.findUnique as Mock).mockResolvedValueOnce({
        id: MOCK_CLIENT_GROUP_ID,
      });

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG",
      });
    });

    it("should return 400 for file exceeding size limit", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile(
        "large.pdf",
        "application/pdf",
        11 * 1024 * 1024,
      ); // 11MB
      formData.append("file", file);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      (prisma.clientGroup.findUnique as Mock).mockResolvedValueOnce({
        id: MOCK_CLIENT_GROUP_ID,
      });

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "File size exceeds 10MB limit",
      });
    });

    it("should return 404 if client group is not found", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      (prisma.clientGroup.findUnique as Mock).mockResolvedValueOnce(null);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({
        error: "Client group not found",
      });
    });

    it("should handle upload errors gracefully", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      const mockClientGroup = { id: MOCK_CLIENT_GROUP_ID };
      (prisma.clientGroup.findUnique as Mock).mockResolvedValueOnce(
        mockClientGroup,
      );
      (uploadToAzureStorage as Mock).mockRejectedValueOnce(
        new Error("Upload failed"),
      );

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Failed to upload file",
        details: "Upload failed",
      });
    });
  });

  describe("GET /api/client/files/upload", () => {
    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as Mock).mockResolvedValueOnce(null);

      // Act
      const req = createRequest("/api/client/files/upload");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should return 400 if client_group_id is missing", async () => {
      // Act
      const req = createRequest("/api/client/files/upload");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "client_group_id is required",
      });
    });

    it("should return uploaded files for a client group", async () => {
      // Arrange
      const mockFiles = [
        {
          id: "file-1",
          title: "Document 1",
          url: "https://example.com/doc1.pdf",
          type: "PRACTICE_UPLOAD",
          created_at: new Date("2024-01-01"),
          User: { id: MOCK_USER_ID },
          ClientFiles: [{ id: "cf-1", shared_at: new Date("2024-01-02") }],
          sharing_enabled: true,
        },
        {
          id: "file-2",
          title: "Document 2",
          url: "https://example.com/doc2.pdf",
          type: "PRACTICE_UPLOAD",
          created_at: new Date("2024-01-03"),
          User: null,
          ClientFiles: [],
          sharing_enabled: false,
        },
      ];

      (prisma.clientGroupFile.findMany as Mock).mockResolvedValueOnce(
        mockFiles,
      );

      // Act
      const req = createRequest(
        `/api/client/files/upload?client_group_id=${MOCK_CLIENT_GROUP_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        files: [
          {
            id: "file-1",
            title: "Document 1",
            url: "https://example.com/doc1.pdf",
            type: "PRACTICE_UPLOAD",
            uploadedBy: MOCK_USER_ID,
            isShared: true,
            sharingEnabled: true,
          },
          {
            id: "file-2",
            title: "Document 2",
            url: "https://example.com/doc2.pdf",
            type: "PRACTICE_UPLOAD",
            uploadedBy: null,
            isShared: false,
            sharingEnabled: false,
          },
        ],
      });

      expect(prisma.clientGroupFile.findMany).toHaveBeenCalledWith({
        where: {
          client_group_id: MOCK_CLIENT_GROUP_ID,
          type: "PRACTICE_UPLOAD",
          is_template: false,
        },
        include: {
          ClientFiles: true,
          User: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    });

    it("should return empty array when no files exist", async () => {
      // Arrange
      (prisma.clientGroupFile.findMany as Mock).mockResolvedValueOnce([]);

      // Act
      const req = createRequest(
        `/api/client/files/upload?client_group_id=${MOCK_CLIENT_GROUP_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        files: [],
      });
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const error = new Error("Database error");
      (prisma.clientGroupFile.findMany as Mock).mockRejectedValueOnce(error);

      // Act
      const req = createRequest(
        `/api/client/files/upload?client_group_id=${MOCK_CLIENT_GROUP_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: "Failed to fetch files",
        details: "Database error",
      });
    });
  });
});
