import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/availability/route";
import prismaMock from "@mcw/database/mock";
import { getServerSession } from "next-auth";

// Mock next-auth getServerSession
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Minimal mock for related entities
const mockClinician = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  first_name: "Jane",
  last_name: "Doe",
};

// Helper to build a minimal availability with all required fields
const mockAvailability = (overrides = {}) => ({
  id: "availability-id",
  clinician_id: mockClinician.id,
  title: "Available Slot",
  allow_online_requests: false,
  location: "Main Office",
  start_date: new Date(),
  end_date: new Date(Date.now() + 3600000),
  start_time: new Date(),
  end_time: new Date(Date.now() + 3600000),
  is_recurring: false,
  recurring_rule: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe("Availability API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "test-user-id" },
    });
  });

  it("GET /api/availability should return all availabilities", async () => {
    const avail1 = mockAvailability({ id: "1" });
    const avail2 = mockAvailability({ id: "2" });
    prismaMock.availability.findMany.mockResolvedValueOnce([avail1, avail2]);

    const req = createRequest("/api/availability");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0]).toHaveProperty("id", avail1.id);
    expect(json[1]).toHaveProperty("id", avail2.id);
  });

  it("GET /api/availability/?id=<id> should return 404 for non-existent availability", async () => {
    prismaMock.availability.findUnique.mockResolvedValueOnce(null);
    const req = createRequest("/api/availability/?id=non-existent-id");
    const response = await GET(req);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability not found");
  });

  it("POST /api/availability should create a new availability", async () => {
    const newAvail = mockAvailability();
    prismaMock.availability.create.mockResolvedValueOnce(newAvail);

    const availData = {
      clinician_id: mockClinician.id,
      title: "Available Slot",
      allow_online_requests: false,
      location: "Main Office",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      is_recurring: false,
      recurring_rule: null,
    };
    const req = createRequestWithBody("/api/availability", availData);
    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id", newAvail.id);
    expect(json).toHaveProperty("title", availData.title);
  });

  it("PUT /api/availability should update an existing availability", async () => {
    const existing = mockAvailability();
    const updated = mockAvailability({ title: "Updated Slot" });
    prismaMock.availability.update.mockResolvedValueOnce(updated);

    const updateData = {
      title: "Updated Slot",
    };
    const req = createRequestWithBody(
      "/api/availability?id=" + existing.id,
      updateData,
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Updated Slot");
  });

  it("DELETE /api/availability/?id=<id> should delete an availability", async () => {
    prismaMock.availability.delete.mockResolvedValueOnce(mockAvailability());
    const req = createRequest(`/api/availability/?id=availability-id`, {
      method: "DELETE",
    });
    const response = await DELETE(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
  });

  it("DELETE /api/availability/?id=<id> should return 400 for missing id", async () => {
    const req = createRequest(`/api/availability`, { method: "DELETE" });
    const response = await DELETE(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability ID is required");
  });
});
