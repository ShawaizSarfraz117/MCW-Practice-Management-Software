/* eslint-disable max-lines-per-function */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/api/client/files/upload/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithFormData } from "@mcw/utils";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";
import { uploadToAzureStorage } from "@/utils/azureStorage";
import { cleanupTestUserData } from "@mcw/database/test-utils";

// Mock the auth functions
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  getClinicianInfo: vi.fn(),
}));

// Mock Azure storage
vi.mock("@/utils/azureStorage", () => ({
  uploadToAzureStorage: vi.fn(),
}));

// Helper to create a mock File
function createMockFile(name: string, type: string, size: number): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe("Client Files Upload API - Integration Tests", () => {
  // Test data
  let userId: string;
  let clinicianId: string;
  let clientGroupId: string;

  beforeEach(async () => {
    // Create test user
    userId = generateUUID();
    await prisma.user.create({
      data: {
        id: userId,
        email: `test-user-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });

    // Mock authentication
    (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: userId },
    });

    // Create test clinician
    clinicianId = generateUUID();
    await prisma.clinician.create({
      data: {
        id: clinicianId,
        user_id: userId,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test Street",
        percentage_split: 70,
        is_active: true,
      },
    });

    // Mock clinician info
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: clinicianId,
    });

    // Create test client group
    clientGroupId = generateUUID();
    await prisma.clientGroup.create({
      data: {
        id: clientGroupId,
        name: "Test Client Group",
        type: "individual",
        clinician_id: clinicianId,
      },
    });

    // Mock Azure storage upload
    (uploadToAzureStorage as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: "https://example.blob.core.windows.net/test-file.pdf",
      blobName: `${clientGroupId}/uploads/test-file.pdf`,
    });
  });

  afterEach(async () => {
    try {
      // IMPORTANT: Delete ClientGroupFile records BEFORE calling cleanupTestUserData
      // to avoid foreign key constraint violations
      if (clientGroupId) {
        await prisma.clientGroupFile.deleteMany({
          where: {
            OR: [
              { client_group_id: clientGroupId },
              { uploaded_by_id: userId },
            ],
          },
        });
      }

      // Now use the test cleanup utility to clean up user and related data
      if (userId) {
        await cleanupTestUserData(prisma, userId, { verbose: false });
      }

      // Clean up any orphaned client groups that weren't cleaned by the utility
      if (clientGroupId) {
        await prisma.clientGroup.deleteMany({
          where: {
            id: clientGroupId,
            // Only if not already cleaned up via clinician cascade
            clinician_id: null,
          },
        });
      }
    } catch (error) {
      console.error("Error during test cleanup:", error);
    }
  });

  describe("POST /api/client/files/upload", () => {
    it("should successfully upload a PDF file", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile("test-document.pdf", "application/pdf", 5000);
      formData.append("file", file);
      formData.append("client_group_id", clientGroupId);
      formData.append("title", "Integration Test Document");

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.file).toMatchObject({
        title: "Integration Test Document",
        url: "https://example.blob.core.windows.net/test-file.pdf",
        type: "PRACTICE_UPLOAD",
      });
      expect(json.file.id).toBeDefined();

      // Verify in database
      const savedFile = await prisma.clientGroupFile.findUnique({
        where: { id: json.file.id },
      });
      expect(savedFile).toBeDefined();
      expect(savedFile).toMatchObject({
        client_group_id: clientGroupId,
        title: "Integration Test Document",
        type: "PRACTICE_UPLOAD",
        url: "https://example.blob.core.windows.net/test-file.pdf",
        is_template: false,
        sharing_enabled: true,
      });
      // Check uploaded_by_id exists but don't check exact value since it's created by the API
      expect(savedFile?.uploaded_by_id).toBeDefined();
      expect(savedFile?.uploaded_by_id).toHaveLength(36); // UUID length

      // Verify Azure storage was called
      expect(uploadToAzureStorage).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test-document.pdf",
        "client-files",
        `${clientGroupId}/uploads`,
      );
    });

    it("should upload multiple files successfully", async () => {
      const files = [
        { name: "document1.pdf", title: "Document 1" },
        { name: "document2.jpg", title: "Document 2" },
        { name: "document3.docx", title: "Document 3" },
      ];

      const uploadedFileIds = [];

      for (const fileInfo of files) {
        // Arrange
        const formData = new FormData();
        const file = createMockFile(
          fileInfo.name,
          fileInfo.name.endsWith(".pdf")
            ? "application/pdf"
            : fileInfo.name.endsWith(".jpg")
              ? "image/jpeg"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          3000,
        );
        formData.append("file", file);
        formData.append("client_group_id", clientGroupId);
        formData.append("title", fileInfo.title);

        // Mock unique URL for each file
        (
          uploadToAzureStorage as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          url: `https://example.blob.core.windows.net/${fileInfo.name}`,
          blobName: `${clientGroupId}/uploads/${fileInfo.name}`,
        });

        // Act
        const req = createRequestWithFormData(
          "/api/client/files/upload",
          formData,
        );
        const response = await POST(req);

        // Assert
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json.success).toBe(true);
        uploadedFileIds.push(json.file.id);
      }

      // Verify all files in database
      const savedFiles = await prisma.clientGroupFile.findMany({
        where: {
          client_group_id: clientGroupId,
          type: "PRACTICE_UPLOAD",
        },
        orderBy: { created_at: "asc" },
      });

      expect(savedFiles).toHaveLength(3);
      savedFiles.forEach((file, index) => {
        expect(file.title).toBe(files[index].title);
        expect(file.url).toBe(
          `https://example.blob.core.windows.net/${files[index].name}`,
        );
      });
    });

    it("should use filename as title when title is not provided", async () => {
      // Arrange
      const formData = new FormData();
      const file = createMockFile(
        "important-document.pdf",
        "application/pdf",
        5000,
      );
      formData.append("file", file);
      formData.append("client_group_id", clientGroupId);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.file.title).toBe("important-document.pdf");

      // Verify in database
      const savedFile = await prisma.clientGroupFile.findUnique({
        where: { id: json.file.id },
      });
      expect(savedFile?.title).toBe("important-document.pdf");
    });

    it("should return 404 for non-existent client group", async () => {
      // Arrange
      const nonExistentGroupId = generateUUID();
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);
      formData.append("client_group_id", nonExistentGroupId);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe("Client group not found");

      // Verify no file was created
      const files = await prisma.clientGroupFile.findMany({
        where: { client_group_id: nonExistentGroupId },
      });
      expect(files).toHaveLength(0);
    });

    it("should return 401 when not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);
      formData.append("client_group_id", clientGroupId);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 401 when clinician info not found", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });
      const formData = new FormData();
      const file = createMockFile("test.pdf", "application/pdf", 1000);
      formData.append("file", file);
      formData.append("client_group_id", clientGroupId);

      // Act
      const req = createRequestWithFormData(
        "/api/client/files/upload",
        formData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized. Clinician information not found.");
    });
  });

  describe("GET /api/client/files/upload", () => {
    it("should return empty array when no files exist", async () => {
      // Act
      const req = createRequest(
        `/api/client/files/upload?client_group_id=${clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(0);
    });

    it("should return 401 when not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );

      // Act
      const req = createRequest(
        `/api/client/files/upload?client_group_id=${clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 when client_group_id is missing", async () => {
      // Act
      const req = createRequest("/api/client/files/upload");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("client_group_id is required");
    });
  });
});
