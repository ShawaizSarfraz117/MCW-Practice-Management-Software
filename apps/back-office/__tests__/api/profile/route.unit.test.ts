// 🔁 Mock Prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/profile/route";
import { prisma } from "@mcw/database";
import { UserFactory } from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";

// 🔁 Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("GET /api/profile", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  it("should return the user profile", async () => {
    const mockUser = UserFactory.build({
      id: mockSession.user.id,
      email: "admin@example.com",
    });

    const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindUnique.mockResolvedValueOnce(mockUser);
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      phone: mockUser.phone,
      profile_photo: mockUser.profile_photo,

      // add only the relevant keys
    });
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

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
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  it("should update birth date, phone, and profile photo", async () => {
    const updateData = {
      birth_date: "1990-01-01",
      phone: "+1234567890",
      profile_photo: "https://example.com/photo.jpg",
    };

    const mockUser = UserFactory.build({
      id: mockSession.user.id,
      ...updateData,
    });

    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser);

    const request = createRequestWithBody(
      "/api/profile",
      updateData as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(JSON.stringify(json)).toEqual(
      JSON.stringify({
        ...mockUser,
        date_of_birth: mockUser.date_of_birth?.toISOString(),
        phone: mockUser.phone,
        profile_photo: mockUser.profile_photo,
      }),
    );
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/profile",
      {} as unknown as Record<string, unknown>,
    );

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should return 500 on database error", async () => {
    const mockUpdate = prisma.user.update as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpdate?.mockRejectedValueOnce(new Error("DB error"));

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
