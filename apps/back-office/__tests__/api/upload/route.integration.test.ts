import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "@/api/upload/route";
import { BlobServiceClient } from "@azure/storage-blob";
import { prisma } from "@mcw/database";
import { UserPrismaFactory } from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { vi } from "vitest";
import { createRequestWithFormData } from "@mcw/utils";

// Get connection string from environment variable
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_SECRET || "";
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error(
    "AZURE_STORAGE_CONNECTION_STRING environment variable is required for integration tests",
  );
}

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("Upload API Integration Tests", () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING,
  );
  const containerName = "uploads";
  let testUser: Awaited<ReturnType<typeof UserPrismaFactory.create>>;
  const uploadedFiles: string[] = [];

  beforeAll(async () => {
    // Create a test user
    testUser = await UserPrismaFactory.create();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({ where: { id: testUser.id } });

    // Clean up any uploaded test files
    const containerClient = blobServiceClient.getContainerClient(containerName);
    for (const blobName of uploadedFiles) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
      } catch (error) {
        console.warn(`Failed to delete test file ${blobName}:`, error);
      }
    }
  });

  it("should upload a file successfully", async () => {
    // Create a test file
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    // Mock the session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: testUser.id },
    });

    const request = createRequestWithFormData("/api/upload", formData);
    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty("url");
    expect(json).toHaveProperty("blobName");
    uploadedFiles.push(json.blobName);

    // Wait a bit for Azure Storage to process the upload
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify the file exists in Azure Storage
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(json.blobName);
    const exists = await blockBlobClient.exists();
    expect(exists).toBe(true);
  });

  it("should handle large files", async () => {
    // Create a large file (16MB)
    const largeContent = new Array(16 * 1024 * 1024).fill("a").join("");
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    // Mock the session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: testUser.id },
    });

    const request = createRequestWithFormData("/api/upload", formData);
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "File size exceeds 15MB limit" });
  });

  it("should handle invalid file types", async () => {
    // Create a file with invalid type
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    // Mock the session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: testUser.id },
    });

    const request = createRequestWithFormData("/api/upload", formData);
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({
      error: "Invalid file type. Only jpg, jpeg, and png files are allowed.",
    });
  });

  it("should handle missing file", async () => {
    const formData = new FormData();

    // Mock the session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: testUser.id },
    });

    const request = createRequestWithFormData("/api/upload", formData);
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "No file provided" });
  });
});
