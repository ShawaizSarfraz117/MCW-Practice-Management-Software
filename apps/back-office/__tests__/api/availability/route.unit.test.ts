import { vi, Mock } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/availability/route";
import { NextRequest } from "next/server";

// Set up mock values
const MOCK_CLINICIAN_ID = "123e4567-e89b-12d3-a456-426614174000";
const MOCK_AVAILABILITY_ID = "123e4567-e89b-12d3-a456-426614174001";
const MOCK_LOCATION_ID = "123e4567-e89b-12d3-a456-426614174002";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Mock the database operations
vi.mock("@mcw/database", () => {
  const availabilityFindManyMock = vi.fn();
  const availabilityFindUniqueMock = vi.fn();
  const availabilityCreateMock = vi.fn();
  const availabilityUpdateMock = vi.fn();
  const availabilityDeleteMock = vi.fn();

  return {
    prisma: {
      availability: {
        findMany: availabilityFindManyMock,
        findUnique: availabilityFindUniqueMock,
        create: availabilityCreateMock,
        update: availabilityUpdateMock,
        delete: availabilityDeleteMock,
      },
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";

// Define the authenticated request interface to match what's in the routes
interface AuthenticatedRequest extends NextRequest {
  nextauth?: {
    token?: unknown;
  };
}

// Minimal mock for related entities
const mockClinician = {
  id: MOCK_CLINICIAN_ID,
  first_name: "Jane",
  last_name: "Doe",
};

// Helper to build a minimal availability with all required fields
const mockAvailability = (overrides = {}) => ({
  id: MOCK_AVAILABILITY_ID,
  clinician_id: mockClinician.id,
  title: "Available Slot",
  allow_online_requests: false,
  location_id: MOCK_LOCATION_ID,
  start_date: new Date(),
  end_date: new Date(Date.now() + 3600000),
  is_recurring: false,
  recurring_rule: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// Create a request with authentication
const createAuthRequest = (
  url: string,
  method = "GET",
  body?: Record<string, unknown>,
): AuthenticatedRequest => {
  // Create a base request
  const baseUrl = new URL(url, "http://localhost");
  const req = new Request(baseUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Add nextauth token
  const authReq = req as AuthenticatedRequest;
  authReq.nextauth = {
    token: { sub: "test-user-id" },
  };

  // Add necessary properties for NextRequest
  Object.defineProperty(authReq, "nextUrl", {
    get: () => baseUrl,
  });

  return authReq;
};

describe("Availability API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/availability should return all availabilities", async () => {
    const avail1 = mockAvailability({ id: "1" });
    const avail2 = mockAvailability({ id: "2" });

    // Mock the database response using the mocked module
    (prisma.availability.findMany as unknown as Mock).mockResolvedValue([
      avail1,
      avail2,
    ]);

    const req = createAuthRequest("/api/availability");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0]).toHaveProperty("id", avail1.id);
    expect(json[1]).toHaveProperty("id", avail2.id);
  });

  it("GET /api/availability/?id=<id> should return 404 for non-existent availability", async () => {
    (prisma.availability.findUnique as unknown as Mock).mockResolvedValue(null);
    const req = createAuthRequest("/api/availability?id=non-existent-id");
    const response = await GET(req);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability not found");
  });

  it("POST /api/availability should create a new availability", async () => {
    const newAvail = mockAvailability();
    (prisma.availability.create as unknown as Mock).mockResolvedValue(newAvail);

    const availData = {
      clinician_id: mockClinician.id,
      title: "Available Slot",
      allow_online_requests: false,
      location_id: MOCK_LOCATION_ID,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      is_recurring: false,
      recurring_rule: null,
    };

    const req = createAuthRequest("/api/availability", "POST", availData);
    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id", newAvail.id);
    expect(json).toHaveProperty("title", availData.title);
    expect(json).toHaveProperty("clinician_id", availData.clinician_id);
    expect(json).toHaveProperty("location_id", availData.location_id);
  });

  it("PUT /api/availability should update an existing availability", async () => {
    const existing = mockAvailability();
    const updated = mockAvailability({ title: "Updated Slot" });
    (prisma.availability.update as unknown as Mock).mockResolvedValue(updated);

    const updateData = {
      title: "Updated Slot",
    };
    const req = createAuthRequest(
      `/api/availability?id=${existing.id}`,
      "PUT",
      updateData,
    );
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Updated Slot");
  });

  it("DELETE /api/availability/?id=<id> should delete an availability", async () => {
    (prisma.availability.delete as unknown as Mock).mockResolvedValue(
      mockAvailability(),
    );
    const req = createAuthRequest(
      "/api/availability?id=availability-id",
      "DELETE",
    );
    const response = await DELETE(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
  });

  it("DELETE /api/availability/?id=<id> should return 400 for missing id", async () => {
    const req = createAuthRequest("/api/availability", "DELETE");
    const response = await DELETE(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability ID is required");
  });

  it("should return 401 if not authenticated", async () => {
    // Create an unauthenticated request (no nextauth property)
    const unauthReq = new Request(
      "http://localhost/api/availability",
    ) as AuthenticatedRequest;

    // Test all endpoints for authentication check
    const getRes = await GET(unauthReq);
    expect(getRes.status).toBe(401);

    const postRes = await POST(unauthReq);
    expect(postRes.status).toBe(401);

    const putRes = await PUT(unauthReq);
    expect(putRes.status).toBe(401);

    const deleteRes = await DELETE(unauthReq);
    expect(deleteRes.status).toBe(401);
  });
});
