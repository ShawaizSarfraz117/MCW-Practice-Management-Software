import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/api/billingAddress/route";
import prismaMock from "@mcw/database/mock";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("GET /api/billingAddress", () => {
  const mockUserId = "test-user-id";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: mockUserId,
      },
    } as ReturnType<typeof getBackOfficeSession>);
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

    const mockFindMany = prismaMock.billingAddress
      .findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValueOnce(mockAddresses);

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ billingAddresses: mockAddresses });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clinician_id: null },
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

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized",
    });
  });

  it("should handle database errors", async () => {
    const mockFindMany = prismaMock.billingAddress
      .findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", {});
    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("Database error");
    expect(json.error.issueId).toMatch(/^ERR-/);
  });
});

describe("POST /api/billingAddress", () => {
  const mockUserId = "test-user-id";
  const validData = {
    street: "789 New St",
    city: "New City",
    state: "NC",
    zip: "12345",
    type: "business",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: mockUserId,
      },
    } as ReturnType<typeof getBackOfficeSession>);
  });

  it("should create new billing address successfully", async () => {
    const mockAddress = {
      id: "new-address-id",
      ...validData,
      clinician_id: null,
    };

    const mockFindFirst = prismaMock.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const mockCreate = prismaMock.billingAddress
      .create as unknown as ReturnType<typeof vi.fn>;
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
        clinician_id: null,
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
      clinician_id: null,
    };

    const updatedAddress = {
      ...existingAddress,
      ...validData,
    };

    const mockFindFirstUpdate = prismaMock.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirstUpdate.mockResolvedValueOnce(existingAddress);

    const mockUpdateAddress = prismaMock.billingAddress
      .update as unknown as ReturnType<typeof vi.fn>;
    mockUpdateAddress.mockResolvedValueOnce(updatedAddress);

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      billingAddress: updatedAddress,
      message: "Existing business billing address was updated",
    });

    expect(mockUpdateAddress).toHaveBeenCalledWith({
      where: {
        id: existingAddress.id,
      },
      data: {
        street: validData.street,
        city: validData.city,
        state: validData.state,
        zip: validData.zip,
      },
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized",
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
    const mockFindFirst = prismaMock.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const mockCreate = prismaMock.billingAddress
      .create as unknown as ReturnType<typeof vi.fn>;
    mockCreate.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("Database error");
    expect(json.error.issueId).toMatch(/^ERR-/);
  });

  it("should handle database errors during update", async () => {
    const existingAddress = {
      id: "existing-id",
      type: "business",
      clinician_id: null,
    };

    const mockFindFirstUpdateError = prismaMock.billingAddress
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirstUpdateError.mockResolvedValueOnce(existingAddress);

    const mockUpdateError = prismaMock.billingAddress
      .update as unknown as ReturnType<typeof vi.fn>;
    mockUpdateError.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody("/api/billingAddress", validData);
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("Database error");
    expect(json.error.issueId).toMatch(/^ERR-/);
  });
});
