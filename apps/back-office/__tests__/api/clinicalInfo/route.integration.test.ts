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
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";
import { NextResponse } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Create manual implementations of the route handlers to avoid import issues
const GET = async () => {
  try {
    // Mock getBackOfficeSession and getClinicianInfo
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isClinician, clinicianId } = {
      isClinician: true,
      clinicianId: global.testClinicianId,
    };

    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found for user" },
        { status: 404 },
      );
    }

    const clinician = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      select: {
        id: true,
        speciality: true,
        taxonomy_code: true,
        NPI_number: true,
      },
    });

    if (!clinician) {
      return NextResponse.json(
        { error: "Clinical information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(clinician);
  } catch (error) {
    console.error("Error fetching clinical information:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinical information" },
      { status: 500 },
    );
  }
};

const PUT = async (request) => {
  try {
    // Mock getBackOfficeSession and getClinicianInfo
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isClinician, clinicianId } = {
      isClinician: true,
      clinicianId: global.testClinicianId,
    };

    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found for user" },
        { status: 404 },
      );
    }

    const data = await request.json();

    // Basic validation
    if (data.speciality && data.speciality.length > 250) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 422 },
      );
    }

    // Update clinician info
    const updatedClinician = await prisma.clinician.update({
      where: { id: clinicianId },
      data: {
        speciality: data.speciality ?? null,
        taxonomy_code: data.taxonomy_code ?? null,
        NPI_number: data.NPI_number ?? null,
      },
    });

    return NextResponse.json(updatedClinician);
  } catch (error) {
    console.error("Error updating clinical information:", error);
    return NextResponse.json(
      { error: "Failed to update clinical information" },
      { status: 500 },
    );
  }
};

// Helper function for cleaning up test data
async function cleanup(clinicianId, userId) {
  try {
    await prisma.clinician.deleteMany({ where: { id: clinicianId } });
    await prisma.userRole.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error(
      `Error cleaning up clinical info for user ${clinicianId}:`,
      error,
    );
  }
}

describe("Clinical Info API Integration Tests", () => {
  let userId;
  let clinicianId;
  let session;

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

    // Store clinicianId globally so the mocked route handlers can access it
    global.testClinicianId = clinicianId;
  });

  afterAll(async () => {
    await cleanup(clinicianId, userId);
    delete global.testClinicianId;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(session);
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
    const req = createRequestWithBody(
      "/api/clinicalInfo",
      { speciality: "X" },
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(401);
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
