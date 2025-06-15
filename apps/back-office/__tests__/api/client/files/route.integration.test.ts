import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, POST } from "@/api/client/files/route";
import { prisma } from "@mcw/database";
import { cleanupDatabase } from "@mcw/database/test-utils";
import { generateUUID } from "@mcw/utils";
import { NextRequest } from "next/server";
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
  ClientPrismaFactory,
  ClientGroupPrismaFactory,
  ClientGroupMembershipPrismaFactory,
  ClientGroupFilePrismaFactory,
  ClientFilesPrismaFactory,
} from "@mcw/database/mocks";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

// Mock logger
vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  getDbLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Mock Azure Storage
vi.mock("@/utils/azureStorage", () => {
  return {
    uploadToAzureStorage: vi.fn(() =>
      Promise.resolve({
        blobUrl: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
        url: "https://storage.blob.core.windows.net/uploads/test-file.pdf?sas",
        blobName: "test-file.pdf",
      }),
    ),
  };
});

import { getBackOfficeSession } from "@/utils/helpers";

// Helper function to create request
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

function createFormDataRequest(url: string, formData: FormData): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: formData,
  });
}

describe("Client Files API Integration Tests", () => {
  // Test data holders
  let user: Awaited<ReturnType<typeof UserPrismaFactory.create>>;
  let clinician: Awaited<ReturnType<typeof ClinicianPrismaFactory.create>>;
  let client: Awaited<ReturnType<typeof ClientPrismaFactory.create>>;
  let clientGroup: Awaited<ReturnType<typeof ClientGroupPrismaFactory.create>>;
  let clientGroupFile: Awaited<
    ReturnType<typeof ClientGroupFilePrismaFactory.create>
  >;

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    vi.restoreAllMocks();

    // Create test data using factories
    user = await UserPrismaFactory.create({
      email: `test-user-${Date.now()}@example.com`,
    });

    clinician = await ClinicianPrismaFactory.create({
      User: {
        connect: { id: user.id },
      },
      first_name: "Test",
      last_name: "Clinician",
    });

    client = await ClientPrismaFactory.create({
      legal_first_name: "John",
      legal_last_name: "Doe",
    });

    clientGroup = await ClientGroupPrismaFactory.create({
      name: "Test Group",
      type: "individual",
      Clinician: {
        connect: { id: clinician.id },
      },
    });

    // Add client to group
    await ClientGroupMembershipPrismaFactory.create({
      ClientGroup: {
        connect: { id: clientGroup.id },
      },
      Client: {
        connect: { id: client.id },
      },
      role: "primary",
    });

    // Create practice upload file
    clientGroupFile = await ClientGroupFilePrismaFactory.create({
      ClientGroup: {
        connect: { id: clientGroup.id },
      },
      title: "Test Document.pdf",
      type: "Practice Upload",
      url: "https://storage.example.com/test-doc.pdf",
      User: {
        connect: { id: user.id },
      },
      sharing_enabled: true,
    });

    // Mock authenticated session
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: user.id,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  afterEach(async () => {
    await cleanupDatabase(prisma);
  });

  describe("GET /api/client/files", () => {
    it("should return files by client_group_id", async () => {
      const req = createRequest(
        `/api/client/files?client_group_id=${clientGroup.id}`,
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        id: clientGroupFile.id,
        title: "Test Document.pdf",
        type: "Practice Upload",
        url: "https://storage.example.com/test-doc.pdf",
        uploadedBy: user.id,
        isShared: false,
        sharingEnabled: true,
        status: "uploaded",
        hasLockedChildren: false, // No children yet
      });
    });

    it("should return practice uploads with hasLockedChildren flag", async () => {
      // Create shared instances with different statuses
      await ClientFilesPrismaFactory.create({
        Client: {
          connect: { id: client.id },
        },
        ClientGroupFile: {
          connect: { id: clientGroupFile.id },
        },
        status: "Pending",
        frequency: "ONCE",
        shared_at: new Date(),
      });

      const anotherClient = await ClientPrismaFactory.create({
        legal_first_name: "Jane",
        legal_last_name: "Smith",
      });

      await ClientFilesPrismaFactory.create({
        Client: {
          connect: { id: anotherClient.id },
        },
        ClientGroupFile: {
          connect: { id: clientGroupFile.id },
        },
        status: "Locked", // This one is locked
        frequency: "ONCE",
        shared_at: new Date(),
      });

      const req = createRequest(
        `/api/client/files?client_group_id=${clientGroup.id}`,
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        id: clientGroupFile.id,
        title: "Test Document.pdf",
        type: "Practice Upload",
        url: "https://storage.example.com/test-doc.pdf",
        uploadedBy: user.id,
        isShared: false,
        sharingEnabled: true,
        status: "uploaded",
        hasLockedChildren: true, // One of the children is locked
      });
    });

    it("should return files by client_id", async () => {
      // Create a shared file using factory
      await ClientFilesPrismaFactory.create({
        Client: {
          connect: { id: client.id },
        },
        ClientGroupFile: {
          connect: { id: clientGroupFile.id },
        },
        status: "Pending",
        frequency: "ONCE",
        shared_at: new Date(),
      });

      const req = createRequest(`/api/client/files?client_id=${client.id}`);
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.practiceUploads).toHaveLength(1);
      expect(json.sharedFiles).toHaveLength(1);
      expect(json.sharedFiles[0]).toMatchObject({
        client_id: client.id,
        client_group_file_id: clientGroupFile.id,
        status: "Pending",
        frequency: "ONCE",
      });
    });

    it("should return 401 for unauthenticated requests", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const req = createRequest(
        `/api/client/files?client_group_id=${clientGroup.id}`,
      );
      const response = await GET(req);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 when neither client_id nor client_group_id is provided", async () => {
      const req = createRequest("/api/client/files");
      const response = await GET(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        error: "Either client_id or client_group_id is required",
      });
    });

    it("should return 404 when client not found", async () => {
      const nonExistentId = generateUUID();
      const req = createRequest(`/api/client/files?client_id=${nonExistentId}`);
      const response = await GET(req);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Client or group not found" });
    });
  });

  describe("POST /api/client/files", () => {
    it("should successfully upload a file", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test content"], { type: "application/pdf" }),
        "upload.pdf",
      );
      formData.append("client_id", client.id);
      formData.append("client_group_id", clientGroup.id);
      formData.append("title", "Uploaded Document");

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.file).toMatchObject({
        title: "Uploaded Document",
        type: "Practice Upload",
        url: "https://storage.blob.core.windows.net/uploads/test-file.pdf",
      });

      // Verify in database
      const uploadedFile = await prisma.clientGroupFile.findUnique({
        where: { id: json.file.id },
      });
      expect(uploadedFile).not.toBeNull();
      expect(uploadedFile?.title).toBe("Uploaded Document");
    });

    it("should return 401 for unauthenticated requests", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 when no file provided", async () => {
      const formData = new FormData();
      formData.append("client_id", client.id);
      formData.append("client_group_id", clientGroup.id);

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "No file provided" });
    });

    it("should return 400 for invalid file type", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/octet-stream" }),
        "test.bin",
      );
      formData.append("client_id", client.id);
      formData.append("client_group_id", clientGroup.id);

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("Invalid file type");
    });

    it("should return 404 when client not found", async () => {
      const nonExistentId = generateUUID();
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );
      formData.append("client_id", nonExistentId);
      formData.append("client_group_id", clientGroup.id);

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Client not found" });
    });

    it("should return 404 when client group not found", async () => {
      const nonExistentGroupId = generateUUID();
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf",
      );
      formData.append("client_id", client.id);
      formData.append("client_group_id", nonExistentGroupId);

      const req = createFormDataRequest("/api/client/files", formData);
      const response = await POST(req);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Client group not found" });
    });
  });
});
