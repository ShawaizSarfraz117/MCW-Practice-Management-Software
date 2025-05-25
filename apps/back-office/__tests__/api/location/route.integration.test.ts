import { describe, it, expect, afterEach, vi } from "vitest";
import type { Location } from "@mcw/database";
import { prisma } from "@mcw/database";
import { LocationPrismaFactory } from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/location/route";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Helper function to create an authenticated request with the nextauth.token property
function addAuthToRequest(req: ReturnType<typeof createRequest>) {
  // Add nextauth token property to match what the API routes check for
  return Object.assign(req, {
    nextauth: {
      token: { sub: "test-user-id" },
    },
  });
}

// Helper function to clean up locations
async function cleanupLocations(locationIds: string[]) {
  if (!locationIds || locationIds.length === 0) return;
  try {
    // Add deletions for related data if locations have dependencies
    // e.g., await prisma.clinicianLocation.deleteMany({ where: { location_id: { in: locationIds } } });
    await prisma.location.deleteMany({ where: { id: { in: locationIds } } });
  } catch (error) {
    console.error("Error cleaning up locations:", error);
  }
}

describe("Location API Integration Tests", () => {
  let createdLocationIds: string[] = [];

  afterEach(async () => {
    await cleanupLocations(createdLocationIds);
    createdLocationIds = []; // Reset after cleanup
    vi.restoreAllMocks();
  });

  it("GET /api/location should return all locations", async () => {
    // Clean up any existing locations first
    await prisma.location.deleteMany({});

    // Create test locations
    const location1 = await LocationPrismaFactory.create();
    const location2 = await LocationPrismaFactory.create();
    createdLocationIds.push(location1.id, location2.id);

    const req = addAuthToRequest(createRequest("/api/location"));
    const response = await GET(req);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(2);

    const foundIds = json.map((l: Location) => l.id);
    expect(foundIds).toContain(location1.id);
    expect(foundIds).toContain(location2.id);
  });

  it("POST /api/location should create a new location", async () => {
    const locationData = {
      name: "New Office",
      address: "789 New Boulevard",
      is_active: true,
    };

    const req = createRequestWithBody("/api/location", locationData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    createdLocationIds.push(json.id); // Store ID of created location

    expect(json).toHaveProperty("name", locationData.name);
    expect(json).toHaveProperty("address", locationData.address);
    expect(json).toHaveProperty("is_active", locationData.is_active);

    // Verify the location was actually created in the database
    const createdLocation = await prisma.location.findUnique({
      where: { id: json.id },
    });
    expect(createdLocation).not.toBeNull();
    expect(createdLocation).toHaveProperty("name", locationData.name);
  });

  it("POST /api/location should return 400 if required fields are missing", async () => {
    const incompleteData = {
      name: "Incomplete Office",
      // address is missing
    };

    const req = createRequestWithBody("/api/location", incompleteData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");
  });

  it("PUT /api/location should update an existing location", async () => {
    const location = await prisma.location.create({
      data: {
        name: "Original Office",
        address: "123 Original Street",
        is_active: true,
      },
    });
    createdLocationIds.push(location.id); // Store ID

    const updateData = {
      id: location.id,
      name: "Updated Office",
      address: "456 Updated Avenue",
      is_active: true,
    };

    const req = createRequestWithBody("/api/location", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("name", updateData.name);
    expect(json).toHaveProperty("address", updateData.address);
    expect(json).toHaveProperty("is_active", updateData.is_active);

    // Verify the location was actually updated in the database
    const updatedLocation = await prisma.location.findUnique({
      where: { id: location.id },
    });
    expect(updatedLocation).toHaveProperty("name", updateData.name);
    expect(updatedLocation).toHaveProperty("address", updateData.address);
  });

  it("PUT /api/location should return 500 for non-existent location", async () => {
    const updateData = {
      id: "non-existent-id",
      name: "Updated Office",
      address: "456 Updated Avenue",
      is_active: true,
    };

    const req = createRequestWithBody("/api/location", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  it("DELETE /api/location/?id=<id> should deactivate a location", async () => {
    const location = await prisma.location.create({
      data: {
        name: "Temporary Office",
        address: "789 Temporary Lane",
        is_active: true,
      },
    });
    createdLocationIds.push(location.id); // Store ID

    const req = createRequest(`/api/location/?id=${location.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Location deactivated successfully");
    expect(json.location).toHaveProperty("id", location.id);
    expect(json.location).toHaveProperty("is_active", false);

    // Verify the location was actually deactivated in the database
    const deactivatedLocation = await prisma.location.findUnique({
      where: { id: location.id },
    });
    expect(deactivatedLocation).toHaveProperty("is_active", false);
  });

  it("DELETE /api/location/?id=<id> should return 500 for non-existent location", async () => {
    const req = createRequest("/api/location/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });
});
