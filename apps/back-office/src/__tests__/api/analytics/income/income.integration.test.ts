// Integration tests for /api/analytics/income route
import { describe, it, expect } from "vitest";
import { GET } from "@/api/analytics/income/route";
import { createRequest } from "@mcw/utils";
import { NextRequest } from "next/server";

describe("GET /api/analytics/income Integration Tests", () => {
  // Basic integration test to verify the endpoint works with real database
  it("should return 200 status and data structure when called with valid parameters", async () => {
    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-01&endDate=2023-01-31",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("data");
    expect(Array.isArray(jsonResponse.data)).toBe(true);
  });
});
