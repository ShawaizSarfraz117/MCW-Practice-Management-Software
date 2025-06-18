import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/client/overview/route";
import { createRequest } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock the getClinicianInfo to avoid session dependencies
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    clinicianId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    practiceId: "e4d909c2-90a0-4f2a-b8a7-3c5d5e9f0123",
  }),
}));

describe("GET /api/client/overview - Integration", () => {
  // Mock session for all tests
  beforeEach(() => {
    const mockSession = {
      user: {
        id: "c56a4180-65aa-42ec-a945-5fd21dec0538",
        email: "test@example.com",
        role: "CLINICIAN",
      },
      clinician: {
        id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        first_name: "Test",
        last_name: "Clinician",
      },
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  it("should return error when clientGroupId is missing", async () => {
    const request = createRequest("/api/client/overview");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("clientGroupId is required");
  });

  it("should return empty results when no documents exist for a non-existent group", async () => {
    // Use a UUID that doesn't exist in the database
    const nonExistentGroupId = "a1b2c3d4-e5f6-4789-0123-456789abcdef";
    const request = createRequest(
      `/api/client/overview?clientGroupId=${nonExistentGroupId}`,
    );

    const response = await GET(request);
    const data = await response.json();

    // Log error if not 200
    if (response.status !== 200) {
      console.error("Response error:", data);
    }

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("should handle pagination parameters correctly", async () => {
    const nonExistentGroupId = "a1b2c3d4-e5f6-4789-0123-456789abcdef";
    const request = createRequest(
      `/api/client/overview?clientGroupId=${nonExistentGroupId}&page=3&limit=50`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.pagination).toEqual({
      page: 3,
      limit: 50,
      total: 0,
      totalPages: 0,
    });
  });

  it("should accept all valid itemType values", async () => {
    const nonExistentGroupId = "a1b2c3d4-e5f6-4789-0123-456789abcdef";
    const validItemTypes = [
      "appointments",
      "chart_notes",
      "diagnosis_and_treatment_plans",
      "good_faith_estimate",
      "mental_status_exams",
      "scored_measures",
      "questionnaires",
      "other_documents",
      "all",
    ];

    for (const itemType of validItemTypes) {
      const request = createRequest(
        `/api/client/overview?clientGroupId=${nonExistentGroupId}&itemType=${itemType}`,
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
    }
  });

  it("should handle date filtering parameters", async () => {
    const nonExistentGroupId = "a1b2c3d4-e5f6-4789-0123-456789abcdef";
    const request = createRequest(
      `/api/client/overview?clientGroupId=${nonExistentGroupId}&startDate=2024-01-01&endDate=2024-12-31&itemType=all`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    // The query should execute successfully even with date filters
  });

  it("should handle concurrent requests without errors", async () => {
    const nonExistentGroupId = "a1b2c3d4-e5f6-4789-0123-456789abcdef";

    // Make multiple concurrent requests
    const requests = Array.from({ length: 5 }, (_, i) =>
      createRequest(
        `/api/client/overview?clientGroupId=${nonExistentGroupId}&page=${i + 1}&itemType=all`,
      ),
    );

    const responses = await Promise.all(requests.map((req) => GET(req)));
    const results = await Promise.all(responses.map((res) => res.json()));

    // All requests should succeed
    responses.forEach((res) => expect(res.status).toBe(200));
    results.forEach((data, i) => {
      expect(data.pagination.page).toBe(i + 1);
      expect(data.data).toEqual([]);
    });
  });

  // Test with actual data if available
  it("should return data if client group exists with documents", async () => {
    // First, check if there's any client group with data
    const existingGroup = await prisma.clientGroup.findFirst({
      include: {
        _count: {
          select: {
            ClientGroupChartNote: true,
            Appointment: true,
          },
        },
      },
    });

    if (existingGroup) {
      const request = createRequest(
        `/api/client/overview?clientGroupId=${existingGroup.id}&itemType=all`,
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");

      // If the group has any related documents, we should get some results
      const totalDocuments =
        (existingGroup?._count?.ClientGroupChartNote || 0) +
        (existingGroup?._count?.Appointment || 0);

      if (totalDocuments > 0) {
        expect(data.data.length).toBeGreaterThan(0);
      }
    }
  });
});
