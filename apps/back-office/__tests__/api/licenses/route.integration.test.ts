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
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("License API Integration Tests", () => {
  let userId: string;
  let clinicalInfoId: string;

  beforeAll(async () => {
    const user = await UserPrismaFactory.create();
    userId = user.id;

    const clinicalInfo = await prisma.clinicalInfo.create({
      data: {
        user_id: userId,
        speciality: "Medical",
        taxonomy_code: "1234567890",
        NPI_number: 1234567890,
      },
    });
    clinicalInfoId = clinicalInfo.id.toString();
  });

  afterAll(async () => {
    await prisma.license.deleteMany({
      where: { clinical_info_id: parseInt(clinicalInfoId) },
    });
    await prisma.clinicalInfo.deleteMany({
      where: { id: parseInt(clinicalInfoId) },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/license should return licenses for a user", async () => {
    const license = await prisma.license.create({
      data: {
        clinical_info_id: parseInt(clinicalInfoId),
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

  it("GET /api/license should return 404 if clinical info not found", async () => {
    const user = await UserPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id },
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

    const request = new NextRequest(new URL("http://localhost/api/license"), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

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
    const request = new NextRequest(new URL("http://localhost/api/license"), {
      method: "POST",
      body: JSON.stringify({ not: "an array" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it("POST /api/license should return 404 if clinical info not found", async () => {
    const user = await UserPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id },
    });

    const request = new NextRequest(new URL("http://localhost/api/license"), {
      method: "POST",
      body: JSON.stringify([
        {
          license_type: "NP",
          license_number: "NP123",
          expiration_date: "2032-01-01",
          state: "TX",
        },
      ]),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("POST /api/license should return 401 if not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new NextRequest(new URL("http://localhost/api/license"), {
      method: "POST",
      body: JSON.stringify([]),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("POST /api/license should return 500 on database error", async () => {
    vi.spyOn(prisma.license, "create").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const request = new NextRequest(new URL("http://localhost/api/license"), {
      method: "POST",
      body: JSON.stringify([
        {
          license_type: "MD",
          license_number: "123456",
          expiration_date: "2030-01-01",
          state: "CA",
        },
      ]),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
