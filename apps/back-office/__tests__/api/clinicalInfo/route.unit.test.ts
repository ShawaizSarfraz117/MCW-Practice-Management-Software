import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/clinicalInfo/route";
import { getServerSession } from "next-auth";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import * as helpers from "@/utils/helpers";

// Mock Prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    clinician: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@mcw/database";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  getClinicianInfo: vi.fn(),
}));

const mockClinicianId = "mock-clinician-id";
const mockSession = {
  user: { id: "test-user-id" },
  expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
};

const mockClinician = {
  id: mockClinicianId,
  user_id: mockSession.user.id,
  speciality: "Behavioral health therapy",
  taxonomy_code: "101YM0800X",
  NPI_number: "1234567890",
  is_active: true,
  address: "123 Main St",
  percentage_split: 100,
  first_name: "Test",
  last_name: "User",
};

describe("GET /api/clinicalInfo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  it("should return clinical information", async () => {
    vi.mocked(prisma.clinician.findUnique).mockResolvedValueOnce(mockClinician);

    const response = await GET(createRequest("/api/clinicalInfo"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockClinicianId,
      speciality: "Behavioral health therapy",
      taxonomy_code: "101YM0800X",
      NPI_number: "1234567890",
    });
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

    const response = await GET(createRequest("/api/clinicalInfo"));
    expect(response.status).toBe(401);
  });

  it("should return 404 if clinician is not found", async () => {
    vi.mocked(prisma.clinician.findUnique).mockResolvedValueOnce(null);

    const response = await GET(createRequest("/api/clinicalInfo"));
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Clinical information not found" });
  });

  it("should return 404 if not a clinician", async () => {
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const response = await GET(createRequest("/api/clinicalInfo"));
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Clinician not found for user" });
  });

  it("should handle database errors", async () => {
    vi.mocked(prisma.clinician.findUnique).mockRejectedValueOnce(
      new Error("DB error"),
    );

    const response = await GET(createRequest("/api/clinicalInfo"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch clinical information",
    });
  });
});

describe("PUT /api/clinicalInfo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(mockSession);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  const validData = {
    speciality: "Updated Speciality",
    taxonomy_code: "2022X0000X",
    NPI_number: "9876543210",
  };

  it("should update clinical information", async () => {
    vi.mocked(prisma.clinician.update).mockResolvedValueOnce({
      ...mockClinician,
      ...validData,
    });

    const req = createRequestWithBody("/api/clinicalInfo", validData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject(validData);
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);

    const req = createRequestWithBody("/api/clinicalInfo", validData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(401);
  });

  it("should return 404 if not a clinician", async () => {
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const req = createRequestWithBody("/api/clinicalInfo", validData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: "Clinician not found for user" });
  });

  it("should return 422 for invalid input data", async () => {
    const invalidData = {
      speciality: "x".repeat(300), // Exceeds max length
      taxonomy_code: "",
      NPI_number: "",
    };

    const req = createRequestWithBody("/api/clinicalInfo", invalidData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it("should return 500 on database error", async () => {
    vi.mocked(prisma.clinician.update).mockRejectedValueOnce(
      new Error("DB error"),
    );

    const req = createRequestWithBody("/api/clinicalInfo", validData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to update clinical information",
    });
  });
});
