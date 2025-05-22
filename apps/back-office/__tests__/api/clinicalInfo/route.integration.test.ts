import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
import { prisma } from "@mcw/database";
import { GET, PUT } from "@/api/clinicalInfo/route";
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock getClinicianInfo
vi.mock("@/utils/helpers", async () => {
  const actual = await vi.importActual("@/utils/helpers");
  return {
    ...actual,
    getClinicianInfo: vi.fn(),
    getBackOfficeSession: vi.fn(),
  };
});
import * as helpers from "@/utils/helpers";

// Helper function for cleaning up test data
async function cleanup(clinicianId: string, userId: string) {
  try {
    // Ensure related data (like Licenses) is deleted first if needed
    // Example: await prisma.license.deleteMany({ where: { clinical_info: { user_id: clinicianId } } });
    await prisma.clinician.deleteMany({ where: { id: clinicianId } });
    await prisma.userRole.deleteMany({ where: { user_id: clinicianId } }); // Assuming UserRoles might exist
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error(
      `Error cleaning up clinical info for user ${clinicianId}:`,
      error,
    );
  }
}

describe("Clinical Info API Integration Tests", () => {
  let userId: string;
  let clinicianId: string;
  let session: { user: { id: string }; expires: string };

  beforeAll(async () => {
    const user = await UserPrismaFactory.create();
    userId = user.id;
    const clinician = await ClinicianPrismaFactory.create({
      User: { connect: { id: userId } },
      first_name: "Test",
      last_name: "User",
    });
    clinicianId = clinician.id;
    session = {
      user: { id: userId },
      expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    };
  });

  afterAll(async () => {
    // await prisma.clinicalInfo.deleteMany({ where: { user_id: clinicianId } });
    // await prisma.user.deleteMany({ where: { id: clinicianId } });
    await cleanup(clinicianId, userId);
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValue(session);
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
      clinician: { id: clinicianId, first_name: "Test", last_name: "User" },
    });
  });

  afterEach(async () => {
    await prisma.clinician.update({
      where: { id: clinicianId },
      data: { speciality: null, taxonomy_code: null, NPI_number: null },
    });
    vi.restoreAllMocks();
  });

  it("GET /api/clinicalInfo returns clinical info if present", async () => {
    await prisma.clinician.update({
      where: { id: clinicianId },
      data: {
        speciality: "Cardiology",
        taxonomy_code: "208D00000X",
        NPI_number: "1234567890",
      },
    });
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: clinicianId,
      speciality: "Cardiology",
      taxonomy_code: "208D00000X",
      NPI_number: "1234567890",
    });
  });

  it("GET /api/clinicalInfo returns 200 with null fields if not set", async () => {
    await prisma.clinician.update({
      where: { id: clinicianId },
      data: { speciality: null, taxonomy_code: null, NPI_number: null },
    });
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: clinicianId,
      speciality: null,
      taxonomy_code: null,
      NPI_number: null,
    });
  });

  it("GET /api/clinicalInfo returns 401 if unauthorized", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("PUT /api/clinicalInfo updates clinical info", async () => {
    const payload = {
      speciality: "Dermatology",
      taxonomy_code: "207N00000X",
      NPI_number: "9876543210",
    };
    const req = createRequestWithBody("/api/clinicalInfo", payload, {
      method: "PUT",
    });
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject(payload);
    // Confirm in DB
    const db = await prisma.clinician.findUnique({
      where: { id: clinicianId },
    });
    expect(db?.speciality).toBe("Dermatology");
    expect(db?.taxonomy_code).toBe("207N00000X");
    expect(db?.NPI_number).toBe("9876543210");
  });

  it("PUT /api/clinicalInfo returns 401 if unauthorized", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    vi.mocked(helpers.getBackOfficeSession).mockResolvedValueOnce(null);
    const req = createRequestWithBody(
      "/api/clinicalInfo",
      { speciality: "X" },
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(401);
  });

  it("PUT /api/clinicalInfo returns 404 if not a clinician", async () => {
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });
    const req = createRequestWithBody(
      "/api/clinicalInfo",
      { speciality: "X" },
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("PUT /api/clinicalInfo returns 422 for invalid payload", async () => {
    const req = createRequestWithBody(
      "/api/clinicalInfo",
      { speciality: "x".repeat(300) },
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toMatch(/invalid/i);
  });

  it("PUT /api/clinicalInfo returns 500 on DB error", async () => {
    vi.spyOn(prisma.clinician, "update").mockRejectedValueOnce(
      new Error("DB fail"),
    );
    const req = createRequestWithBody(
      "/api/clinicalInfo",
      { speciality: "Pediatrics" },
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toMatch(/failed/i);
  });
});
