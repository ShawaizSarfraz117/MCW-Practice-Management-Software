/* eslint-disable max-lines-per-function */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/api/client/share-file/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { FILE_FREQUENCY_OPTIONS } from "@mcw/types";
import { getBackOfficeSession } from "@/utils/helpers";
import { cleanupTestUserData } from "@mcw/database/test-utils";

// Mock the getBackOfficeSession function
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("Client Share File API - Integration Tests", () => {
  // Test data
  let userId: string;
  let clinicianId: string;
  let clientId: string;
  let clientGroupId: string;
  let surveyTemplateId: string;
  let clientGroupFileId: string;

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

    // Create test client
    clientId = generateUUID();
    await prisma.client.create({
      data: {
        id: clientId,
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_active: true,
      },
    });

    // Create client group membership
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroupId,
        client_id: clientId,
        role: "primary",
      },
    });

    // Create test survey template
    surveyTemplateId = generateUUID();
    await prisma.surveyTemplate.create({
      data: {
        id: surveyTemplateId,
        name: "Test Intake Form",
        content: "{}",
        type: "INTAKE",
        is_shareable: true,
        is_active: true,
        updated_at: new Date(),
      },
    });

    // Create test client group file (verify client group exists first)
    const groupExists = await prisma.clientGroup.findUnique({
      where: { id: clientGroupId },
    });
    if (!groupExists) {
      throw new Error(
        `Client group ${clientGroupId} not found - beforeEach setup failed`,
      );
    }

    clientGroupFileId = generateUUID();
    await prisma.clientGroupFile.create({
      data: {
        id: clientGroupFileId,
        client_group_id: clientGroupId,
        title: "Test Document",
        type: "PRACTICE_UPLOAD",
        url: "https://example.com/test.pdf",
        uploaded_by_id: userId,
        sharing_enabled: true,
      },
    });
  });

  afterEach(async () => {
    try {
      // Clean up test-specific data first
      await prisma.clientFiles.deleteMany({
        where: { client_id: clientId },
      });

      // IMPORTANT: Delete ClientGroupFile records that reference the user
      // before using cleanupTestUserData
      await prisma.clientGroupFile.deleteMany({
        where: {
          OR: [{ client_group_id: clientGroupId }, { uploaded_by_id: userId }],
        },
      });

      await prisma.clientGroupMembership.deleteMany({
        where: {
          client_id: clientId,
        },
      });

      await prisma.client.deleteMany({
        where: { id: clientId },
      });

      await prisma.surveyTemplate.deleteMany({
        where: { id: surveyTemplateId },
      });

      // Clean up any orphaned client groups
      await prisma.clientGroup.deleteMany({
        where: {
          id: clientGroupId,
          // Only if not already cleaned up
          clinician_id: null,
        },
      });

      // Now use the test cleanup utility to clean up user and related data
      if (userId) {
        await cleanupTestUserData(prisma, userId, { verbose: false });
      }
    } catch (error) {
      console.error("Error during test cleanup:", error);
    }
  });

  describe("GET /api/client/share-file", () => {
    it("should return files for a client with shared files", async () => {
      // Arrange - Share a file with the client
      const clientFileId = generateUUID();
      await prisma.clientFiles.create({
        data: {
          id: clientFileId,
          client_id: clientId,
          client_group_file_id: clientGroupFileId,
          status: "Pending",
          frequency: FILE_FREQUENCY_OPTIONS.ONCE,
          shared_at: new Date(),
        },
      });

      // Act
      const req = createRequest(`/api/client/share-file?client_id=${clientId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.files).toHaveLength(1);
      expect(json.files[0]).toMatchObject({
        client_id: clientId,
        client_group_file_id: clientGroupFileId,
        status: "Pending",
        frequency: FILE_FREQUENCY_OPTIONS.ONCE,
      });
      expect(json.files[0].ClientGroupFile).toMatchObject({
        title: "Test Document",
        type: "PRACTICE_UPLOAD",
      });
    });

    it("should return empty array for client with no shared files", async () => {
      // Act
      const req = createRequest(`/api/client/share-file?client_id=${clientId}`);
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
      const req = createRequest(`/api/client/share-file?client_id=${clientId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 for non-existent client", async () => {
      // Act
      const nonExistentId = generateUUID();
      const req = createRequest(
        `/api/client/share-file?client_id=${nonExistentId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Client not found");
    });
  });

  describe("POST /api/client/share-file", () => {
    it("should successfully share survey templates with clients", async () => {
      // Arrange
      const payload = {
        client_group_id: clientGroupId,
        clients: [
          {
            client_id: clientId,
            survey_template_ids: [surveyTemplateId],
            frequencies: {
              [surveyTemplateId]: FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS,
            },
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.totalShared).toBe(1);
      expect(json.shared).toHaveLength(1);
      expect(json.shared[0]).toMatchObject({
        clientId: clientId,
        surveyTemplateId: surveyTemplateId,
      });

      // Verify in database
      const clientFiles = await prisma.clientFiles.findMany({
        where: { client_id: clientId },
        include: { ClientGroupFile: true },
      });
      expect(clientFiles).toHaveLength(1);
      expect(clientFiles[0].frequency).toBe(
        FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS,
      );
      expect(clientFiles[0].next_due_date).toBeInstanceOf(Date);
      expect(clientFiles[0].ClientGroupFile.survey_template_id).toBe(
        surveyTemplateId,
      );
    });

    it("should share multiple files and templates with multiple clients", async () => {
      // Create another client
      const clientId2 = generateUUID();
      await prisma.client.create({
        data: {
          id: clientId2,
          legal_first_name: "Jane",
          legal_last_name: "Smith",
          is_active: true,
        },
      });
      await prisma.clientGroupMembership.create({
        data: {
          client_group_id: clientGroupId,
          client_id: clientId2,
          role: "member",
        },
      });

      // Arrange
      const payload = {
        client_group_id: clientGroupId,
        clients: [
          {
            client_id: clientId,
            survey_template_ids: [surveyTemplateId],
            file_ids: [clientGroupFileId],
            frequencies: {
              [surveyTemplateId]: FILE_FREQUENCY_OPTIONS.ONCE,
              [clientGroupFileId]: FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS,
            },
          },
          {
            client_id: clientId2,
            survey_template_ids: [surveyTemplateId],
            frequencies: {
              [surveyTemplateId]: FILE_FREQUENCY_OPTIONS.EVERY_4_WEEKS,
            },
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.totalShared).toBe(3); // 2 for client1 + 1 for client2
      expect(json.shared).toHaveLength(3);

      // Verify in database
      const client1Files = await prisma.clientFiles.findMany({
        where: { client_id: clientId },
      });
      expect(client1Files).toHaveLength(2);

      const client2Files = await prisma.clientFiles.findMany({
        where: { client_id: clientId2 },
      });
      expect(client2Files).toHaveLength(1);

      // Clean up
      await prisma.clientFiles.deleteMany({ where: { client_id: clientId2 } });
      await prisma.clientGroupMembership.deleteMany({
        where: { client_id: clientId2 },
      });
      await prisma.client.delete({ where: { id: clientId2 } });
    });

    it("should handle ONCE frequency correctly (no next_due_date)", async () => {
      // Arrange
      const payload = {
        client_group_id: clientGroupId,
        clients: [
          {
            client_id: clientId,
            survey_template_ids: [surveyTemplateId],
            frequencies: {
              [surveyTemplateId]: FILE_FREQUENCY_OPTIONS.ONCE,
            },
          },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);

      // Verify in database
      const clientFiles = await prisma.clientFiles.findMany({
        where: { client_id: clientId },
      });
      expect(clientFiles).toHaveLength(1);
      expect(clientFiles[0].frequency).toBe(FILE_FREQUENCY_OPTIONS.ONCE);
      expect(clientFiles[0].next_due_date).toBeNull();
    });

    it("should return 401 when not authenticated", async () => {
      // Arrange
      (getBackOfficeSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );

      const payload = {
        client_group_id: clientGroupId,
        clients: [
          { client_id: clientId, survey_template_ids: [surveyTemplateId] },
        ],
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("should validate maximum 10 clients limit", async () => {
      // Arrange
      const clients = Array(11)
        .fill(null)
        .map((_, i) => ({
          client_id: `client-${i}`,
          survey_template_ids: [surveyTemplateId],
        }));

      const payload = {
        client_group_id: clientGroupId,
        clients,
      };

      // Act
      const req = createRequestWithBody("/api/client/share-file", payload);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Maximum of 10 clients allowed per operation");
    });
  });
});
