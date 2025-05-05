import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { GET, PUT } from "@/api/teleHealth/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";
import {
  ClinicianFactory,
  LocationFactory,
  UserFactory,
} from "@mcw/database/mock-data";
// Create mock user and clinician data
const mockUser = UserFactory.build();
const mockClinician = ClinicianFactory.build({ user_id: mockUser.id });

// Mock helpers
vi.mock("@/utils/helpers");

describe("TeleHealth API Integration Tests", () => {
  beforeAll(async () => {
    // Create test user and clinician in database
    await prisma.user.create({
      data: mockUser,
    });
    await prisma.clinician.create({
      data: mockClinician,
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.clinicianLocation.deleteMany();
    await prisma.location.deleteMany();
    await prisma.clinician.deleteMany({
      where: { id: mockClinician.id },
    });
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
  });

  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinician.id,
    });

    // Clean up any existing test data in correct order
    await prisma.clinicianLocation.deleteMany();
    await prisma.location.deleteMany();
  });

  describe("GET /api/teleHealth", () => {
    it("should return 404 when no telehealth location exists", async () => {
      const response = await GET();
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "TeleHealth location not found",
      });
    });

    it("should return 403 when user is not a clinician", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });

      const response = await GET();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "User is not a clinician",
      });
    });

    it("should return telehealth location when it exists", async () => {
      const teleHealthInfo = {
        name: "Virtual Office",
        street: "123 Virtual St",
        city: "Digital City",
        state: "DC",
        zip: "12345",
        color: "#FF5733",
        address: "123 Virtual St, Digital City, DC 12345",
        is_active: true,
      };

      const location = await prisma.location.create({
        data: teleHealthInfo,
      });

      await prisma.clinicianLocation.create({
        data: {
          clinician_id: mockClinician.id,
          location_id: location.id,
          is_primary: true,
        },
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.location).toMatchObject({
        name: teleHealthInfo.name,
        street: teleHealthInfo.street,
        city: teleHealthInfo.city,
        state: teleHealthInfo.state,
        zip: teleHealthInfo.zip,
        color: teleHealthInfo.color,
        address: teleHealthInfo.address,
      });
    });
  });

  describe("PUT /api/teleHealth", () => {
    const validData = LocationFactory.build();

    it("should return 403 when user is not a clinician", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });

      const request = createRequestWithBody("/api/teleHealth", validData);
      const response = await PUT(request);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "User is not a clinician",
      });
    });

    it("should return 404 when updating non-existent location", async () => {
      const request = createRequestWithBody("/api/teleHealth", {
        ...validData,
        locationId: validData.id,
      });
      const response = await PUT(request);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Location not found",
      });
    });

    it("should update existing telehealth location", async () => {
      // First create initial record
      const initialData = {
        name: "Initial Virtual Office",
        street: "789 Initial St",
        city: "Start City",
        state: "SC",
        zip: "12345-6789",
        color: "#000000",
        address: "789 Initial St, Start City, SC 12345-6789",
        is_active: true,
      };

      const createdLocation = await prisma.location.create({
        data: initialData,
      });

      await prisma.clinicianLocation.create({
        data: {
          clinician_id: mockClinician.id,
          location_id: createdLocation.id,
          is_primary: true,
        },
      });

      // Then update it
      const updateData = {
        ...validData,
        locationId: createdLocation.id,
      };

      const request = createRequestWithBody("/api/teleHealth", updateData);
      const response = await PUT(request);
      expect(response.status).toBe(200);

      // Verify in database
      const dbRecord = await prisma.location.findFirst({
        where: { id: createdLocation.id },
        include: {
          ClinicianLocation: true,
        },
      });
      expect(dbRecord).toBeTruthy();
      expect(dbRecord?.name).toBe(updateData.name);
      expect(dbRecord?.street).toBe(updateData.street);
      expect(dbRecord?.color).toBe(updateData.color);
      expect(dbRecord?.ClinicianLocation[0].clinician_id).toBe(
        mockClinician.id,
      );
    });

    it("should validate input data", async () => {
      const invalidData = {
        locationId: "invalid-id",
        name: "", // Empty name
        street: "x".repeat(101), // Exceeds max length
        city: "", // Empty city
        state: "XXX", // Invalid state format
        zip: "1234", // Invalid ZIP format
        color: "",
        address: "",
      };

      const request = createRequestWithBody("/api/teleHealth", invalidData);
      const response = await PUT(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Incomplete or invalid data",
        details: expect.any(Array),
      });

      // Verify nothing was created in database
      const dbRecord = await prisma.location.findFirst({
        include: {
          ClinicianLocation: {
            where: { clinician_id: mockClinician.id },
          },
        },
      });
      expect(dbRecord).toBeNull();
    });
  });
});
