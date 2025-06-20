// 🔁 Mock Prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clinician: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/profile/route";
import { prisma } from "@mcw/database";
import { UserFactory } from "@mcw/database/mock-data";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";

// 🔁 Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("GET /api/profile", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession);
  });

  it("should return the user profile", async () => {
    const mockUser = {
      email: "admin@example.com",
      date_of_birth: new Date("1990-01-01"),
      phone: "+1234567890",
      profile_photo: "https://example.com/photo.jpg",
      Clinician: {
        first_name: "John",
        last_name: "Doe",
      },
    };

    const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindUnique.mockResolvedValueOnce(mockUser);
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      email: mockUser.email,
      phone: mockUser.phone,
      profile_photo: mockUser.profile_photo,
      first_name: "John",
      last_name: "Doe",
    });
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindUnique.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to fetch profile" }); // adjust to your actual error message
  });
});

describe("PUT /api/profile", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession);
  });

  it("should update birth date, phone, and profile photo", async () => {
    const updateData = {
      dateOfBirth: "1990-01-01",
      phone: "+1234567890",
      profilePhoto: "https://example.com/photo.jpg",
    };

    const mockUser = UserFactory.build({
      id: mockSession.user.id,
      date_of_birth: new Date("1990-01-01"),
      phone: "+1234567890",
      profile_photo: "https://example.com/photo.jpg",
    });

    // Mock the transaction to resolve with the mocked user
    vi.mocked(prisma.$transaction).mockResolvedValue(mockUser);

    const request = createRequestWithBody(
      "/api/profile",
      updateData as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      phone: mockUser.phone,
      profile_photo: mockUser.profile_photo,
    });
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/profile",
      {} as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should return 500 on database error", async () => {
    // Mock transaction to throw error
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("DB error"));

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
