import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@mcw/database";
import { GET } from "../../../../src/app/api/auth/client-signin/route";

vi.mock("@mcw/database", () => ({
  prisma: {
    clientLoginLink: {
      findFirst: vi.fn(),
    },
  },
}));

describe("GET /api/auth/client-signin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if Authorization header is missing or invalid", async () => {
    const request = new NextRequest("http://localhost/api/auth/client-signin", {
      method: "GET",
    });
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Authorization token is missing or invalid",
      statusCode: 400,
    });
  });

  it("should return 401 if token is invalid or expired", async () => {
    const request = new NextRequest("http://localhost/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: "Bearer invalidtoken" },
    });

    prisma.clientLoginLink.findFirst.mockResolvedValue({
      token: "invalidtoken",
      expiresAt: new Date(),
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
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago

    const request = new NextRequest("http://localhost/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    prisma.clientLoginLink.findFirst.mockResolvedValue({
      token: expiredToken,
      expiresAt: expiredDate,
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Token expired",
      statusCode: 401,
    });
  });

  it("should return 200 if token is valid and not expired", async () => {
    const validToken = "validtoken";
    const validDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    const request = new NextRequest("http://localhost/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${validToken}` },
    });

    prisma.clientLoginLink.findFirst.mockResolvedValue({
      token: validToken,
      expiresAt: validDate,
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Token is valid",
      statusCode: 200,
    });
  });

  it("should handle unexpected errors gracefully", async () => {
    const request = new NextRequest("http://localhost/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: "Bearer sometoken" },
    });

    prisma.clientLoginLink.findFirst.mockRejectedValue(
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
