import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/profile/route";
import { prisma } from "@mcw/database";
import {
  ProfileFactory,
  UserFactory,
  ClientFactory,
} from "@mcw/database/mock-data";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock the Prisma client
vi.mock("@mcw/database", () => ({
  prisma: {
    profileDetails: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Profile API Unit Tests", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  it("GET /api/profile should return the profile", async () => {
    // Create mock data
    const user = UserFactory.build();
    const profile = ProfileFactory.build({ user_id: user.id });

    // Mock the Prisma findUnique call
    const mockFindUnique = prisma.profileDetails
      .findUnique as unknown as ReturnType<typeof vi.fn>;
    mockFindUnique.mockResolvedValueOnce(profile);

    const request = new NextRequest(new URL("http://localhost/api/profile"));

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual(profile);
  });

  it("PUT /api/profile should update the profile", async () => {
    // Create mock data
    const user = UserFactory.build();
    const updatedProfile = ProfileFactory.build({ user_id: user.id });

    // Mock the Prisma upsert call
    const mockUpsert = prisma.profileDetails.upsert as unknown as ReturnType<
      typeof vi.fn
    >;
    mockUpsert.mockResolvedValueOnce(updatedProfile);

    const request = new NextRequest(new URL("http://localhost/api/profile"));
    request.method = "PUT";
    request.body = JSON.stringify(updatedProfile);

    const response = await PUT(request);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual(updatedProfile);
  });
});
