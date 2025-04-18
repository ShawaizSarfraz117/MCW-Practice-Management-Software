// 🔁 Mock Prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    clinicalInfo: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/clinicalInfo/route"; // Adjust the import path as necessary
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// 🔁 Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// describe("GET /api/clinicalInfo", () => {
//   const mockSession = {
//     user: {
//       id: "test-user-id",
//     },
//   };

//   beforeEach(() => {
//     vi.resetAllMocks();
//     vi.mocked(getServerSession).mockResolvedValue(mockSession);
//   });

//   it("should return clinical information", async () => {
//     const mockClinicalInfo = {
//       user_id: mockSession.user.id,
//       speciality: "Behavioral health therapy",
//       taxonomy_code: "101YM0800X",
//       NPI_number: 1234567890,
//     };

//     const mockFindFirst = prisma.clinicalInfo
//       .findFirst as unknown as ReturnType<typeof vi.fn>;
//     mockFindFirst.mockResolvedValueOnce(mockClinicalInfo);
//     const response = await GET();

//     expect(response.status).toBe(200);
//     const json = await response.json();
//     expect(json).toMatchObject(mockClinicalInfo);
//   });

//   it("should return 401 if session is invalid", async () => {
//     vi.mocked(getServerSession).mockResolvedValueOnce(null);

//     const response = await GET();

//     expect(response.status).toBe(401);
//   });

//   it("should return 404 if clinical information is not found", async () => {
//     const mockFindFirst = prisma.clinicalInfo
//       .findFirst as unknown as ReturnType<typeof vi.fn>;
//     mockFindFirst.mockResolvedValueOnce(null);

//     const response = await GET();

//     expect(response.status).toBe(404);
//     const json = await response.json();
//     expect(json).toEqual({ error: "Clinical information not found" });
//   });

//   it("should handle database errors", async () => {
//     const mockFindFirst = prisma.clinicalInfo
//       .findFirst as unknown as ReturnType<typeof vi.fn>;
//     mockFindFirst.mockRejectedValueOnce(new Error("Database error"));

//     const response = await GET();

//     expect(response.status).toBe(500);
//     expect(await response.json()).toEqual({
//       error: "Failed to fetch clinical information",
//     });
//   });
// });

describe("PUT /api/clinicalInfo", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  const updateData = {
    speciality: "Speciality 5",
    taxonomyCode: "101YM0800X",
    NPInumber: 123456767,
  };

  const createResponseMock = {
    id: 1,
    user_id: "mock-user-id",
    speciality: updateData.speciality,
    taxonomy_code: updateData.taxonomyCode,
    NPI_number: updateData.NPInumber,
  };
  it("should update clinical information when record exists", async () => {
    // Mock findFirst to simulate existing record
    const mockFind = prisma.clinicalInfo.findFirst as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFind.mockResolvedValueOnce({
      id: "existing-id",
      user_id: "mock-user-id",
    });

    // Mock updateMany to simulate update
    const mockUpdate = prisma.clinicalInfo.updateMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockResolvedValueOnce({ count: 1 });

    const request = new NextRequest(
      new URL("http://localhost/api/clinicalInfo"),
      {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PUT(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({ count: 1 });
  });

  it("should create clinical information when record does not exist", async () => {
    // Mock findFirst to simulate no existing record
    const mockFind = prisma.clinicalInfo.findFirst as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFind.mockResolvedValueOnce(null);

    // Mock create to simulate insertion
    const mockCreate = prisma.clinicalInfo.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockResolvedValueOnce(createResponseMock);

    const request = new NextRequest(
      new URL("http://localhost/api/clinicalInfo"),
      {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PUT(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject(createResponseMock);
  });

  it("should insert new clinical information if it does not exist", async () => {
    const updateData = {
      speciality: "Behavioral health therapy",
      taxonomyCode: "101YM0800X",
      NPInumber: 1234567890,
    };

    const mockCreate = prisma.clinicalInfo.create as unknown as ReturnType<
      typeof vi.fn
    >;
    mockCreate.mockResolvedValueOnce({
      user_id: mockSession.user.id,
      ...updateData,
    });

    const request = new NextRequest(
      new URL("http://localhost/api/clinicalInfo"),
      {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      user_id: mockSession.user.id,
      ...updateData,
    });
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new NextRequest(
      new URL("http://localhost/api/clinicalInfo"),
      {
        method: "PUT",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should return 500 on database error", async () => {
    const mockUpdate = prisma.clinicalInfo.updateMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest(
      new URL("http://localhost/api/clinicalInfo"),
      {
        method: "PUT",
        body: JSON.stringify({
          speciality: "Behavioral health therapy",
          taxonomyCode: "101YM0800X",
          NPInumber: 1234567890,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PUT(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to update clinical information",
    });
  });
});
