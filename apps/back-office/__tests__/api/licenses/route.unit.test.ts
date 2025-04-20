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
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// 🔁 Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("GET /api/licenses", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.clinicalInfo.findFirst).mockResolvedValueOnce({
      id: 1,
      user_id: mockSession.user.id,
      speciality: "Medical",
      taxonomy_code: "1234567890",
      NPI_number: 1234567890,
    });
  });

  it("should return licenses", async () => {
    const mockLicenses = [
      {
        id: 1,
        clinical_info_id: 1,
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
    console.log(response);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual([
      {
        id: 1,
        clinical_info_id: 1,
        license_type: "Medical",
        license_number: "1234567890",
        expiration_date: "2025-12-31T00:00:00.000Z", // ISO format check
        state: "Active",
      },
    ]);
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("should return 404 if licenses are not found", async () => {
    const mockFindMany = prisma.license.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockResolvedValueOnce([]);

    const response = await GET();

    expect(response.status).toBe(404);
    const json = await response.json();
    console.log(json);
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
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.clinicalInfo.findFirst).mockResolvedValueOnce({
      id: 1,
      user_id: mockSession.user.id,
      speciality: "Medical",
      taxonomy_code: "1234567890",
      NPI_number: 1234567890,
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

  it("should create a new license", async () => {
    const mockCreate = prisma.license.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockResolvedValueOnce({
      id: 1,
      clinical_info_id: 1,
      ...createData[0],
    });
    mockCreate.mockResolvedValueOnce({
      id: 2,
      clinical_info_id: 1,
      ...createData[1],
    });

    const request = new NextRequest(new URL("http://localhost/api/licenses"), {
      method: "POST",
      body: JSON.stringify(createData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify response data
    const responseData = await response.json();
    expect(responseData).toHaveLength(2);
    expect(responseData[0]).toMatchObject({
      id: 1,
      clinical_info_id: 1,
      license_type: createData[0].license_type,
      license_number: createData[0].license_number,
    });
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new NextRequest(new URL("http://localhost/api/licenses"), {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 500 on database error", async () => {
    const mockCreate = prisma.license.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest(new URL("http://localhost/api/licenses"), {
      method: "POST",
      body: JSON.stringify([
        {
          license_type: "Medical",
          license_number: "1234567890",
          expiration_date: "2025-12-31",
          state: "Active",
        },
      ]),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
  it("should return 422 for invalid license data", async () => {
    const request = new NextRequest(new URL("http://localhost/api/licenses"), {
      method: "POST",
      // Invalid data: empty array
      body: JSON.stringify([]),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBe(
      "Invalid request payload: expected an array of licenses",
    );
  });
});
