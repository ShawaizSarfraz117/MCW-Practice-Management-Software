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
import { GET, PUT } from "@/api/teleHealth/route";
import {
  ClinicianPrismaFactory,
  RolePrismaFactory,
  UserRolePrismaFactory,
  LocationPrismaFactory,
} from "@mcw/database/mock-data";
import { createRequestWithBody } from "@mcw/utils";
import { getClinicianInfo } from "@/utils/helpers";

// Mock getClinicianInfo for session
vi.mock("@/utils/helpers", () => ({
  ...vi.importActual("@/utils/helpers"),
  getClinicianInfo: vi.fn(),
}));
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Helper to clean up all test data for a clinician
async function cleanupTeleHealthTestData(
  clinicianId: string,
  userId: string,
  locationId: string,
) {
  await prisma.clinicianLocation.deleteMany({
    where: { clinician_id: clinicianId },
  });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.clinician.deleteMany({ where: { id: clinicianId } });
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describe("TeleHealth API Integration Tests", () => {
  let clinicianId: string;
  let userId: string;
  let locationId: string;

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
    // Create a location
    const location = await LocationPrismaFactory.create();
    locationId = location.id;
    // Link clinician to location (primary)
    await prisma.clinicianLocation.create({
      data: {
        clinician_id: clinicianId,
        location_id: locationId,
        is_primary: true,
      },
    });
    // Assign CLINICIAN role to user
    await UserRolePrismaFactory.create({
      User: { connect: { id: userId } },
      Role: { connect: { id: role.id } },
    });
  });

  afterAll(async () => {
    await cleanupTeleHealthTestData(clinicianId, userId, locationId);
  });

  afterEach(async () => {
    vi.resetAllMocks();
  });

  it("GET /api/teleHealth returns clinician and primary location", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clinician).toMatchObject({ id: clinicianId });
    expect(json.location).toMatchObject({ id: locationId });
  });

  it("GET /api/teleHealth returns 403 if not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: false,
      clinicianId: null,
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("GET /api/teleHealth returns 404 if no location", async () => {
    await prisma.clinicianLocation.deleteMany({
      where: { clinician_id: clinicianId },
    });
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
    const res = await GET();
    expect(res.status).toBe(404);
    // Restore the link for other tests
    await prisma.clinicianLocation.create({
      data: {
        clinician_id: clinicianId,
        location_id: locationId,
        is_primary: true,
      },
    });
  });

  it("PUT /api/teleHealth updates location details", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
    const body = {
      locationId,
      name: "Updated Office",
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
      id: locationId,
      name: "Updated Office",
      address: "123 Updated St",
      street: "123 Updated St",
      city: "Updated City",
      state: "CA",
      zip: "90001",
      color: "#123456",
    });
  });

  it("PUT /api/teleHealth returns 403 if not a clinician", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: false,
      clinicianId: null,
    });
    const body = {
      locationId,
      name: "Should Not Update",
      address: "Should Not Update",
      street: "Should Not Update",
    };
    const req = createRequestWithBody("/api/teleHealth", body, {
      method: "PUT",
    });
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("PUT /api/teleHealth returns 400 for invalid payload", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
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
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
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
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
    const origFindUnique = prisma.clinician.findUnique;
    // @ts-expect-error: Monkey-patching for test
    prisma.clinician.findUnique = async () => {
      throw new Error("DB fail");
    };
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch telehealth details");
    // Restore
    prisma.clinician.findUnique = origFindUnique;
  });

  it("PUT /api/teleHealth returns 500 on DB error", async () => {
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId,
    });
    const origUpdate = prisma.location.update;
    // @ts-expect-error: Monkey-patching for test
    prisma.location.update = async () => {
      throw new Error("DB fail");
    };
    const body = {
      locationId,
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
    expect(json.error).toBe("Failed to update telehealth location");
    // Restore
    prisma.location.update = origUpdate;
  });
});
