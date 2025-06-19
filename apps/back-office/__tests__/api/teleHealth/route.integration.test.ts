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
import { GET, PUT } from "@/api/teleHealth/route";
import {
  UserPrismaFactory,
  RolePrismaFactory,
  UserRolePrismaFactory,
} from "@mcw/database/mock-data";
import { createRequestWithBody } from "@mcw/utils";
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
async function cleanupTeleHealthTestData(userId: string) {
  // Delete all telehealth locations
  await prisma.location.deleteMany({ where: { name: "Telehealth" } });
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("TeleHealth API Integration Tests", () => {
  let userId: string;
  let session: { user: { id: string }; expires: string };

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
      },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  });

  afterAll(async () => {
    await cleanupTeleHealthTestData(userId);
  });

  afterEach(async () => {
    // Clean up any telehealth locations created during tests
    await prisma.location.deleteMany({ where: { name: "Telehealth" } });
    vi.resetAllMocks();
  });

  beforeEach(() => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(session);
  });

  it("GET /api/teleHealth returns telehealth location", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.location).toMatchObject({
      name: "Telehealth",
      address: "Virtual Location",
      street: "Virtual",
      is_active: true,
    });
  });

  it("GET /api/teleHealth returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("GET /api/teleHealth creates default location if none exists", async () => {
    // Ensure no telehealth location exists
    await prisma.location.deleteMany({ where: { name: "Telehealth" } });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.location).toMatchObject({
      name: "Telehealth",
      address: "Virtual Location",
      street: "Virtual",
      color: "#10b981",
      is_active: true,
    });

    // Verify it was created in the database
    const dbLocation = await prisma.location.findFirst({
      where: { name: "Telehealth" },
    });
    expect(dbLocation).not.toBeNull();
  });

  it("PUT /api/teleHealth updates location details", async () => {
    // First create a telehealth location
    const location = await prisma.location.create({
      data: {
        name: "Telehealth",
        address: "Virtual Location",
        street: "Virtual",
        city: "",
        state: "",
        zip: "",
        color: "#10b981",
        is_active: true,
      },
    });

    const body = {
      locationId: location.id,
      name: "Updated Virtual Office",
      address: "123 Updated St",
      street: "123 Updated St",
      city: "Updated City",
      state: "CA",
      zip: "90001",
      color: "#123456",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.location).toMatchObject({
      id: location.id,
      name: "Updated Virtual Office",
      address: "123 Updated St",
      street: "123 Updated St",
      city: "Updated City",
      state: "CA",
      zip: "90001",
      color: "#123456",
    });
  });

  it("PUT /api/teleHealth returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);
    const body = {
      locationId: "00000000-0000-0000-0000-000000000000",
      name: "Should Not Update",
      address: "Should Not Update",
      street: "Should Not Update",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("PUT /api/teleHealth returns 400 for invalid payload", async () => {
    const body = {
      locationId: "not-a-uuid",
      name: "",
      address: "",
      street: "",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Incomplete or invalid data");
    expect(json.details).toBeDefined();
  });

  it("PUT /api/teleHealth returns 404 if location not found", async () => {
    const body = {
      locationId: "00000000-0000-0000-0000-000000000000",
      name: "Nonexistent",
      address: "Nonexistent",
      street: "Nonexistent",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Location not found");
  });

  it("GET /api/teleHealth returns 500 on DB error", async () => {
    const origFindFirst = prisma.location.findFirst;
    // @ts-expect-error: Monkey-patching for test
    prisma.location.findFirst = async () => {
      throw new Error("DB fail");
    };
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("DB fail");
    expect(json.error.issueId).toMatch(/^ERR-/);
    // Restore
    prisma.location.findFirst = origFindFirst;
  });

  it("PUT /api/teleHealth returns 500 on DB error", async () => {
    // First create a location to update
    const location = await prisma.location.create({
      data: {
        name: "Test Location for Error",
        address: "Test Address",
        street: "Test Street",
        city: "",
        state: "",
        zip: "",
        color: "#000000",
        is_active: true,
      },
    });

    const origUpdate = prisma.location.update;
    // @ts-expect-error: Monkey-patching for test
    prisma.location.update = async () => {
      throw new Error("DB fail");
    };
    const body = {
      locationId: location.id,
      name: "Should Fail",
      address: "Should Fail",
      street: "Should Fail",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("DB fail");
    expect(json.error.issueId).toMatch(/^ERR-/);
    // Restore
    prisma.location.update = origUpdate;
    // Clean up
    await prisma.location.delete({ where: { id: location.id } });
  });
});
