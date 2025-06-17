import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import {
  ClientFactory,
  ClientGroupFactory,
  ClientGroupFileFactory,
  ClientFilesFactory,
} from "@mcw/database/mocks";

// Set up mock values - MUST be before any mocks that use them
const MOCK_UUID = "mocked-uuid-123";
const MOCK_USER_ID = "test-user-id";
const MOCK_CLIENT_ID = "test-client-id";
const MOCK_CLIENT_GROUP_ID = "test-group-id";

// Mock dependencies
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  __esModule: true,
}));

vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue("mocked-uuid-123"),
  __esModule: true,
}));

vi.mock("@/utils/azureStorage", () => ({
  uploadToAzureStorage: vi.fn().mockResolvedValue({
    blobUrl: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
  }),
  __esModule: true,
}));

// Mock the database operations
vi.mock("@mcw/database", () => {
  const clientFindUniqueMock = vi.fn();
  const clientGroupFindUniqueMock = vi.fn();
  const clientFilesFindManyMock = vi.fn();
  const clientGroupFileFindManyMock = vi.fn();
  const clientGroupFileCreateMock = vi.fn();

  return {
    prisma: {
      client: {
        findUnique: clientFindUniqueMock,
      },
      clientGroup: {
        findUnique: clientGroupFindUniqueMock,
      },
      clientFiles: {
        findMany: clientFilesFindManyMock,
      },
      clientGroupFile: {
        findMany: clientGroupFileFindManyMock,
        create: clientGroupFileCreateMock,
      },
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { uploadToAzureStorage } from "@/utils/azureStorage";

// Import the route after all mocks are set up
import { GET, POST } from "@/api/client/files/route";
import { NextRequest } from "next/server";

// Helper functions
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

function createFormDataRequest(url: string, formData: FormData): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: formData,
  });
}

describe("Client Files API Unit Tests", () => {
  const mockSession = {
    user: {
      id: MOCK_USER_ID,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession,
    );
    (uploadToAzureStorage as ReturnType<typeof vi.fn>).mockResolvedValue({
      blobUrl: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
    });
  });

  describe("GET /api/client/files", () => {
    it("should return 401 when not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );

      // Act
      const req = createRequest("/api/client/files?client_group_id=group1");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 when neither client_id nor client_group_id is provided", async () => {
      // Act
      const req = createRequest("/api/client/files");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "Either client_id or client_group_id is required",
      });
    });

    it("should return files by client_group_id for share documents", async () => {
      // Arrange
      const mockPracticeFiles = [
        {
          ...ClientGroupFileFactory.build({
            id: "file1",
            title: "Document.pdf",
            type: "Practice Upload",
            url: "https://storage.example.com/doc.pdf",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            uploaded_by_id: MOCK_USER_ID,
          }),
          ClientFiles: [{ status: "Pending" }, { status: "Locked" }],
        },
      ];

      (prisma.clientGroupFile.findMany as unknown as Mock).mockResolvedValue(
        mockPracticeFiles,
      );

      // Act
      const req = createRequest(
        "/api/client/files?client_group_id=" + MOCK_CLIENT_GROUP_ID,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        id: "file1",
        title: "Document.pdf",
        type: "Practice Upload",
        url: "https://storage.example.com/doc.pdf",
        uploadedBy: MOCK_USER_ID,
        isShared: false,
        sharingEnabled: true,
        status: "uploaded",
        hasLockedChildren: true, // One of the children is locked
      });
    });

    it("should return practice uploads with hasLockedChildren: false when no locked children", async () => {
      // Arrange
      const mockPracticeFiles = [
        {
          ...ClientGroupFileFactory.build({
            id: "file2",
            title: "Report.pdf",
            type: "Practice Upload",
            url: "https://storage.example.com/report.pdf",
            created_at: new Date("2024-01-02"),
            updated_at: new Date("2024-01-02"),
            uploaded_by_id: MOCK_USER_ID,
          }),
          ClientFiles: [{ status: "Pending" }, { status: "Completed" }],
        },
      ];

      (prisma.clientGroupFile.findMany as unknown as Mock).mockResolvedValue(
        mockPracticeFiles,
      );

      // Act
      const req = createRequest(
        "/api/client/files?client_group_id=" + MOCK_CLIENT_GROUP_ID,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        id: "file2",
        title: "Report.pdf",
        type: "Practice Upload",
        url: "https://storage.example.com/report.pdf",
        uploadedBy: MOCK_USER_ID,
        isShared: false,
        sharingEnabled: true,
        status: "uploaded",
        hasLockedChildren: false, // No locked children
      });
    });

    it("should return files by client_id", async () => {
      // Arrange
      const mockClient = {
        ...ClientFactory.build({ id: MOCK_CLIENT_ID }),
        ClientGroupMembership: [
          {
            client_group_id: MOCK_CLIENT_GROUP_ID,
          },
        ],
      };

      const mockClientFile = ClientFilesFactory.build({
        id: "shared1",
        client_id: MOCK_CLIENT_ID,
        client_group_file_id: "file1",
        status: "Pending",
        frequency: "ONCE",
        shared_at: new Date("2024-01-02"),
        next_due_date: null,
        survey_answers_id: null,
        completed_at: null,
      });

      const mockSharedFiles = [
        {
          ...mockClientFile,
          ClientGroupFile: ClientGroupFileFactory.build({
            id: "file1",
            title: "Intake.pdf",
            type: "Practice Upload",
            url: "https://storage.example.com/intake.pdf",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
          }),
          SurveyAnswers: null,
        },
      ];

      const mockPracticeFiles = [
        {
          ...ClientGroupFileFactory.build({
            id: "file1",
            title: "Document.pdf",
            type: "Practice Upload",
            url: "https://storage.example.com/doc.pdf",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            uploaded_by_id: MOCK_USER_ID,
          }),
          ClientFiles: [{ status: "Pending" }, { status: "Completed" }],
        },
      ];

      (prisma.client.findUnique as unknown as Mock).mockResolvedValue(
        mockClient,
      );
      (prisma.clientFiles.findMany as unknown as Mock).mockResolvedValue(
        mockSharedFiles,
      );
      (prisma.clientGroupFile.findMany as unknown as Mock).mockResolvedValue(
        mockPracticeFiles,
      );

      // Act
      const req = createRequest(
        `/api/client/files?client_id=${MOCK_CLIENT_ID}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.practiceUploads).toHaveLength(1);
      expect(json.sharedFiles).toHaveLength(1);
    });

    it("should return 404 when client not found", async () => {
      // Arrange
      (prisma.client.findUnique as unknown as Mock).mockResolvedValue(null);

      // Act
      const req = createRequest("/api/client/files?client_id=nonexistent");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Client or group not found" });
    });

    it("should handle database errors", async () => {
      // Arrange
      (
        prisma.clientGroupFile.findMany as unknown as Mock
      ).mockRejectedValueOnce(new Error("Database error"));

      // Act
      const req = createRequest(
        "/api/client/files?client_group_id=" + MOCK_CLIENT_GROUP_ID,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Failed to fetch files" });
    });
  });

  describe("POST /api/client/files", () => {
    it("should return 401 when not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 when no file provided", async () => {
      // Arrange
      const formData = new FormData();

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "No file provided" });
    });

    it("should return 400 when client_id or client_group_id missing", async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "client_id and client_group_id are required",
      });
    });

    it("should return 400 for invalid file type", async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/octet-stream" }),
        "test.bin",
      );
      formData.append("client_id", MOCK_CLIENT_ID);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("Invalid file type");
    });

    it("should return 400 for oversized file", async () => {
      // Arrange
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([largeContent], { type: "application/pdf" }),
        "large.pdf",
      );
      formData.append("client_id", MOCK_CLIENT_ID);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "File size exceeds 10MB limit" });
    });

    it("should successfully upload a file", async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test content"], { type: "application/pdf" }),
        "test.pdf",
      );
      formData.append("client_id", MOCK_CLIENT_ID);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);
      formData.append("title", "Test Document");

      const mockClient = ClientFactory.build({ id: MOCK_CLIENT_ID });
      const mockClientGroup = ClientGroupFactory.build({
        id: MOCK_CLIENT_GROUP_ID,
      });
      const mockCreatedFile = ClientGroupFileFactory.build({
        id: MOCK_UUID,
        client_group_id: MOCK_CLIENT_GROUP_ID,
        title: "Test Document",
        type: "Practice Upload",
        url: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
        uploaded_by_id: MOCK_USER_ID,
        created_at: new Date(),
      });

      (prisma.client.findUnique as unknown as Mock).mockResolvedValue(
        mockClient,
      );
      (prisma.clientGroup.findUnique as unknown as Mock).mockResolvedValue(
        mockClientGroup,
      );
      (prisma.clientGroupFile.create as unknown as Mock).mockResolvedValue(
        mockCreatedFile,
      );

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.file).toMatchObject({
        id: MOCK_UUID,
        title: "Test Document",
        type: "Practice Upload",
        url: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
      });
    });

    it("should return 404 when client not found", async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );
      formData.append("client_id", "nonexistent");
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      (prisma.client.findUnique as unknown as Mock).mockResolvedValue(null);

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Client not found" });
    });

    it("should handle upload errors", async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );
      formData.append("client_id", MOCK_CLIENT_ID);
      formData.append("client_group_id", MOCK_CLIENT_GROUP_ID);

      (prisma.client.findUnique as unknown as Mock).mockResolvedValue(
        ClientFactory.build({ id: MOCK_CLIENT_ID }),
      );
      (prisma.clientGroup.findUnique as unknown as Mock).mockResolvedValue(
        ClientGroupFactory.build({ id: MOCK_CLIENT_GROUP_ID }),
      );
      (prisma.clientGroupFile.create as unknown as Mock).mockRejectedValueOnce(
        new Error("Upload failed"),
      );

      // Act
      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Failed to upload file");
    });
  });
});
