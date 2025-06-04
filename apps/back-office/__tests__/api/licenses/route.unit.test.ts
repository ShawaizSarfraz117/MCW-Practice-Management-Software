// 🔁 Mock Prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    license: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    clinicalInfo: {
      findFirst: vi.fn(),
    },
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/api/license/route"; // Adjust the import path as necessary
import { prisma } from "@mcw/database";
import { createRequestWithBody } from "@mcw/utils";
import * as helpers from "@/utils/helpers";
import { CLINICIAN_ROLE } from "@/utils/constants";
// import { NextRequest } from "next/server";

// 🔁 Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock getClinicianInfo and getBackOfficeSession
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  getClinicianInfo: vi.fn(),
}));

const mockClinicianId = "mock-clinician-id";

describe("GET /api/licenses", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      roles: [CLINICIAN_ROLE],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // expires in 24 hours
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  it("should return licenses", async () => {
    const mockLicenses = [
      {
        id: 1,
        clinician_id: mockClinicianId,
        license_type: "Medical",
        license_number: "1234567890",
        expiration_date: new Date("2025-12-31"),
        state: "Active",
      },
    ];
    (
      prisma.license.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(mockLicenses);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual([
      {
        id: 1,
        clinician_id: mockClinicianId,
        license_type: "Medical",
        license_number: "1234567890",
        expiration_date: "2025-12-31T00:00:00.000Z", // ISO format check
        state: "Active",
      },
    ]);
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 if clinician not found", async () => {
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce({
      user: {
        id: "test-user-id",
        roles: [], // No CLINICIAN_ROLE
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const response = await GET();

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Clinician not found for user" });
  });

  it("should return 404 if licenses are not found", async () => {
    const mockFindMany = prisma.license.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockResolvedValueOnce([]);

    const response = await GET();

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Licenses not found" });
  });

  it("should handle database errors", async () => {
    const mockFindMany = prisma.license.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch licenses",
    });
  });
});

describe("POST /api/licenses", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      roles: [CLINICIAN_ROLE],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  const createData = [
    {
      license_type: "Dental",
      license_number: "9876543210",
      expiration_date: "2025-12-31",
      state: "Pending",
    },
    {
      license_type: "Dental",
      license_number: "9876543210",
      expiration_date: "2025-12-31",
      state: "Pending",
    },
  ];

  it("should create new licenses", async () => {
    const mockCreate = prisma.license.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockResolvedValueOnce({
      id: 1,
      clinician_id: mockClinicianId,
      ...createData[0],
    });
    mockCreate.mockResolvedValueOnce({
      id: 2,
      clinician_id: mockClinicianId,
      ...createData[1],
    });

    const request = createRequestWithBody(
      "/api/license",
      createData as unknown as Record<string, unknown>,
    );

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify response data
    const responseData = await response.json();
    expect(responseData).toHaveLength(2);
    expect(responseData[0]).toMatchObject({
      id: 1,
      clinician_id: mockClinicianId,
      license_type: createData[0].license_type,
      license_number: createData[0].license_number,
    });
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/license",
      {} as unknown as Record<string, unknown>,
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 if clinician not found", async () => {
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce({
      user: {
        id: "test-user-id",
        roles: [], // No CLINICIAN_ROLE
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const request = createRequestWithBody("/api/license", [
      {
        license_type: "NP",
        license_number: "NP123",
        expiration_date: "2032-01-01",
        state: "TX",
      },
    ] as unknown as Record<string, unknown>);

    const response = await POST(request);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Clinician not found for user" });
  });

  it("should return 422 for invalid payload", async () => {
    const request = createRequestWithBody("/api/license", {
      not: "an array",
    } as unknown as Record<string, unknown>);
    const response = await POST(request);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBe(
      "Invalid request payload: expected an array of licenses",
    );
  });

  it("should return 500 on database error", async () => {
    const mockCreate = prisma.license.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockRejectedValueOnce(new Error("DB error"));

    const request = createRequestWithBody("/api/license", [
      {
        license_type: "Medical",
        license_number: "1234567890",
        expiration_date: "2025-12-31",
        state: "Active",
      },
    ] as unknown as Record<string, unknown>);

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to create licenses" });
  });
});
