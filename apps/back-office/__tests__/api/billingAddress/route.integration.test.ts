import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { GET, POST } from "@/api/billingAddress/route";
import {
  UserPrismaFactory,
  RolePrismaFactory,
  UserRolePrismaFactory,
} from "@mcw/database/mock-data";
import { createRequestWithBody, createRequest } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";

// Mock getBackOfficeSession for session
vi.mock("@/utils/helpers", () => ({
  ...vi.importActual("@/utils/helpers"),
  getBackOfficeSession: vi.fn(),
}));
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Helper to clean up all test data
async function cleanupBillingAddresses(userId: string) {
  // Delete all practice-wide billing addresses
  await prisma.billingAddress.deleteMany({
    where: { clinician_id: { equals: null } },
  });
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("Billing Address API Integration Tests", () => {
  let userId: string;
  let session: { user: { id: string; roles: string[] }; expires: string };

  beforeAll(async () => {
    // Ensure the ADMIN role exists
    let role = await prisma.role.findUnique({ where: { name: "ADMIN" } });
    if (!role) {
      role = await RolePrismaFactory.create({ name: "ADMIN" });
    }
    // Create a user
    const user = await UserPrismaFactory.create();
    userId = user.id;
    // Assign ADMIN role to user
    await UserRolePrismaFactory.create({
      User: { connect: { id: userId } },
      Role: { connect: { id: role.id } },
    });
    // Simulate session object
    session = {
      user: {
        id: userId,
        roles: ["ADMIN"],
      },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  });

  afterAll(async () => {
    await cleanupBillingAddresses(userId);
  });

  afterEach(async () => {
    // Clean up practice-wide billing addresses
    await prisma.billingAddress.deleteMany({
      where: { clinician_id: { equals: null } },
    });
    vi.resetAllMocks();
  });

  beforeEach(() => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(session);
  });

  it("GET /api/billingAddress returns empty array if none exist", async () => {
    const req = createRequest("/api/billingAddress", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.billingAddresses).toEqual([]);
  });

  it("POST /api/billingAddress creates a new address", async () => {
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
      where: { clinician_id: { equals: null }, type: "business" },
    });
    expect(db).not.toBeNull();
    expect(db?.street).toBe("123 Main St");
  });

  it("POST /api/billingAddress updates existing address of same type", async () => {
    // Create initial
    await prisma.billingAddress.create({
      data: {
        street: "Old St",
        city: "Old City",
        state: "CA",
        zip: "90001",
        type: "business",
        clinician_id: null,
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
      where: { clinician_id: { equals: null }, type: "business" },
    });
    expect(db?.street).toBe("456 New St");
  });

  it("GET /api/billingAddress returns practice-wide addresses", async () => {
    await prisma.billingAddress.create({
      data: {
        street: "789 Oak St",
        city: "Tree City",
        state: "TX",
        zip: "73301",
        type: "client",
        clinician_id: null,
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

  it("GET /api/billingAddress filters by type when provided", async () => {
    // Create both business and client addresses
    await prisma.billingAddress.create({
      data: {
        street: "123 Business St",
        city: "Business City",
        state: "BC",
        zip: "12345",
        type: "business",
        clinician_id: null,
      },
    });
    await prisma.billingAddress.create({
      data: {
        street: "456 Client Ave",
        city: "Client City",
        state: "CC",
        zip: "67890",
        type: "client",
        clinician_id: null,
      },
    });

    // Test filtering by business type
    const reqBusiness = createRequest("/api/billingAddress?type=business", {
      method: "GET",
    });
    const resBusiness = await GET(reqBusiness);
    expect(resBusiness.status).toBe(200);
    const jsonBusiness = await resBusiness.json();
    expect(jsonBusiness.billingAddresses.length).toBe(1);
    expect(jsonBusiness.billingAddresses[0].type).toBe("business");

    // Test filtering by client type
    const reqClient = createRequest("/api/billingAddress?type=client", {
      method: "GET",
    });
    const resClient = await GET(reqClient);
    expect(resClient.status).toBe(200);
    const jsonClient = await resClient.json();
    expect(jsonClient.billingAddresses.length).toBe(1);
    expect(jsonClient.billingAddresses[0].type).toBe("client");
  });

  it("GET /api/billingAddress returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);
    const req = createRequest("/api/billingAddress", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("POST /api/billingAddress returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);
    const body = {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      type: "business",
    };
    const req = createRequestWithBody("/api/billingAddress", body);
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("POST /api/billingAddress returns 400 for invalid payload", async () => {
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
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("DB fail");
    expect(json.error.issueId).toMatch(/^ERR-/);
    // Restore
    prisma.billingAddress.findFirst = origFindFirst;
  });
});
