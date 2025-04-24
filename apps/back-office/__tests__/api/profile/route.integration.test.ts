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

describe("Profile API Integration Tests", () => {
  let userId: string;

  beforeAll(async () => {
    // Create a test user before all tests
    const user = await UserPrismaFactory.create();
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up by deleting the test user after all tests
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

  it("GET /api/profile should return the user profile", async () => {
    // Step 1: Create a test user
    const mockUser = await UserPrismaFactory.create();

    // Step 2: Set the session to match the created user
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: mockUser.id,
      },
    });

    // Step 3: Call the handler
    const response = await GET();

    // Step 4: Validate
    expect(response.status).toBe(200);
    const json = await response.json();

    // Step 5: Compare actual response to the user created
    expect(json).toMatchObject({
      email: mockUser.email,
      phone: mockUser.phone,
      profile_photo: mockUser.profile_photo,
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
      email: "test@example.com",
      birth_date: "1990-01-01",
      phone: "+1234567890",
      profile_photo: "https://example.com/photo.jpg",
    };

    const user = await UserPrismaFactory.create();
    const userId = user.id;

    // Fake session
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userId },
    });

    // Mock updated user
    const updatedUser = {
      ...updateData,
      id: userId,
      password_hash: "hashedpassword",
      last_login: new Date(),
      date_of_birth: new Date("1990-01-01"),
    };

    // 🔁 Temporarily override prisma.user.update
    const originalUpdate = prisma.user.update;
    prisma.user.update = vi.fn().mockResolvedValueOnce(updatedUser);

    const request = createRequestWithBody(
      "/api/profile",
      updateData as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    console.log("json", json);
    console.log("updatedUser", updatedUser);
    // ✅ Match the mocked user, with ISO-formatted date_of_birth
    expect(json).toMatchObject({
      date_of_birth: updatedUser.date_of_birth.toISOString(),
      email: updatedUser.email,
      phone: updatedUser.phone,
      profile_photo: updatedUser.profile_photo,
    });

    // // 🔁 Restore
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
