import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/service/route";
import prismaMock from "@mcw/database/mock";
import { Prisma } from "@prisma/client";

describe("Service API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockService = (overrides = {}) => ({
    id: "test-id",
    type: "Individual Therapy",
    code: "IT101",
    duration: 50,
    rate: new Prisma.Decimal("150.00"),
    description: "One-on-one therapy session",
    color: "#FF5733",
    is_default: false,
    bill_in_units: false,
    available_online: true,
    allow_new_clients: true,
    require_call: false,
    block_before: 0,
    block_after: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  it("GET /api/service should return all services", async () => {
    const service1 = mockService({ id: "1" });
    const service2 = mockService({ id: "2", type: "Group Therapy" });
    const services = [service1, service2];

    prismaMock.practiceService.findMany.mockResolvedValueOnce(services);

    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(services.length);
    expect(json[0]).toHaveProperty("id", service1.id);
    expect(json[1]).toHaveProperty("id", service2.id);

    expect(prismaMock.practiceService.findMany).toHaveBeenCalled();
  });

  it("GET /api/service/?id=<id> should return 404 for non-existent service", async () => {
    prismaMock.practiceService.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/service/?id=non-existent-id");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service not found");
  });

  it("POST /api/service should create a new service", async () => {
    const newService = mockService({
      type: "Family Therapy",
      code: "FT101",
      duration: 90,
      rate: new Prisma.Decimal("200.00"),
    });

    prismaMock.practiceService.create.mockResolvedValueOnce(newService);

    const serviceData = {
      type: "Family Therapy",
      code: "FT101",
      duration: 90,
      rate: 200.0, // API accepts number, converts to Decimal internally
      description: "Family counseling session",
      color: "#FF5733",
      is_default: false,
      bill_in_units: false,
      available_online: true,
      allow_new_clients: true,
      require_call: false,
    };

    const req = createRequestWithBody("/api/service", serviceData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toHaveProperty("type", "Family Therapy");
    expect(json).toHaveProperty("code", "FT101");
    expect(json).toHaveProperty("duration", 90);
    // Use toMatch for rate to handle decimal precision
    expect(json.rate.toString()).toMatch(/^200\.?0*$/);

    expect(prismaMock.practiceService.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "Family Therapy",
        code: "FT101",
        duration: 90,
        rate: 200.0,
      }),
    });
  });

  it("PUT /api/service should update an existing service", async () => {
    const existingService = mockService();
    const updatedService = mockService({
      type: "Updated Therapy",
      code: "UT101",
      duration: 60,
      rate: new Prisma.Decimal("175.00"),
    });

    prismaMock.practiceService.findUnique.mockResolvedValueOnce(
      existingService,
    );
    prismaMock.practiceService.update.mockResolvedValueOnce(updatedService);

    const updateData = {
      id: existingService.id,
      type: "Updated Therapy",
      code: "UT101",
      duration: 60,
      rate: 175.0, // API accepts number, converts to Decimal internally
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("type", "Updated Therapy");
    expect(json).toHaveProperty("code", "UT101");
    expect(json).toHaveProperty("duration", 60);
    // Use toMatch for rate to handle decimal precision
    expect(json.rate.toString()).toMatch(/^175\.?0*$/);

    expect(prismaMock.practiceService.update).toHaveBeenCalledWith({
      where: { id: existingService.id },
      data: expect.objectContaining({
        type: "Updated Therapy",
        code: "UT101",
        duration: 60,
        rate: 175.0,
      }),
    });
  });

  it("DELETE /api/service/?id=<id> should delete a service", async () => {
    const service = mockService();
    const deletedService = mockService();

    prismaMock.practiceService.findUnique.mockResolvedValueOnce(service);
    prismaMock.practiceService.delete.mockResolvedValueOnce(deletedService);

    const req = createRequest(`/api/service/?id=${service.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Service deleted successfully");
    expect(json).toHaveProperty("service");

    expect(prismaMock.practiceService.delete).toHaveBeenCalledWith({
      where: { id: service.id },
    });
  });

  it("DELETE /api/service/?id=<id> should return 404 for non-existent service", async () => {
    prismaMock.practiceService.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/service/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service not found");
  });
});
