import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/api/billingAddress/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";

// Mock database
vi.mock("@mcw/database", () => ({
  prisma: {
    billingAddress: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
}));

describe("GET /api/billingAddress", () => {
  const mockClinicianId = "test-clinician-id";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
    });
  });

  it("should return billing addresses when they exist", async () => {
    const mockAddresses = [
      {
        id: "address-1",
        street: "123 Business St",
        city: "Business City",
        state: "BC",
        zip: "12345",
        type: "business",
      },
      {
        id: "address-2",
        street: "456 Client Ave",
        city: "Client City",
        state: "CC",
        zip: "67890",
        type: "client",
      },
    ];

    const mockFindMany = prisma.billingAddress
      .findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValueOnce(mockAddresses);

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ billingAddresses: mockAddresses });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clinician_id: mockClinicianId },
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        type: true,
      },
    });
  });

  it("should return 403 when user is not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
    });

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not a clinician",
    });
  });

  it("should handle database errors", async () => {
    const mockFindMany = prisma.billingAddress
      .findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch billing addresses",
    });
  });
});

describe("POST /api/billingAddress", () => {
  const mockClinicianId = "test-clinician-id";
  const validData = {
    street: "789 New St",
    city: "New City",
    state: "NC",
    zip: "12345",
    type: "business",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
    });
  });

  it("should create new billing address successfully", async () => {
    const mockAddress = {
      id: "new-address-id",
      ...validData,
      clinician_id: mockClinicianId,
    };

    const mockFindFirst = prisma.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const mockCreate = prisma.billingAddress.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockResolvedValueOnce(mockAddress);

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({
      billingAddress: mockAddress,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        ...validData,
        clinician_id: mockClinicianId,
      },
    });
  });

  it("should update existing billing address of same type", async () => {
    const existingAddress = {
      id: "existing-id",
      street: "Old St",
      city: "Old City",
      state: "OC",
      zip: "11111",
      type: "business",
      clinician_id: mockClinicianId,
    };

    const updatedAddress = {
      ...existingAddress,
      ...validData,
    };

    const mockFindFirst = prisma.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(existingAddress);

    const mockUpdate = prisma.billingAddress.update as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockResolvedValueOnce(updatedAddress);

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      billingAddress: updatedAddress,
      message: "Existing business billing address was updated",
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: {
        id: existingAddress.id,
        type: "business",
      },
      data: {
        street: validData.street,
        city: validData.city,
        state: validData.state,
        zip: validData.zip,
      },
    });
  });

  it("should return 403 when user is not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
    });

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not a clinician",
    });
  });

  it("should return 400 for invalid input data", async () => {
    const invalidData = {
      street: "", // Empty street
      city: "", // Empty city
      state: "", // Empty state
      zip: "123", // Invalid ZIP
      type: "invalid", // Invalid type
    };

    const request = createRequestWithBody("/api/billingAddress", invalidData);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid data");
    expect(json.details).toBeDefined();
  });

  it("should handle database errors during creation", async () => {
    const mockFindFirst = prisma.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const mockCreate = prisma.billingAddress.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create billing address",
    });
  });

  it("should handle database errors during update", async () => {
    const existingAddress = {
      id: "existing-id",
      type: "business",
      clinician_id: mockClinicianId,
    };

    const mockFindFirst = prisma.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(existingAddress);

    const mockUpdate = prisma.billingAddress.update as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create billing address",
    });
  });
});
