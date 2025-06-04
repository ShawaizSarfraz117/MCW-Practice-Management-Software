import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/teleHealth/route";
import prismaMock from "@mcw/database/mock";
import { getClinicianInfo } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";
import { ClinicianFactory, LocationFactory } from "@mcw/database/mock-data";

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
}));

describe("GET /api/teleHealth", () => {
  const mockClinicianId = "test-clinician-id";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: null,
    });
  });

  it("should return telehealth location when it exists", async () => {
    const mockLocation = LocationFactory.build();
    const mockClinician = ClinicianFactory.build({
      id: mockClinicianId,
      first_name: "Test",
      last_name: "Clinician",
      User: {
        email: "test@example.com",
      },
      ClinicianLocation: [
        {
          is_primary: true,
          Location: mockLocation,
        },
      ],
    });

    const mockFindUnique = prismaMock.clinician
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(mockClinician);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      clinician: {
        id: mockClinicianId,
        firstName: mockClinician.first_name,
        lastName: mockClinician.last_name,
        email: mockClinician.User.email,
      },
      location: mockLocation,
    });
  });

  it("should return 403 when user is not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const response = await GET();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not a clinician",
    });
  });

  it("should return 404 when clinician is not found", async () => {
    const mockFindUnique = prismaMock.clinician
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Clinician not found",
    });
  });

  it("should return 404 when no telehealth location exists", async () => {
    const mockClinician = {
      id: mockClinicianId,
      first_name: "Test",
      last_name: "Clinician",
      User: {
        email: "test@example.com",
      },
      ClinicianLocation: [], // No locations
    };

    const mockFindUnique = prismaMock.clinician
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(mockClinician);

    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "TeleHealth location not found",
    });
  });

  it("should handle database errors", async () => {
    const mockFindUnique = prismaMock.clinician
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch telehealth details",
    });
  });
});

describe("PUT /api/teleHealth", () => {
  const mockClinicianId = "test-clinician-id";
  const validUpdateData = {
    locationId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Updated Virtual Office",
    street: "456 Digital Ave",
    city: "Tech City",
    state: "TC",
    zip: "12345-6789",
    color: "#4287f5",
    address: "456 Digital Ave, Tech City, TC 12345-6789",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: null,
    });
  });

  it("should update telehealth location successfully", async () => {
    const mockLocation = {
      id: validUpdateData.locationId,
      ...validUpdateData,
      is_active: true,
    };

    const mockFindUnique = prismaMock.location
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(mockLocation);

    const mockUpdate = prismaMock.location.update as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockResolvedValueOnce(mockLocation);

    const request = createRequestWithBody("/api/teleHealth", validUpdateData);
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      location: mockLocation,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: validUpdateData.locationId },
      data: {
        name: validUpdateData.name,
        address: validUpdateData.address,
        street: validUpdateData.street,
        city: validUpdateData.city,
        state: validUpdateData.state,
        zip: validUpdateData.zip,
        color: validUpdateData.color,
        is_active: true,
      },
    });
  });

  it("should return 403 when user is not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const request = createRequestWithBody("/api/teleHealth", validUpdateData);
    const response = await PUT(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not a clinician",
    });
  });

  it("should return 404 when location does not exist", async () => {
    const mockFindUnique = prismaMock.location
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(null);

    const request = createRequestWithBody("/api/teleHealth", validUpdateData);
    const response = await PUT(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Location not found",
    });
  });

  it("should return 400 for invalid input data", async () => {
    const invalidData = {
      locationId: "invalid-uuid",
      name: "", // Empty name
      street: "", // Empty street
      address: "", // Empty address
      city: "x".repeat(101), // Too long
      state: "XXX", // Invalid state format
      zip: "1234", // Invalid ZIP format
      color: "not-a-color",
    };

    const request = createRequestWithBody("/api/teleHealth", invalidData);
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Incomplete or invalid data");
    expect(json.details).toBeDefined();
  });

  it("should handle database errors", async () => {
    // Use valid data that matches the schema requirements
    const testData = {
      locationId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Location",
      address: "123 Test St, Test City, TC 12345",
      street: "123 Test St",
      city: "Test City",
      state: "TC",
      zip: "12345",
      color: "#000000",
    };

    const request = createRequestWithBody("/api/teleHealth", testData);

    // Mock findUnique to return a location (passes the existence check)
    const mockFindUnique = prismaMock.location
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce({
      id: testData.locationId,
      ...testData,
      is_active: true,
    });

    // Mock update to throw an error
    const mockUpdate = prismaMock.location.update as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockRejectedValueOnce(new Error("Database error"));

    const response = await PUT(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to update telehealth location",
    });

    // Verify our mocks were called in the right order
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: testData.locationId },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: testData.locationId },
      data: {
        name: testData.name,
        address: testData.address,
        street: testData.street,
        city: testData.city,
        state: testData.state,
        zip: testData.zip,
        color: testData.color,
        is_active: true,
      },
    });
  });
});
