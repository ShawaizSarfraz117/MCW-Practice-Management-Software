import { describe, it, expect, afterEach } from "vitest";
import type { Location } from "@mcw/database";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/location/route";

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
  });

  it("GET /api/location should return all locations", async () => {
    const locationsData = [
      {
        name: "Main Office",
        address: "123 Main Street",
        is_active: true,
      },
      {
        name: "Branch Office",
        address: "456 Branch Avenue",
        is_active: true,
      },
    ];
    const createdLocations = await Promise.all(
      locationsData.map((data) => prisma.location.create({ data })),
    );
    createdLocationIds = createdLocations.map((loc) => loc.id); // Store IDs

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(createdLocations.length);

    createdLocations.forEach((location: Location) => {
      const foundLocation = json.find((l: Location) => l.id === location.id);
      expect(foundLocation).toBeDefined();
      expect(foundLocation).toHaveProperty("id", location.id);
      expect(foundLocation).toHaveProperty("name", location.name);
      expect(foundLocation).toHaveProperty("address", location.address);
      expect(foundLocation).toHaveProperty("is_active", location.is_active);
    });
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
