import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/api/client/group/route";
import { createRequest } from "@mcw/utils";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";

// Mock the helper function
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(() =>
    Promise.resolve({ clinicianId: "test-clinician-id" }),
  ),
}));

describe("Client Group API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/client/group should return consistent paginated format", async () => {
    const mockClientGroups = [
      {
        id: "group-1",
        name: "Test Group 1",
        type: "individual",
        is_active: true,
        notes: null,
        clinician_id: "test-clinician-id",
        available_credit: new Decimal(0),
        created_at: new Date(),
        auto_monthly_statement_enabled: false,
        auto_monthly_superbill_enabled: false,
        first_seen_at: null,
        administrative_notes: null,
        ClientGroupMembership: [],
      },
      {
        id: "group-2",
        name: "Test Group 2",
        type: "family",
        is_active: true,
        notes: null,
        clinician_id: "test-clinician-id",
        available_credit: new Decimal(0),
        created_at: new Date(),
        auto_monthly_statement_enabled: false,
        auto_monthly_superbill_enabled: false,
        first_seen_at: null,
        administrative_notes: null,
        ClientGroupMembership: [],
      },
    ];

    prismaMock.clientGroup.findMany.mockResolvedValueOnce(mockClientGroups);
    prismaMock.clientGroup.count.mockResolvedValueOnce(2);

    const request = createRequest("/api/client/group");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify consistent paginated format
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("pagination");
    expect(json.pagination).toHaveProperty("page", 1);
    expect(json.pagination).toHaveProperty("limit", 20);
    expect(json.pagination).toHaveProperty("total", 2);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(2);
  });

  it("GET /api/client/group?id=<id> should return consistent paginated format for single item", async () => {
    const mockClientGroup = {
      id: "group-1",
      name: "Test Group 1",
      type: "individual",
      is_active: true,
      notes: null,
      clinician_id: "test-clinician-id",
      available_credit: new Decimal(0),
      created_at: new Date(),
      auto_monthly_statement_enabled: false,
      auto_monthly_superbill_enabled: false,
      first_seen_at: null,
      administrative_notes: null,
      ClientGroupMembership: [],
    };

    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(mockClientGroup);

    const request = createRequest("/api/client/group?id=group-1");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify consistent paginated format even for single item
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("pagination");
    expect(json.pagination).toHaveProperty("page", 1);
    expect(json.pagination).toHaveProperty("limit", 1);
    expect(json.pagination).toHaveProperty("total", 1);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(1);
    // Compare data excluding dates due to JSON serialization
    expect(json.data[0]).toMatchObject({
      id: mockClientGroup.id,
      name: mockClientGroup.name,
      type: mockClientGroup.type,
      is_active: mockClientGroup.is_active,
      notes: mockClientGroup.notes,
      clinician_id: mockClientGroup.clinician_id,
      auto_monthly_statement_enabled:
        mockClientGroup.auto_monthly_statement_enabled,
      auto_monthly_superbill_enabled:
        mockClientGroup.auto_monthly_superbill_enabled,
      first_seen_at: mockClientGroup.first_seen_at,
      ClientGroupMembership: mockClientGroup.ClientGroupMembership,
    });

    // Check date serialization separately
    expect(json.data[0].created_at).toBe(
      mockClientGroup.created_at.toISOString(),
    );
    expect(json.data[0].available_credit).toBe(
      mockClientGroup.available_credit.toString(),
    );
  });

  it("GET /api/client/group?id=non-existent should return 404", async () => {
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(null);

    const request = createRequest("/api/client/group?id=non-existent");
    const response = await GET(request);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client group not found");
  });
});
