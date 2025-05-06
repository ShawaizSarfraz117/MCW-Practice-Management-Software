import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/auth/client-signin/route";
import prismaMock from "@mcw/database/mock";
import { createRequest } from "@mcw/utils";
import jwt from "jsonwebtoken";

// Define a type for the decoded JWT payload
type JwtPayload = { [key: string]: string }; // Adjust the type based on your actual payload structure

vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

// Helper to build a client login link with all required fields
const mockClientLoginLink = (overrides = {}) => ({
  id: "link-id",
  email: "client@example.com",
  token: "test-token",
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  createdAt: new Date(),
  ...overrides,
});

describe("GET /api/auth/client-signin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock for JWT verification to succeed by default
    (jwt.verify as vi.Mock).mockImplementation(() => ({}) as JwtPayload); // Type the mock to return an object
  });

  it("should return 400 if Authorization header is missing or invalid", async () => {
    const request = createRequest("/api/auth/client-signin", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Authorization token is missing or invalid",
      statusCode: 400,
    });
  });

  it("should return 401 if token is not found in database", async () => {
    const request = createRequest("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: "Bearer invalidtoken" },
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValueOnce(null);

    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Invalid or expired token",
      statusCode: 401,
    });
  });

  it("should return 401 if JWT verification fails", async () => {
    const invalidToken = "invalidtoken";
    const request = createRequest("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${invalidToken}` },
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValueOnce(
      mockClientLoginLink({ token: invalidToken }),
    );

    // Mock JWT verification to fail
    (jwt.verify as vi.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Invalid or expired token",
      statusCode: 401,
    });
  });

  it("should return 401 if token has expired", async () => {
    const expiredToken = "expiredtoken";
    const expiredDate = new Date(Date.now() - 1000);

    const request = createRequest("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValueOnce(
      mockClientLoginLink({
        token: expiredToken,
        expiresAt: expiredDate,
      }),
    );

    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Token expired",
      statusCode: 401,
    });
  });

  it("should return 200 if token is valid and not expired", async () => {
    const validToken = "validtoken";
    const validDate = new Date(Date.now() + 1000 * 60 * 60);
    const clientEmail = "client@example.com";

    const request = createRequest("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${validToken}` },
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValueOnce(
      mockClientLoginLink({
        token: validToken,
        expiresAt: validDate,
        email: clientEmail,
      }),
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Token is valid",
      email: clientEmail,
      statusCode: 200,
    });
  });

  it("should handle unexpected errors gracefully", async () => {
    const request = createRequest("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: "Bearer sometoken" },
    });

    prismaMock.clientLoginLink.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Internal server error",
      statusCode: 500,
    });
  });
});
