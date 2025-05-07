/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/location/route";
import prismaMock from "@mcw/database/mock";

describe("Location API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockLocation = (overrides = {}) => ({
    id: "test-id",
    name: "Test Location",
    address: "123 Test Street",
    is_active: true,
    created_at: new Date(),
    street: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zip: "12345",
    color: "#000000",
    ...overrides,
  });

  it("GET /api/location should return all locations", async () => {
    const location1 = mockLocation({ id: "1" });
    const location2 = mockLocation({ id: "2", name: "Second Location" });
    const locations = [location1, location2];

    prismaMock.location.findMany.mockResolvedValueOnce(locations);

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(locations.length);
    expect(json[0]).toHaveProperty("id", location1.id);
    expect(json[1]).toHaveProperty("id", location2.id);

    expect(prismaMock.location.findMany).toHaveBeenCalledWith({});
  });

  it("POST /api/location should create a new location", async () => {
    const newLocation = mockLocation();

    prismaMock.location.create.mockResolvedValueOnce(newLocation);

    const locationData = {
      name: "Test Location",
      address: "123 Test Street",
      is_active: true,
    };

    const req = createRequestWithBody("/api/location", locationData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toHaveProperty("name", "Test Location");
    expect(json).toHaveProperty("address", "123 Test Street");
    expect(json).toHaveProperty("is_active", true);

    expect(prismaMock.location.create).toHaveBeenCalledWith({
      data: {
        name: "Test Location",
        address: "123 Test Street",
        is_active: true,
      },
    });
  });

  it("POST /api/location should return 400 if required fields are missing", async () => {
    const invalidData = {
      name: "Test Location",
      // address is missing
    };

    const req = createRequestWithBody("/api/location", invalidData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");

    expect(prismaMock.location.create).not.toHaveBeenCalled();
  });

  it("PUT /api/location should update an existing location", async () => {
    const existingLocation = mockLocation();
    const updatedLocation = mockLocation({
      name: "Updated Location",
      address: "456 New Street",
    });

    prismaMock.location.findUnique.mockResolvedValueOnce(existingLocation);
    prismaMock.location.update.mockResolvedValueOnce(updatedLocation);

    const updateData = {
      id: existingLocation.id,
      name: "Updated Location",
      address: "456 New Street",
      is_active: true,
    };

    const req = createRequestWithBody("/api/location", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("name", "Updated Location");
    expect(json).toHaveProperty("address", "456 New Street");

    expect(prismaMock.location.update).toHaveBeenCalledWith({
      where: { id: existingLocation.id },
      data: {
        name: "Updated Location",
        address: "456 New Street",
        is_active: true,
      },
    });
  });

  it("PUT /api/location should return 400 if id is missing", async () => {
    const updateData = {
      name: "Updated Location",
      address: "456 New Street",
      // id is missing
    };

    const req = createRequestWithBody("/api/location", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Location ID is required");

    expect(prismaMock.location.update).not.toHaveBeenCalled();
  });

  it("PUT /api/location should return 404 for non-existent location", async () => {
    prismaMock.location.findUnique.mockResolvedValueOnce(null);

    const updateData = {
      id: "non-existent-id",
      name: "Updated Location",
      address: "456 New Street",
    };

    const req = createRequestWithBody("/api/location", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Location not found");

    expect(prismaMock.location.update).not.toHaveBeenCalled();
  });

  it("DELETE /api/location/?id=<id> should deactivate a location", async () => {
    const location = mockLocation();
    const deactivatedLocation = mockLocation({ is_active: false });

    prismaMock.location.findUnique.mockResolvedValueOnce(location);
    prismaMock.location.update.mockResolvedValueOnce(deactivatedLocation);

    const req = createRequest(`/api/location/?id=${location.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Location deactivated successfully");
    expect(json.location).toHaveProperty("is_active", false);

    expect(prismaMock.location.update).toHaveBeenCalledWith({
      where: { id: location.id },
      data: { is_active: false },
    });
  });

  it("DELETE /api/location/?id=<id> should return 400 if id is missing", async () => {
    const req = createRequest("/api/location/", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Location ID is required");

    expect(prismaMock.location.update).not.toHaveBeenCalled();
  });

  it("DELETE /api/location/?id=<id> should return 404 for non-existent location", async () => {
    prismaMock.location.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/location/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Location not found");

    expect(prismaMock.location.update).not.toHaveBeenCalled();
  });
});
