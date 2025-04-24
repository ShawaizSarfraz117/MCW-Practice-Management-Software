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
import { GET, PUT } from "@/api/clinicalInfo/route"; // <-- adjust to correct path
import { UserPrismaFactory } from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("Clinical Info API Integration Tests", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await UserPrismaFactory.create();
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.clinicalInfo.deleteMany({ where: { user_id: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId },
    });
  });

  it("GET /api/clinical-info should return clinical info if exists", async () => {
    const clinical = await prisma.clinicalInfo.create({
      data: {
        user_id: userId,
        speciality: "Cardiology",
        taxonomy_code: "208D00000X",
        NPI_number: 1234567890,
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      speciality: clinical.speciality,
      taxonomy_code: clinical.taxonomy_code,
      NPI_number: clinical.NPI_number,
    });
  });

  it("GET /api/clinical-info should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET /api/clinical-info should return 404 if clinical info does not exist", async () => {
    await prisma.clinicalInfo.deleteMany({ where: { user_id: userId } });
    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("PUT /api/clinical-info should create new clinical info if not exists", async () => {
    await prisma.clinicalInfo.deleteMany({ where: { user_id: userId } });

    const request = createRequestWithBody("/api/clinical-info", {
      speciality: "Dermatology",
      taxonomyCode: "207N00000X",
      NPInumber: 9876543210,
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      speciality: "Dermatology",
      taxonomy_code: "207N00000X",
      NPI_number: 9876543210,
    });
  });

  it("PUT /api/clinical-info should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody("/api/clinical-info", {
      speciality: "Oncology",
      taxonomyCode: "207R00000X",
      NPInumber: 1002003004,
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("PUT /api/clinical-info should return 422 for invalid payload", async () => {
    const request = createRequestWithBody("/api/clinical-info", {
      speciality: "A".repeat(101), // Invalid: exceeds max length
      taxonomyCode: "123",
      NPInumber: "invalid-npi", // Should be number
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);
    expect(response.status).toBe(422);
  });

  it("PUT /api/clinical-info should return 500 on DB error", async () => {
    vi.spyOn(prisma.clinicalInfo, "findFirst").mockRejectedValueOnce(
      new Error("DB fail"),
    );
    const request = createRequestWithBody("/api/clinical-info", {
      speciality: "Pediatrics",
      taxonomyCode: "208000000X",
      NPInumber: 1003004005,
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to update clinical information" });
  });
});
