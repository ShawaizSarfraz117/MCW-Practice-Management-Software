import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { POST } from "@/api/upload/route";
import { BlobServiceClient } from "@azure/storage-blob";
import { createRequestWithFormData } from "@mcw/utils";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock the Prisma client
vi.mock("@mcw/database", () => ({
  prisma: {
    audit: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock Azure Storage Blob
vi.mock("@azure/storage-blob", () => {
  const mockBlockBlobClient = {
    uploadData: vi.fn().mockResolvedValue({}),
    url: "https://fake-storage.com/container/blob",
    generateSasUrl: vi
      .fn()
      .mockResolvedValue("https://fake-storage.com/container/blob?sas=token"),
  };

  const mockContainerClient = {
    createIfNotExists: vi.fn().mockResolvedValue({}),
    getBlockBlobClient: vi.fn().mockReturnValue(mockBlockBlobClient),
  };

  const mockBlobServiceClient = {
    getContainerClient: vi.fn().mockReturnValue(mockContainerClient),
  };

  return {
    BlobServiceClient: {
      fromConnectionString: vi.fn().mockReturnValue(mockBlobServiceClient),
    },
    BlobSASPermissions: vi.fn().mockImplementation(() => ({
      read: false,
    })),
  };
});

describe("Upload API Unit Tests", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  let mockBlobServiceClient: ReturnType<
    typeof BlobServiceClient.fromConnectionString
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    mockBlobServiceClient = vi.mocked(BlobServiceClient.fromConnectionString)(
      "fake-connection-string",
    );
  });

  it("POST /api/upload should upload a file successfully", async () => {
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const request = createRequestWithFormData("/api/upload", formData);

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty("url");
    expect(json).toHaveProperty("blobName");
    expect(json.url).toContain("https://fake-storage.com/container/blob");
  });

  it("POST /api/upload should handle missing file", async () => {
    const formData = new FormData();
    const request = createRequestWithFormData("/api/upload", formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "No file provided" });
  });

  it("POST /api/upload should handle upload errors", async () => {
    // Override the default mock for this test
    const mockUploadData = vi
      .fn()
      .mockRejectedValue(new Error("Upload failed"));
    const blockBlobClient = mockBlobServiceClient
      .getContainerClient("uploads")
      .getBlockBlobClient("test.jpg");
    blockBlobClient.uploadData = mockUploadData;

    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const request = createRequestWithFormData("/api/upload", formData);

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({ error: "Failed to upload file" });
  });

  it("POST /api/upload should handle invalid file types", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = createRequestWithFormData("/api/upload", formData);
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({
      error: "Invalid file type. Only jpg, jpeg, and png files are allowed.",
    });
  });

  it("POST /api/upload should handle large files", async () => {
    const largeContent = new Array(16 * 1024 * 1024).fill("a").join("");
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const request = createRequestWithFormData("/api/upload", formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "File size exceeds 15MB limit" });
  });

  it("POST /api/upload should handle container creation errors", async () => {
    // Override the default mock for this test
    const mockCreateIfNotExists = vi
      .fn()
      .mockRejectedValue(new Error("Container creation failed"));
    const containerClient = mockBlobServiceClient.getContainerClient("uploads");
    containerClient.createIfNotExists = mockCreateIfNotExists;

    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const request = createRequestWithFormData("/api/upload", formData);

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({ error: "Failed to upload file" });
  });
});
