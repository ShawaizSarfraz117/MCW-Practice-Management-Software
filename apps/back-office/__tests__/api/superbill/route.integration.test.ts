/* eslint-disable max-lines-per-function */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Mock helpers module to avoid auth issues in tests
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    clinicianId: null,
    isClinician: false,
    clinician: null,
  }),
}));

// Import the route handler AFTER mocks are defined
import { GET, POST } from "@/api/superbill/route";

// Helper function for cleaning up test data
async function cleanupTestData(ids: {
  clientGroupId?: string;
  appointmentId?: string;
  superbillId?: string;
  userId?: string;
  clinicianId?: string;
  practiceServiceId?: string;
}) {
  // Delete superbill
  if (ids.superbillId) {
    try {
      await prisma.superbill.delete({ where: { id: ids.superbillId } });
    } catch (error) {
      console.log("Error deleting superbill:", error);
    }
  }

  // Delete appointment
  if (ids.appointmentId) {
    try {
      await prisma.appointment.delete({ where: { id: ids.appointmentId } });
    } catch (error) {
      console.log("Error deleting appointment:", error);
    }
  }

  // Delete practice service
  if (ids.practiceServiceId) {
    try {
      await prisma.practiceService.delete({
        where: { id: ids.practiceServiceId },
      });
    } catch (error) {
      console.log("Error deleting practice service:", error);
    }
  }

  // Delete client group
  if (ids.clientGroupId) {
    try {
      await prisma.clientGroup.delete({ where: { id: ids.clientGroupId } });
    } catch (error) {
      console.log("Error deleting client group:", error);
    }
  }

  // Delete clinician
  if (ids.clinicianId) {
    try {
      await prisma.clinician.delete({ where: { id: ids.clinicianId } });
    } catch (error) {
      console.log("Error deleting clinician:", error);
    }
  }

  // Delete user
  if (ids.userId) {
    try {
      await prisma.user.delete({ where: { id: ids.userId } });
    } catch (error) {
      console.log("Error deleting user:", error);
    }
  }
}

