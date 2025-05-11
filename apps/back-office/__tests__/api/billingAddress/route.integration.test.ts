import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { GET, POST } from "@/api/billingAddress/route";
import {
  ClinicianPrismaFactory,
  RolePrismaFactory,
  UserRolePrismaFactory,
} from "@mcw/database/mock-data";
import { createRequestWithBody, createRequest } from "@mcw/utils";
import { getServerSession } from "next-auth";

// Mock next-auth and auth options for session
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Helper to clean up all billing addresses for a clinician
async function cleanupBillingAddresses(clinicianId: string, userId: string) {
  await prisma.billingAddress.deleteMany({
    where: { clinician_id: clinicianId },
  });
  await prisma.clinician.deleteMany({ where: { id: clinicianId } });
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("Billing Address API Integration Tests", () => {
  let clinicianId: string;
  let userId: string;
  let session: Record<string, unknown>;

  beforeAll(async () => {
    // Ensure the CLINICIAN role exists
    let role = await prisma.role.findUnique({ where: { name: "CLINICIAN" } });
    if (!role) {
      role = await RolePrismaFactory.create({ name: "CLINICIAN" });
    }
    // Create a clinician and its user
    const clinician = await ClinicianPrismaFactory.create();
    clinicianId = clinician.id;
    userId = clinician.user_id;
    // Assign CLINICIAN role to user (correct Prisma shape)
    await UserRolePrismaFactory.create({
      User: { connect: { id: userId } },
      Role: { connect: { id: role.id } },
    });
    // Simulate session object as expected by getClinicianInfo
    session = {
      user: {
        id: userId,
        roles: ["CLINICIAN"],
      },
    };
  });

  afterAll(async () => {
    await cleanupBillingAddresses(clinicianId, userId);
  });

  afterEach(async () => {
    await prisma.billingAddress.deleteMany({
      where: { clinician_id: clinicianId },
    });
    vi.resetAllMocks();
  });

  it("GET /api/billingAddress returns empty array if none exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    const req = createRequest("/api/billingAddress", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.billingAddresses).toEqual([]);
  });

  it("POST /api/billingAddress creates a new address", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    const body = {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      type: "business",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.billingAddress).toMatchObject(body);
    // Confirm in DB
    const db = await prisma.billingAddress.findFirst({
      where: { clinician_id: clinicianId, type: "business" },
    });
    expect(db).not.toBeNull();
    expect(db?.street).toBe("123 Main St");
  });

  it("POST /api/billingAddress updates existing address of same type", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    // Create initial
    await prisma.billingAddress.create({
      data: {
        street: "Old St",
        city: "Old City",
        state: "CA",
        zip: "90001",
        type: "business",
        clinician_id: clinicianId,
      },
    });
    const body = {
      street: "456 New St",
      city: "New City",
      state: "NY",
      zip: "10001",
      type: "business",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.billingAddress).toMatchObject(body);
    expect(json.message).toMatch(/updated/);
    // Confirm in DB
    const db = await prisma.billingAddress.findFirst({
      where: { clinician_id: clinicianId, type: "business" },
    });
    expect(db?.street).toBe("456 New St");
  });

  it("GET /api/billingAddress returns addresses for clinician", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    await prisma.billingAddress.create({
      data: {
        street: "789 Oak St",
        city: "Tree City",
        state: "TX",
        zip: "73301",
        type: "client",
        clinician_id: clinicianId,
      },
    });
    const req = createRequest("/api/billingAddress", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.billingAddresses.length).toBe(1);
    expect(json.billingAddresses[0]).toMatchObject({
      street: "789 Oak St",
      city: "Tree City",
      state: "TX",
      zip: "73301",
      type: "client",
    });
  });

  it("GET /api/billingAddress returns 403 if not a clinician", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId, roles: ["ADMIN"] },
    });
    const req = createRequest("/api/billingAddress", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("POST /api/billingAddress returns 403 if not a clinician", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId, roles: ["ADMIN"] },
    });
    const body = {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      type: "business",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST /api/billingAddress returns 400 for invalid payload", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    const body = {
      street: "",
      city: "",
      state: "",
      zip: "",
      type: "invalidtype",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid data");
    expect(json.details).toBeDefined();
  });

  it("POST /api/billingAddress returns 500 on DB error", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    // Temporarily monkey-patch prisma.billingAddress.findFirst to throw
    const origFindFirst = prisma.billingAddress.findFirst;
    // @ts-expect-error Mocking findFirst to simulate DB error
    prisma.billingAddress.findFirst = async () => {
      throw new Error("DB fail");
    };
    const body = {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      type: "business",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to create billing address");
    // Restore
    prisma.billingAddress.findFirst = origFindFirst;
  });
});
