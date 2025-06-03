import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST } from "@/api/client/group/route";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";

// Mock client group factory function
const mockClientGroup = (overrides = {}) => ({
  id: "group-1",
  name: "Test Group",
  type: "FAMILY",
  is_active: true,
  notes: null,
  clinician_id: "clinician-1",
  available_credit: new Decimal(0),
  created_at: new Date(),
  auto_monthly_statement_enabled: false,
  auto_monthly_superbill_enabled: false,
  first_seen_at: null,
  administrative_notes: null,
  ClientGroupMembership: [],
  ...overrides,
});

describe("Client Group API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/client/group should return all client groups", async () => {
    const mockClientGroups = [
      mockClientGroup({ id: "group-1", name: "Group 1" }),
      mockClientGroup({ id: "group-2", name: "Group 2" }),
    ];

    prismaMock.clientGroup.findMany.mockResolvedValueOnce(mockClientGroups);

    const req = createRequest("/api/client/group");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0]).toHaveProperty("id", "group-1");
    expect(json[1]).toHaveProperty("id", "group-2");
  });

  it("GET /api/client/group?id=<id> should return a specific client group", async () => {
    const mockClientGroupData = mockClientGroup({
      id: "group-1",
      name: "Test Group",
    });

    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(
      mockClientGroupData,
    );

    const req = createRequest("/api/client/group?id=group-1");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id", "group-1");
    expect(json).toHaveProperty("name", "Test Group");
    expect(json).toHaveProperty("administrative_notes", null);
  });

  it("GET /api/client/group?id=<id> should return 404 for non-existent group", async () => {
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/client/group?id=non-existent");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client group not found");
  });

  it("POST /api/client/group should create a new client group", async () => {
    const newGroupData = {
      name: "New Test Group",
      type: "FAMILY",
      clinician_id: "clinician-1",
    };

    const createdGroup = mockClientGroup({
      id: "new-group-id",
      ...newGroupData,
    });

    prismaMock.clientGroup.create.mockResolvedValueOnce(createdGroup);

    const req = createRequestWithBody("/api/client/group", newGroupData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("id", "new-group-id");
    expect(json).toHaveProperty("name", "New Test Group");
    expect(json).toHaveProperty("administrative_notes", null);

    expect(prismaMock.clientGroup.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "New Test Group",
        type: "FAMILY",
        clinician_id: "clinician-1",
      }),
    });
  });

  it("POST /api/client/group should return 400 for missing required fields", async () => {
    const incompleteData = {
      name: "Test Group",
      // Missing type and clinician_id
    };

    const req = createRequestWithBody("/api/client/group", incompleteData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });
});