describe("Superbill API - Integration Tests", () => {
  // Test data IDs
  const testIds = {
    clientGroupId: "",
    appointmentId: "",
    superbillId: "",
    userId: "",
    clinicianId: "",
    practiceServiceId: "",
  };

  // Setup test data
  beforeAll(async () => {
    try {
      // Create a user for testing
      const user = await prisma.user.create({
        data: {
          id: generateUUID(),
          email: `test-user-${Date.now()}@example.com`,
          password_hash: "hashed_password",
        },
      });
      testIds.userId = user.id;

      // Create a clinician
      const clinician = await prisma.clinician.create({
        data: {
          id: generateUUID(),
          user_id: user.id,
          first_name: "Test",
          last_name: "Clinician",
          percentage_split: 70,
          is_active: true,
          address: "123 Test St",
        },
      });
      testIds.clinicianId = clinician.id;

      // Create a client
      const client = await prisma.client.create({
        data: {
          id: generateUUID(),
          legal_first_name: "Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
          is_active: true,
        },
      });

      // Create a client group for testing
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: generateUUID(),
          name: "Test Superbill Group",
          type: "INDIVIDUAL",
          available_credit: 0,
          clinician_id: clinician.id,
          ClientGroupMembership: {
            create: {
              client_id: client.id,
            },
          },
        },
      });
      testIds.clientGroupId = clientGroup.id;

      // Create a practice service for appointment
      const practiceService = await prisma.practiceService.create({
        data: {
          id: generateUUID(),
          code: "90837",
          description: "Therapy Session",
          rate: 150,
          duration: 60,
          is_default: true,
          type: "THERAPY",
          bill_in_units: false,
          available_online: false,
          allow_new_clients: false,
          require_call: false,
          block_before: 0,
          block_after: 0,
          color: "#FFFFFF",
        },
      });
      testIds.practiceServiceId = practiceService.id;

      // Create an appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: generateUUID(),
          client_group_id: clientGroup.id,
          clinician_id: clinician.id,
          start_date: new Date("2023-01-15T10:00:00Z"),
          end_date: new Date("2023-01-15T11:00:00Z"),
          status: "COMPLETED",
          service_id: practiceService.id,
          appointment_fee: 150,
          type: "INDIVIDUAL",
          created_by: user.id,
          is_all_day: false,
          is_recurring: false,
          title: "Therapy Session",
        },
      });
      testIds.appointmentId = appointment.id;

      // Create a superbill
      const superbill = await prisma.superbill.create({
        data: {
          id: generateUUID(),
          superbill_number: 501,
          client_group_id: clientGroup.id,
          provider_name: `${clinician.first_name} ${clinician.last_name}`,
          provider_email: user.email,
          client_name: `${client.legal_first_name} ${client.legal_last_name}`,
          status: "CREATED",
          created_at: new Date("2023-01-15"),
          issued_date: new Date("2023-01-15"),
          Appointment: {
            connect: {
              id: appointment.id,
            },
          },
        },
      });
      testIds.superbillId = superbill.id;
    } catch (error) {
      console.error("Error setting up test data:", error);
      throw error;
    }
  });

  // Clean up test data
  afterAll(async () => {
    try {
      await cleanupTestData({
        superbillId: testIds.superbillId,
        appointmentId: testIds.appointmentId,
        practiceServiceId: testIds.practiceServiceId,
        clientGroupId: testIds.clientGroupId,
        clinicianId: testIds.clinicianId,
        userId: testIds.userId,
      });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("GET /api/superbill", () => {
    it("should get a superbill by ID", async () => {
      // Act
      const req = createRequest(`/api/superbill?id=${testIds.superbillId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();

      // Verify our superbill data
      expect(result.id).toBe(testIds.superbillId);
      expect(result.client_group_id).toBe(testIds.clientGroupId);
      expect(result.service_code).toBe("90837");
      expect(result.service_description).toBe("Therapy Session");
      expect(result.status).toBe("CREATED");
      expect(result.fee).toBe(150);
    });

    it("should return 404 when superbill ID not found", async () => {
      // Act
      const nonExistentId = generateUUID();
      const req = createRequest(`/api/superbill?id=${nonExistentId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result).toHaveProperty("error", "Superbill not found");
    });

    it("should get superbills for a client group", async () => {
      // Act
      const req = createRequest(
        `/api/superbill?clientGroupId=${testIds.clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const superbills = await response.json();

      expect(Array.isArray(superbills)).toBe(true);
      expect(superbills.length).toBeGreaterThanOrEqual(1);

      // Verify our test superbill is in the results
      const foundSuperbill = superbills.find(
        (s: { id: string }) => s.id === testIds.superbillId,
      );
      expect(foundSuperbill).toBeDefined();
      expect(foundSuperbill.client_group_id).toBe(testIds.clientGroupId);
    });

    it("should get all superbills with pagination", async () => {
      // Act
      const req = createRequest(`/api/superbill`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.data)).toBe(true);

      // Verify pagination structure
      expect(result.pagination).toHaveProperty("page", 1);
      expect(result.pagination).toHaveProperty("limit", 20);
      expect(result.pagination).toHaveProperty("total");
      expect(result.pagination).toHaveProperty("totalPages");

      // Verify our test superbill is in the results
      const foundSuperbill = result.data.find(
        (s: { id: string }) => s.id === testIds.superbillId,
      );
      expect(foundSuperbill).toBeDefined();
    });
  });

  describe("POST /api/superbill", () => {
    it("should create a new superbill", async () => {
      // Arrange
      const requestData = {
        appointment_id: testIds.appointmentId,
      };

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const result = await response.json();

      // Verify superbill was created
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("client_group_id", testIds.clientGroupId);
      expect(result).toHaveProperty("service_code", "90837");
      expect(result).toHaveProperty("service_description", "Therapy Session");
      expect(result).toHaveProperty("status", "CREATED");
      expect(result).toHaveProperty("fee", 150);

      // Clean up created superbill
      if (result.id) {
        await prisma.superbill.delete({ where: { id: result.id } });
      }
    });

    it("should return 400 when required parameters are missing", async () => {
      // Arrange
      const incompleteData = {
        // Missing appointment_id
      };

      // Act
      const req = createRequestWithBody(`/api/superbill`, incompleteData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty(
        "error",
        "Missing required parameter: appointment_id",
      );
    });

    it("should return 404 when appointment is not found", async () => {
      // Arrange
      const nonExistentId = generateUUID();
      const requestData = {
        appointment_id: nonExistentId,
      };

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result).toHaveProperty("error", "Appointment not found");
    });
  });
});
