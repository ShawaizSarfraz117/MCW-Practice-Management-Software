import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, DELETE, POST } from "@/api/client/files/[id]/route";
import { prisma } from "@mcw/database";
import { cleanupDatabase } from "@mcw/database/test-utils";
import { generateUUID } from "@mcw/utils";
import { NextRequest } from "next/server";

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
vi.mock("@/utils/azureStorage", () => ({
  generateDownloadUrl: vi.fn().mockResolvedValue("https://storage.azure.com/test-sas-url"),
  deleteFromAzureStorage: vi.fn().mockResolvedValue(true),
}));

// Mock PDF generator
vi.mock("@/utils/pdfGenerator", () => {
  class MockSurveyPDFGenerator {
    generatePDF() {
      return {
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("PDF content")),
      };
    }
  }
  return {
    SurveyPDFGenerator: MockSurveyPDFGenerator,
  };
});

import { getBackOfficeSession } from "@/utils/helpers";

// Helper function to create request
function createRequest(url: string, method: string = "GET"): NextRequest {
  return new NextRequest(`http://localhost${url}`, { method });
}

function createRequestWithBody(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Client Files [id] API Integration Tests", () => {
  // Test data
  let _practiceId: string;
  let userId: string;
  let clinicianId: string;
  let clientId: string;
  let clientGroupId: string;
  let fileId: string;
  let sharedFileId: string;
  let surveyTemplateId: string;
  let surveyAnswersId: string;

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    vi.restoreAllMocks();

    // Create test data
    _practiceId = generateUUID();
    userId = generateUUID();
    clinicianId = generateUUID();
    clientId = generateUUID();
    clientGroupId = generateUUID();
    fileId = generateUUID();
    sharedFileId = generateUUID();
    surveyTemplateId = generateUUID();
    surveyAnswersId = generateUUID();

    // Mock authenticated session
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: userId,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    await prisma.$transaction(async (tx) => {
      // Note: Practice table no longer exists in current schema
      // practiceId is no longer needed

      // Create user
      await tx.user.create({
        data: {
          id: userId,
          email: `test-user-${Date.now()}@example.com`,
          password_hash: "hashed_password",
        },
      });

      // Create clinician
      await tx.clinician.create({
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

      // Create client
      await tx.client.create({
        data: {
          id: clientId,
          legal_first_name: "John",
          legal_last_name: "Doe",
          is_active: true,
        },
      });

      // Create client group
      await tx.clientGroup.create({
        data: {
          id: clientGroupId,
          name: "Test Group",
          type: "individual",
          clinician_id: clinicianId,
        },
      });

      // Add client to group
      await tx.clientGroupMembership.create({
        data: {
          client_group_id: clientGroupId,
          client_id: clientId,
          role: "primary",
        },
      });

      // Create client group file
      await tx.clientGroupFile.create({
        data: {
          id: fileId,
          client_group_id: clientGroupId,
          title: "test-document.pdf",
          url: "https://storage.blob.core.windows.net/uploads/test-document.pdf",
          type: "Practice Upload",
          uploaded_by_id: userId,
          sharing_enabled: true,
        },
      });

      // Create survey template
      await tx.surveyTemplate.create({
        data: {
          id: surveyTemplateId,
          name: "PHQ-9",
          content: JSON.stringify({ title: "PHQ-9", questions: ["Q1", "Q2"] }),
          type: "SCORED_MEASURE",
          is_active: true,
          updated_at: new Date(),
        },
      });
    });
  });

  afterEach(async () => {
    await cleanupDatabase(prisma);
  });

  describe("GET /api/client/files/[id]", () => {
    it("should return 404 for non-existent file", async () => {
      const nonExistentId = generateUUID();
      const req = createRequest(`/api/client/files/${nonExistentId}`);
      const response = await GET(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "File not found" });
    });

    it("should generate PDF for survey answers", async () => {
      // Create client group file with survey template
      const surveyFileId = generateUUID();
      await prisma.clientGroupFile.create({
        data: {
          id: surveyFileId,
          client_group_id: clientGroupId,
          title: "PHQ-9",
          type: "Survey Template",
          survey_template_id: surveyTemplateId,
          uploaded_by_id: userId,
          sharing_enabled: true,
        },
      });

      // Create shared client file with survey answers
      await prisma.$transaction(async (tx) => {
        await tx.clientFiles.create({
          data: {
            id: sharedFileId,
            client_id: clientId,
            client_group_file_id: surveyFileId,
            status: "Completed",
            frequency: "ONCE",
            shared_at: new Date(),
          },
        });

        await tx.surveyAnswers.create({
          data: {
            id: surveyAnswersId,
            template_id: surveyTemplateId,
            client_id: clientId,
            content: JSON.stringify({ q1: "1", q2: "2" }),
            completed_at: new Date(),
            status: "COMPLETED",
            assigned_at: new Date(),
          },
        });
        
        // Update the client file with the survey answer
        await tx.clientFiles.update({
          where: { id: sharedFileId },
          data: {
            survey_answers_id: surveyAnswersId,
          },
        });
      });

      const req = createRequest(`/api/client/files/${sharedFileId}`);
      const response = await GET(req, { params: { id: sharedFileId } });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain("PHQ-9.pdf");
    });

    it("should return 401 for unauthenticated requests", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const req = createRequest(`/api/client/files/${fileId}`);
      const response = await GET(req, { params: { id: fileId } });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });
  });

  describe("DELETE /api/client/files/[id]", () => {
    it("should delete file without shared instances", async () => {
      const req = createRequest(`/api/client/files/${fileId}`, "DELETE");
      const response = await DELETE(req, { params: { id: fileId } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        message: "File deleted successfully",
      });

      // Verify file was deleted
      const deletedFile = await prisma.clientGroupFile.findUnique({
        where: { id: fileId },
      });
      expect(deletedFile).toBeNull();
    });

    it("should require confirmation for files with shared instances", async () => {
      // Create a second client
      const secondClientId = generateUUID();
      await prisma.client.create({
        data: {
          id: secondClientId,
          primary_clinician_id: clinicianId,
          legal_first_name: "Jane",
          legal_last_name: "Smith",
          is_active: true,
        },
      });

      // Add second client to the group
      await prisma.clientGroupMembership.create({
        data: {
          client_group_id: clientGroupId,
          client_id: secondClientId,
          role: "secondary",
        },
      });

      // Create shared file instances
      await prisma.clientFiles.createMany({
        data: [
          {
            id: generateUUID(),
            client_id: clientId,
            client_group_file_id: fileId,
            shared_at: new Date(),
            status: "Pending",
            frequency: "ONCE",
          },
          {
            id: generateUUID(),
            client_id: secondClientId,
            client_group_file_id: fileId,
            shared_at: new Date(),
            status: "Completed",
            frequency: "ONCE",
          },
        ],
      });

      const req = createRequest(`/api/client/files/${fileId}`, "DELETE");
      const response = await DELETE(req, { params: { id: fileId } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.requiresConfirmation).toBe(true);
      expect(json.sharedWithCount).toBe(2);
      expect(json.message).toContain("This file will be permanently removed");

      // Verify file was NOT deleted
      const file = await prisma.clientGroupFile.findUnique({
        where: { id: fileId },
      });
      expect(file).not.toBeNull();
    });

    it("should unshare client file", async () => {
      // Create a shared client file
      const clientFileId = generateUUID();
      await prisma.clientFiles.create({
        data: {
          id: clientFileId,
          client_id: clientId,
          client_group_file_id: fileId,
          status: "Pending",
          frequency: "ONCE",
          shared_at: new Date(),
        },
      });

      const req = createRequest(`/api/client/files/${clientFileId}`, "DELETE");
      const response = await DELETE(req, { params: { id: clientFileId } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        message: "File unshared successfully",
      });

      // Verify client file was deleted
      const deletedClientFile = await prisma.clientFiles.findUnique({
        where: { id: clientFileId },
      });
      expect(deletedClientFile).toBeNull();
    });
  });

  describe("POST /api/client/files/[id]", () => {
    it("should confirm delete for files with shared instances", async () => {
      // Create a second client
      const secondClientId = generateUUID();
      await prisma.client.create({
        data: {
          id: secondClientId,
          primary_clinician_id: clinicianId,
          legal_first_name: "Jane",
          legal_last_name: "Smith",
          is_active: true,
        },
      });

      // Add second client to the group
      await prisma.clientGroupMembership.create({
        data: {
          client_group_id: clientGroupId,
          client_id: secondClientId,
          role: "secondary",
        },
      });

      // Create shared file instances
      await prisma.clientFiles.createMany({
        data: [
          {
            id: generateUUID(),
            client_id: clientId,
            client_group_file_id: fileId,
            shared_at: new Date(),
            status: "Pending",
            frequency: "ONCE",
          },
          {
            id: generateUUID(),
            client_id: secondClientId,
            client_group_file_id: fileId,
            shared_at: new Date(),
            status: "Completed",
            frequency: "ONCE",
          },
        ],
      });

      const req = createRequestWithBody(`/api/client/files/${fileId}`, {
        confirmDelete: true,
      });
      const response = await POST(req, { params: { id: fileId } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        message: "File and all shares deleted successfully",
      });

      // Verify file and shared instances were deleted
      const file = await prisma.clientGroupFile.findUnique({
        where: { id: fileId },
      });
      expect(file).toBeNull();

      const sharedFiles = await prisma.clientFiles.findMany({
        where: { client_group_file_id: fileId },
      });
      expect(sharedFiles).toHaveLength(0);
    });

    it("should return 400 without confirmation flag", async () => {
      const req = createRequestWithBody(`/api/client/files/${fileId}`, {});
      const response = await POST(req, { params: { id: fileId } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Confirmation required" });
    });

    it("should return 404 for non-existent file", async () => {
      const nonExistentId = generateUUID();
      const req = createRequestWithBody(`/api/client/files/${nonExistentId}`, {
        confirmDelete: true,
      });
      const response = await POST(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "File not found" });
    });
  });
});