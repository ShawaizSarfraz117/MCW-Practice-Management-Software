import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { GET } from "../../../src/app/api/requests/route";
import { prisma } from "@mcw/database";
import { createRequest, generateUUID } from "@mcw/utils";
import { vi } from "vitest";

// Mock the helpers module
vi.mock("../../../src/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  __esModule: true,
}));

import { getClinicianInfo } from "../../../src/utils/helpers";

describe("Requests API Integration Tests", () => {
  let testClinicianId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user and clinician
    const testUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        email: `test-user-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });
    testUserId = testUser.id;

    const testClinician = await prisma.clinician.create({
      data: {
        id: generateUUID(),
        user_id: testUserId,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test Street",
        percentage_split: 70,
        is_active: true,
      },
    });
    testClinicianId = testClinician.id;

    // Setup mock for getClinicianInfo
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: testClinicianId,
    });
  });

  afterEach(async () => {
    // Clean up in proper order to avoid foreign key constraints
    await prisma.appointmentRequests.deleteMany({});
    await prisma.requestContactItems.deleteMany({});
    await prisma.clinicianClient.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.practiceService.deleteMany({});
    await prisma.clinician.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.audit.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe("GET /api/requests", () => {
    it("should return appointment requests with existing clients", async () => {
      // Arrange
      const testService = await prisma.practiceService.create({
        data: {
          id: generateUUID(),
          type: "therapy",
          rate: 150.0,
          code: "90834",
          description: "Individual Therapy",
          duration: 60,
          color: "#FF0000",
        },
      });

      const testClient = await prisma.client.create({
        data: {
          id: generateUUID(),
          legal_first_name: "John",
          legal_last_name: "Doe",
          date_of_birth: new Date("1990-01-01"),
          is_active: true,
          is_waitlist: false,
          primary_clinician_id: testClinicianId,
        },
      });

      // Create clinician-client relationship
      await prisma.clinicianClient.create({
        data: {
          clinician_id: testClinicianId,
          client_id: testClient.id,
        },
      });

      const testRequest = await prisma.appointmentRequests.create({
        data: {
          id: generateUUID(),
          clinician_id: testClinicianId,
          client_id: testClient.id,
          service_id: testService.id,
          status: "pending",
          start_time: new Date("2024-01-15T10:00:00Z"),
          end_time: new Date("2024-01-15T11:00:00Z"),
          received_date: new Date("2024-01-10T09:00:00Z"),
        },
      });

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);

      const request = json[0];
      expect(request).toHaveProperty("id", testRequest.id);
      expect(request.client).toHaveProperty("name", "John Doe");
      expect(request.client).toHaveProperty("type", "Active");
      expect(request.client).toHaveProperty("clientId", testClient.id);
      expect(request.appointmentDetails).toHaveProperty(
        "serviceName",
        "Individual Therapy",
      );
      expect(request.appointmentDetails).toHaveProperty("duration", 60);
      expect(request).toHaveProperty("status", "pending");
      expect(request).toHaveProperty("isNewClient", false);
    });

    it("should return empty array when no requests exist", async () => {
      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(0);
    });

    it("should return 401 when clinician is not found", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        isClinician: false,
        clinicianId: null,
      });

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });
    });
  });
});
