import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
} from "vitest";
import { prisma } from "@mcw/database";
import { GET, PUT } from "@/api/practiceInformation/route";
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

// Helper to clean up all practice information for a user
async function cleanupPracticeInformation(userId: string) {
  // Delete practice information without clinician_id
  await prisma.practiceInformation.deleteMany({
    where: { clinician_id: null },
  });

  // Now delete user roles and user
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("Practice Information API Integration Tests", () => {
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
    await cleanupPracticeInformation(userId);
  });

  afterEach(async () => {
    await prisma.practiceInformation.deleteMany({
      where: { clinician_id: null },
    });
    vi.resetAllMocks();
  });

  // Add beforeEach to mock getBackOfficeSession for all tests
  beforeEach(() => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(session);
  });

  it("GET /api/practiceInformation returns 404 if none exist", async () => {
    // Ensure no practice information exists
    await prisma.practiceInformation.deleteMany({
      where: { clinician_id: null },
    });

    const res = await GET();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("PUT /api/practiceInformation creates new info", async () => {
    const body = {
      practiceName: "Test Practice",
      practiceEmail: "practice@example.com",
      timeZone: "America/Chicago",
      practiceLogo: "logo.png",
      phoneNumbers: [
        { number: "123-456-7890", type: "main" },
        { number: "987-654-3210", type: "fax" },
      ],
      teleHealth: true,
    };
    const req = createRequestWithBody("/api/practiceInformation", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.practice_name).toBe("Test Practice");
    expect(json.practice_email).toBe("practice@example.com");
    expect(json.time_zone).toBe("America/Chicago");
    expect(json.practice_logo).toBe("logo.png");
    expect(JSON.parse(json.phone_numbers)).toEqual(body.phoneNumbers);
    expect(json.tele_health).toBe(true);
    // Confirm in DB
    const db = await prisma.practiceInformation.findFirst({
      where: { clinician_id: null },
    });
    expect(db).not.toBeNull();
    expect(db?.practice_name).toBe("Test Practice");
  });

  it("PUT /api/practiceInformation updates existing info", async () => {
    // Create initial
    await prisma.practiceInformation.create({
      data: {
        clinician_id: null,
        practice_name: "Old Name",
        practice_email: "old@example.com",
        time_zone: "UTC",
        practice_logo: "old.png",
        phone_numbers: JSON.stringify([
          { number: "000-000-0000", type: "main" },
        ]),
        tele_health: false,
      },
    });
    const body = {
      practiceName: "New Name",
      practiceEmail: "new@example.com",
      timeZone: "America/New_York",
      practiceLogo: "new.png",
      phoneNumbers: [{ number: "111-222-3333", type: "main" }],
      teleHealth: false,
    };
    const req = createRequestWithBody("/api/practiceInformation", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    // Confirm in DB
    const db = await prisma.practiceInformation.findFirst({
      where: { clinician_id: null },
    });
    expect(db?.practice_name).toBe("New Name");
    expect(db?.practice_email).toBe("new@example.com");
    expect(db?.time_zone).toBe("America/New_York");
    expect(db?.practice_logo).toBe("new.png");
    expect(JSON.parse(db?.phone_numbers || "[]")).toEqual(body.phoneNumbers);
    expect(db?.tele_health).toBe(false);
  });

  it("GET /api/practiceInformation returns info for user", async () => {
    await prisma.practiceInformation.create({
      data: {
        clinician_id: null,
        practice_name: "Practice Info",
        practice_email: "info@example.com",
        time_zone: "America/Denver",
        practice_logo: "info.png",
        phone_numbers: JSON.stringify([
          { number: "222-333-4444", type: "main" },
        ]),
        tele_health: true,
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.practice_name).toBe("Practice Info");
    expect(json.practice_email).toBe("info@example.com");
    expect(json.time_zone).toBe("America/Denver");
    expect(json.practice_logo).toBe("info.png");
    expect(json.tele_health).toBe(true);
    expect(json.phone_numbers).toEqual([
      { number: "222-333-4444", type: "main" },
    ]);
  });

  it("GET /api/practiceInformation returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("PUT /api/practiceInformation returns 401 if not authenticated", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(null);
    const body = {
      practiceName: "Should Not Save",
      practiceEmail: "shouldnot@example.com",
      timeZone: "America/Chicago",
      practiceLogo: "shouldnot.png",
      phoneNumbers: [],
      teleHealth: false,
    };
    const req = createRequestWithBody("/api/practiceInformation", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("PUT /api/practiceInformation returns 422 for invalid payload", async () => {
    const body = {
      practiceName: "",
      practiceEmail: "",
      timeZone: "",
      practiceLogo: "",
      phoneNumbers: null,
      teleHealth: null,
    };
    const req = createRequestWithBody("/api/practiceInformation", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("Invalid request payload");
    expect(json.details).toBeDefined();
  });

  it("GET /api/practiceInformation returns 500 on DB error", async () => {
    const origFindFirst = prisma.practiceInformation.findFirst;
    // @ts-expect-error: Monkey-patching for test
    prisma.practiceInformation.findFirst = async () => {
      throw new Error("DB fail");
    };
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("DB fail");
    expect(json.error.issueId).toMatch(/^ERR-/);
    // Restore
    prisma.practiceInformation.findFirst = origFindFirst;
  });

  it("PUT /api/practiceInformation returns 500 on DB error", async () => {
    // Ensure there is an existing record so update is called
    await prisma.practiceInformation.create({
      data: {
        clinician_id: null,
        practice_name: "Existing",
        practice_email: "existing@example.com",
        time_zone: "UTC",
        practice_logo: "existing.png",
        phone_numbers: JSON.stringify([]),
        tele_health: false,
      },
    });

    const origUpdate = prisma.practiceInformation.update;
    // @ts-expect-error: Monkey-patching for test
    prisma.practiceInformation.update = async () => {
      throw new Error("DB fail");
    };
    const body = {
      practiceName: "Should Fail",
      practiceEmail: "fail@example.com",
      timeZone: "America/Chicago",
      practiceLogo: "fail.png",
      phoneNumbers: [],
      teleHealth: false,
    };
    const req = createRequestWithBody("/api/practiceInformation", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    // In non-production, withErrorHandling returns detailed error object
    expect(json.error.message).toBe("DB fail");
    expect(json.error.issueId).toMatch(/^ERR-/);
    // Restore
    prisma.practiceInformation.update = origUpdate;
  });
});
