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
import { UserPrismaFactory } from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
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

  beforeAll(async () => {
    // Create a test user before all tests
    const user = await UserPrismaFactory.create();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up the test user
    await cleanupProfileTestData(testUserId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: testUserId }, // Use the user created in beforeAll
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
    });

    expect(json).toMatchObject({
      email: userFromDb?.email,
      phone: userFromDb?.phone,
      profile_photo: userFromDb?.profile_photo,
      // Add other relevant fields as needed
    });
  });

  it("GET /api/profile should return 401 if session is invalid", async () => {
    // Mock the session as null to simulate an invalid session
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("PUT /api/profile should update user profile (birth date, phone, and profile photo)", async () => {
    const updateData = {
      email: "updated.test@example.com", // Ensure this email is unique if needed
      birth_date: "1990-01-01",
      phone: "+1987654321",
      profile_photo: "https://example.com/new_photo.jpg",
    };

    // Session is mocked in beforeEach to use testUserId

    // Mock the prisma update call for the specific test user
    const updatedUserMock = {
      id: testUserId,
      email: updateData.email,
      phone: updateData.phone,
      profile_photo: updateData.profile_photo,
      date_of_birth: new Date(updateData.birth_date),
      password_hash: "hashedpassword", // Include required fields
      last_login: new Date(),
    };

    // Temporarily override prisma.user.update for this test case
    const originalUpdate = prisma.user.update;
    prisma.user.update = vi.fn().mockImplementation(async (args) => {
      if (args.where.id === testUserId) {
        return updatedUserMock;
      }
      // Call the original function for other IDs if necessary, or throw error
      return originalUpdate(args);
    });

    const request = createRequestWithBody(
      "/api/profile",
      updateData as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Match the mocked user data
    expect(json).toMatchObject({
      date_of_birth: updatedUserMock.date_of_birth.toISOString(),
      email: updatedUserMock.email,
      phone: updatedUserMock.phone,
      profile_photo: updatedUserMock.profile_photo,
    });

    // Restore the original prisma.user.update
    prisma.user.update = originalUpdate;
  });

  it("PUT /api/profile should return 401 if session is missing", async () => {
    // Mock the session as null to simulate an invalid session
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/profile",
      {} as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("PUT /api/profile should return 500 on database error", async () => {
    // Simulate a database error
    vi.spyOn(prisma.user, "update").mockRejectedValueOnce(
      new Error("Database error"),
    );

    const request = createRequestWithBody("/api/profile", {
      birth_date: "1990-01-01",
      phone: "+1234567890",
      profile_photo: "https://example.com/photo.jpg",
    } as unknown as Record<string, unknown>);

    const response = await PUT(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({ error: "Failed to update profile" });
  });
});
