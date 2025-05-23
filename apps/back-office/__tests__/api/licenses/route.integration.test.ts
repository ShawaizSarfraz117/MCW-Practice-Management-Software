import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@mcw/database";
import { GET, POST, PUT } from "@/api/license/route";
import { createRequestWithBody } from "@mcw/utils";
import { CLINICIAN_ROLE } from "@/utils/constants";
import * as helpers from "@/utils/helpers";
import type { License } from "@prisma/client";

// Mock the auth helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  getClinicianInfo: vi.fn(),
}));

describe("License API Routes Integration Tests", () => {
  // Test data and state - use proper UUID format
  const mockUserId = "11111111-1111-1111-1111-111111111111";
  const mockClinicianId = "22222222-2222-2222-2222-222222222222";
  let createdLicenseIds: string[] = [];
  const createdEntities = {
    user: false,
    clinician: false,
  };

  const mockSession = {
    user: {
      id: mockUserId,
      roles: [CLINICIAN_ROLE],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Set up authentication mocks and test data before tests
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: {
        id: mockClinicianId,
        first_name: "Test",
        last_name: "Clinician",
      },
    });

    // Create test user and clinician for foreign key constraints
    try {
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: "test.user@example.com",
          password_hash: "hashed_password",
        },
      });
      createdEntities.user = true;

      await prisma.clinician.create({
        data: {
          id: mockClinicianId,
          user_id: mockUserId,
          first_name: "Test",
          last_name: "Clinician",
          address: "123 Test St",
          percentage_split: 100,
        },
      });
      createdEntities.clinician = true;
    } catch (error) {
      // If the user/clinician already exists, we can continue
      console.log("Setup error (can be ignored if entities exist):", error);
    }
  });

  // Clean up after each test
  afterEach(async () => {
    // Delete created licenses
    if (createdLicenseIds.length > 0) {
      try {
        await prisma.license.deleteMany({
          where: {
            id: {
              in: createdLicenseIds,
            },
          },
        });
      } catch (error) {
        console.log("Error cleaning up licenses:", error);
      }
      createdLicenseIds = [];
    }
  });

  // Final cleanup after all tests
  afterEach(async () => {
    // Clean up in reverse order of creation (respect foreign key constraints)
    if (createdEntities.clinician) {
      try {
        await prisma.clinician.delete({
          where: {
            id: mockClinicianId,
          },
        });
      } catch (error) {
        console.log("Error cleaning up clinician:", error);
      }
      createdEntities.clinician = false;
    }

    if (createdEntities.user) {
      try {
        await prisma.user.delete({
          where: {
            id: mockUserId,
          },
        });
      } catch (error) {
        console.log("Error cleaning up user:", error);
      }
      createdEntities.user = false;
    }
  });

  describe("GET /api/license", () => {
    it("should return licenses for the clinician", async () => {
      // Create test licenses for the clinician
      const license1 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "Medical",
          license_number: "TEST123456",
          expiration_date: new Date("2025-12-31"),
          state: "Active",
        },
      });
      createdLicenseIds.push(license1.id);

      const license2 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "Dental",
          license_number: "DENTAL789",
          expiration_date: new Date("2026-06-30"),
          state: "TX",
        },
      });
      createdLicenseIds.push(license2.id);

      // Call the GET endpoint
      const response = await GET();

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Check that the response contains our test licenses
      expect(json).toHaveLength(2);

      // Find our licenses in the response
      const responseLicense1 = json.find((l: License) => l.id === license1.id);
      const responseLicense2 = json.find((l: License) => l.id === license2.id);

      // Verify license 1 data
      expect(responseLicense1).toBeDefined();
      expect(responseLicense1.license_type).toBe("Medical");
      expect(responseLicense1.license_number).toBe("TEST123456");
      expect(responseLicense1.expiration_date).toBe(
        new Date("2025-12-31").toISOString(),
      );
      expect(responseLicense1.state).toBe("Active");

      // Verify license 2 data
      expect(responseLicense2).toBeDefined();
      expect(responseLicense2.license_type).toBe("Dental");
      expect(responseLicense2.license_number).toBe("DENTAL789");
      expect(responseLicense2.expiration_date).toBe(
        new Date("2026-06-30").toISOString(),
      );
      expect(responseLicense2.state).toBe("TX");
    });

    it("should return 404 when no licenses exist", async () => {
      // Ensure no licenses exist for the clinician
      await prisma.license.deleteMany({
        where: {
          clinician_id: mockClinicianId,
        },
      });

      // Call the GET endpoint
      const response = await GET();

      // Verify response
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Licenses not found" });
    });

    it("should return 401 if not authenticated", async () => {
      // Mock unauthenticated session
      vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

      // Call the GET endpoint
      const response = await GET();

      // Verify response
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 if clinician info not found", async () => {
      // Mock missing clinician info
      vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
        clinician: null,
      });

      // Call the GET endpoint
      const response = await GET();

      // Verify response
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Clinician not found for user" });
    });
  });

  describe("POST /api/license", () => {
    it("should create new licenses", async () => {
      // Prepare license data for creation
      const licenseData = [
        {
          license_type: "Medical",
          license_number: "MED123456",
          expiration_date: "2025-12-31",
          state: "CA",
        },
        {
          license_type: "Nursing",
          license_number: "NURSE789",
          expiration_date: "2026-06-30",
          state: "TX",
        },
      ];

      // Create request with license data
      const request = createRequestWithBody(
        "/api/license",
        licenseData as unknown as Record<string, unknown>,
      );

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Verify created licenses
      expect(json).toHaveLength(2);
      expect(json[0]).toHaveProperty("id");
      expect(json[0]).toHaveProperty("clinician_id", mockClinicianId);
      expect(json[0]).toHaveProperty("license_type", "Medical");
      expect(json[0]).toHaveProperty("license_number", "MED123456");
      expect(json[0]).toHaveProperty("state", "CA");

      expect(json[1]).toHaveProperty("id");
      expect(json[1]).toHaveProperty("clinician_id", mockClinicianId);
      expect(json[1]).toHaveProperty("license_type", "Nursing");
      expect(json[1]).toHaveProperty("license_number", "NURSE789");
      expect(json[1]).toHaveProperty("state", "TX");

      // Store created license IDs for cleanup
      createdLicenseIds.push(json[0].id, json[1].id);

      // Verify licenses were stored in database
      const storedLicenses = await prisma.license.findMany({
        where: {
          id: {
            in: createdLicenseIds,
          },
        },
      });
      expect(storedLicenses).toHaveLength(2);
    });

    it("should handle date strings properly", async () => {
      // Prepare license data with date as string
      const licenseData = [
        {
          license_type: "Medical",
          license_number: "DATE123",
          expiration_date: "2025-12-31T00:00:00.000Z", // ISO format
          state: "CA",
        },
      ];

      // Create request with license data
      const request = createRequestWithBody(
        "/api/license",
        licenseData as unknown as Record<string, unknown>,
      );

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Store created license ID for cleanup
      createdLicenseIds.push(json[0].id);

      // Verify license was stored with correct date
      const storedLicense = await prisma.license.findUnique({
        where: {
          id: json[0].id,
        },
      });

      expect(storedLicense).toBeDefined();
      expect(storedLicense?.expiration_date.toISOString()).toBe(
        "2025-12-31T00:00:00.000Z",
      );
    });

    it("should return 401 if not authenticated", async () => {
      // Mock unauthenticated session
      vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

      // Create request with license data
      const request = createRequestWithBody("/api/license", [
        { license_type: "Test" },
      ] as unknown as Record<string, unknown>);

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 if clinician info not found", async () => {
      // Mock missing clinician info
      vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
        clinician: null,
      });

      // Create request with license data
      const request = createRequestWithBody("/api/license", [
        { license_type: "Test" },
      ] as unknown as Record<string, unknown>);

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Clinician not found for user" });
    });

    it("should return 422 for empty array payload", async () => {
      // Create request with empty array
      const request = createRequestWithBody(
        "/api/license",
        [] as unknown as Record<string, unknown>,
      );

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.error).toBe(
        "Invalid request payload: expected an array of licenses",
      );
    });

    it("should return 422 for non-array payload", async () => {
      // Create request with non-array data
      const request = createRequestWithBody("/api/license", {
        license_type: "Test",
      });

      // Call the POST endpoint
      const response = await POST(request);

      // Verify response
      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.error).toBe(
        "Invalid request payload: expected an array of licenses",
      );
    });
  });

  describe("PUT /api/license", () => {
    it("should update existing licenses", async () => {
      // Create licenses for updating
      const license1 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "Medical",
          license_number: "MED123",
          expiration_date: new Date("2025-01-01"),
          state: "CA",
        },
      });
      createdLicenseIds.push(license1.id);

      const license2 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "Dental",
          license_number: "DENT456",
          expiration_date: new Date("2025-02-01"),
          state: "NY",
        },
      });
      createdLicenseIds.push(license2.id);

      // Prepare update data
      const updateData = {
        licenses: [
          {
            id: license1.id,
            license_type: "Medical Updated",
            license_number: "MED123-UPD",
            expiration_date: "2026-01-01",
            state: "TX",
          },
          {
            id: license2.id,
            license_type: "Dental Updated",
            license_number: "DENT456-UPD",
            expiration_date: "2026-02-01",
            state: "FL",
          },
        ],
      };

      // Create request with update data
      const request = createRequestWithBody("/api/license", updateData, {
        method: "PUT",
      });

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Verify updated licenses in response
      expect(json.updated).toHaveLength(2);

      // Find our updated licenses in the response
      const responseUpdatedLicense1 = json.updated.find(
        (l: License) => l.id === license1.id,
      );
      const responseUpdatedLicense2 = json.updated.find(
        (l: License) => l.id === license2.id,
      );

      // Verify license 1 updates
      expect(responseUpdatedLicense1).toBeDefined();
      expect(responseUpdatedLicense1.license_type).toBe("Medical Updated");
      expect(responseUpdatedLicense1.license_number).toBe("MED123-UPD");
      expect(responseUpdatedLicense1.state).toBe("TX");

      // Verify license 2 updates
      expect(responseUpdatedLicense2).toBeDefined();
      expect(responseUpdatedLicense2.license_type).toBe("Dental Updated");
      expect(responseUpdatedLicense2.license_number).toBe("DENT456-UPD");
      expect(responseUpdatedLicense2.state).toBe("FL");

      // Verify licenses were updated in database
      const updatedLicense1 = await prisma.license.findUnique({
        where: { id: license1.id },
      });
      expect(updatedLicense1).toBeDefined();
      expect(updatedLicense1?.license_type).toBe("Medical Updated");
      expect(updatedLicense1?.license_number).toBe("MED123-UPD");
      expect(updatedLicense1?.state).toBe("TX");

      const updatedLicense2 = await prisma.license.findUnique({
        where: { id: license2.id },
      });
      expect(updatedLicense2).toBeDefined();
      expect(updatedLicense2?.license_type).toBe("Dental Updated");
      expect(updatedLicense2?.license_number).toBe("DENT456-UPD");
      expect(updatedLicense2?.state).toBe("FL");
    });

    it("should create new licenses when provided without IDs", async () => {
      // Prepare update data with a new license
      const updateData = {
        licenses: [
          {
            license_type: "New License Type",
            license_number: "NEW123",
            expiration_date: "2026-03-01",
            state: "WA",
          },
        ],
      };

      // Create request with update data
      const request = createRequestWithBody("/api/license", updateData, {
        method: "PUT",
      });

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Verify a new license was created
      expect(json.updated).toHaveLength(1);
      expect(json.updated[0]).toHaveProperty("id");
      expect(json.updated[0]).toHaveProperty("clinician_id", mockClinicianId);
      expect(json.updated[0]).toHaveProperty(
        "license_type",
        "New License Type",
      );
      expect(json.updated[0]).toHaveProperty("license_number", "NEW123");
      expect(json.updated[0]).toHaveProperty("state", "WA");

      // Store created license ID for cleanup
      createdLicenseIds.push(json.updated[0].id);

      // Verify license was stored in database
      const storedLicense = await prisma.license.findUnique({
        where: { id: json.updated[0].id },
      });
      expect(storedLicense).toBeDefined();
      expect(storedLicense?.license_type).toBe("New License Type");
    });

    it("should delete licenses not included in update", async () => {
      // Create licenses for testing deletion
      const license1 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "To Keep",
          license_number: "KEEP123",
          expiration_date: new Date("2025-01-01"),
          state: "CA",
        },
      });
      createdLicenseIds.push(license1.id);

      const license2 = await prisma.license.create({
        data: {
          clinician_id: mockClinicianId,
          license_type: "To Delete",
          license_number: "DELETE456",
          expiration_date: new Date("2025-02-01"),
          state: "NY",
        },
      });
      createdLicenseIds.push(license2.id);

      // Prepare update data with only one license
      const updateData = {
        licenses: [
          {
            id: license1.id,
            license_type: "To Keep",
            license_number: "KEEP123",
            expiration_date: "2025-01-01",
            state: "CA",
          },
        ],
      };

      // Create request with update data
      const request = createRequestWithBody("/api/license", updateData, {
        method: "PUT",
      });

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(200);
      const json = await response.json();

      // Verify deletion information
      expect(json.deleted).not.toBeNull();
      expect(json.deleted.count).toBe(1);
      expect(json.deleted.ids).toContain(license2.id);

      // Verify license was deleted from database
      const deletedLicense = await prisma.license.findUnique({
        where: { id: license2.id },
      });
      expect(deletedLicense).toBeNull();
    });

    it("should return 401 if not authenticated", async () => {
      // Mock unauthenticated session
      vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

      // Create request with update data
      const request = createRequestWithBody(
        "/api/license",
        { licenses: [] },
        { method: "PUT" },
      );

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 if clinician info not found", async () => {
      // Mock missing clinician info
      vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
        clinician: null,
      });

      // Create request with update data
      const request = createRequestWithBody(
        "/api/license",
        { licenses: [] },
        { method: "PUT" },
      );

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ error: "Clinician not found for user" });
    });

    it("should return 400 for missing licenses array", async () => {
      // Create request with invalid data
      const request = createRequestWithBody(
        "/api/license",
        { notLicenses: [] },
        { method: "PUT" },
      );

      // Call the PUT endpoint
      const response = await PUT(request);

      // Verify response
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "licenses array is required" });
    });
  });
});
