import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { GET, POST } from "@/api/license/route";
import { UserPrismaFactory } from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";
import { CLINICIAN_ROLE } from "@/utils/constants";
import * as helpers from "@/utils/helpers";

// Mock next-auth and helpers
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/utils/helpers", async () => {
  const actual = await vi.importActual("@/utils/helpers");
  return {
    ...actual,
    getClinicianInfo: vi.fn(),
  };
});

async function cleanupTestData(userId: string, clinicianId: string) {
  await prisma.license.deleteMany({
    where: { clinician_id: clinicianId },
  });

  // Ensure all licenses are deleted before deleting clinician
  const remainingLicenses = await prisma.license.findMany({
    where: { clinician_id: clinicianId },
  });
  if (remainingLicenses.length > 0) {
    throw new Error("Not all licenses deleted before deleting clinician");
  }

  await prisma.clinician.deleteMany({ where: { id: clinicianId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("License API Integration Tests", () => {
  let userId: string;
  let clinicianId: string;

  beforeAll(async () => {
    // First create a user
    const user = await UserPrismaFactory.create();
    userId = user.id;

    // Then create a clinician with proper connection to the user
    const clinician = await prisma.clinician.create({
      data: {
        user_id: userId,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test St",
        percentage_split: 100,
        is_active: true,
      },
    });
    clinicianId = clinician.id;
  });

  afterAll(async () => {
    await cleanupTestData(userId, clinicianId);
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: userId,
        roles: [CLINICIAN_ROLE],
      },
    });
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
      clinician: {
        id: clinicianId,
        first_name: "Test",
        last_name: "Clinician",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/license should return licenses for a user", async () => {
    const license = await prisma.license.create({
      data: {
        clinician_id: clinicianId,
        license_type: "MD",
        license_number: "123456",
        expiration_date: new Date("2030-01-01"),
        state: "CA",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual([
      expect.objectContaining({
        id: license.id,
        license_type: license.license_type,
        license_number: license.license_number,
        expiration_date: license.expiration_date.toISOString(),
        state: license.state,
      }),
    ]);
  });

  it("GET /api/license should return 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET /api/license should return 404 if clinician not found", async () => {
    const user = await UserPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: user.id,
        roles: [], // No CLINICIAN_ROLE
      },
    });
    vi.mocked(helpers.getClinicianInfo).mockResolvedValueOnce({
      isClinician: false,
      clinicianId: null,
      clinician: null,
    });

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("POST /api/license should create licenses", async () => {
    const payload = [
      {
        license_type: "RN",
        license_number: "RN123456",
        expiration_date: "2031-12-31",
        state: "NY",
      },
    ];

    const request = createRequestWithBody(
      "/api/license",
      payload as unknown as Record<string, unknown>,
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.length).toBe(1);
    expect(json[0]).toMatchObject({
      license_type: "RN",
      license_number: "RN123456",
      state: "NY",
    });
  });

  it("POST /api/license should return 422 for invalid payload", async () => {
    const request = createRequestWithBody("/api/license", { not: "an array" });
    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it("POST /api/license should return 404 if clinician not found", async () => {
    const user = await UserPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: user.id,
        roles: [], // No CLINICIAN_ROLE
      },
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
  });

  it("POST /api/license should return 401 if not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/license",
      [] as unknown as Record<string, unknown>,
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("POST /api/license should return 500 on database error", async () => {
    vi.spyOn(prisma.license, "create").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const request = createRequestWithBody("/api/license", [
      {
        license_type: "MD",
        license_number: "123456",
        expiration_date: "2030-01-01",
        state: "CA",
      },
    ] as unknown as Record<string, unknown>);

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
