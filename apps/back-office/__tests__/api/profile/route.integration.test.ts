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
import { GET, PUT } from "@/api/profile/route";
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

// Helper function for cleaning up test data
async function cleanupProfileTestData(userId: string) {
  try {
    // Add deletions for related data if necessary
    await prisma.userRole.deleteMany({ where: { user_id: userId } });
    // Add other related deletions here...
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error(`Error cleaning up user ${userId}:`, error);
  }
}

describe("Profile API Integration Tests", () => {
  let testUserId: string;
  let testClinicianId: string;

  beforeAll(async () => {
    // Create a test user before all tests
    const user = await UserPrismaFactory.create();
    testUserId = user.id;

    // Create a clinician linked to the user
    const clinician = await ClinicianPrismaFactory.create({
      User: {
        connect: { id: testUserId },
      },
      first_name: "Test",
      last_name: "User",
    });
    testClinicianId = clinician.id;
  });

  afterAll(async () => {
    // Clean up the test data
    await prisma.clinician
      .delete({ where: { id: testClinicianId } })
      .catch(() => {});
    await cleanupProfileTestData(testUserId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: { id: testUserId }, // Use the user created in beforeAll
      expires: new Date().toISOString(),
    });
  });

  it("GET /api/profile should return the user profile", async () => {
    // Session is already mocked in beforeEach to use testUserId

    // Call the handler
    const response = await GET();

    // Validate
    expect(response.status).toBe(200);
    const json = await response.json();

    // Compare actual response to the user created in beforeAll
    // Fetch the user data directly to compare
    const userFromDb = await prisma.user.findUnique({
      where: { id: testUserId },
      include: {
        Clinician: true,
      },
    });

    expect(json).toMatchObject({
      email: userFromDb?.email,
      phone: userFromDb?.phone,
      profile_photo: userFromDb?.profile_photo,
      first_name: userFromDb?.Clinician?.first_name || null,
      last_name: userFromDb?.Clinician?.last_name || null,
    });
  });

  it("GET /api/profile should return 401 if session is invalid", async () => {
    // Mock the session as null to simulate an invalid session
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("PUT /api/profile should update user profile (birth date, phone, and profile photo)", async () => {
    const updateData = {
      dateOfBirth: "1990-01-01",
      phone: "+1987654321",
      profilePhoto: "https://example.com/new_photo.jpg",
      firstName: "Updated",
      lastName: "Name",
    };

    const request = createRequestWithBody(
      "/api/profile",
      updateData as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);

    // Verify the update in the database
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    const updatedClinician = await prisma.clinician.findUnique({
      where: { user_id: testUserId },
    });

    expect(updatedUser?.phone).toBe(updateData.phone);
    expect(updatedUser?.profile_photo).toBe(updateData.profilePhoto);
    expect(updatedUser?.date_of_birth).toEqual(
      new Date(updateData.dateOfBirth),
    );
    expect(updatedClinician?.first_name).toBe(updateData.firstName);
    expect(updatedClinician?.last_name).toBe(updateData.lastName);
  });

  it("PUT /api/profile should return 401 if session is missing", async () => {
    // Mock the session as null to simulate an invalid session
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/profile",
      {} as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("PUT /api/profile should return 500 on database error", async () => {
    // Simulate a database error
    vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(
      new Error("Database error"),
    );

    const request = createRequestWithBody("/api/profile", {
      dateOfBirth: "1990-01-01",
      phone: "+1234567890",
      profilePhoto: "https://example.com/photo.jpg",
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({ error: "Failed to update profile" });
  });
});
