import { describe, it, expect, beforeEach } from "vitest";
import type { PracticeService } from "@mcw/database";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST, PUT } from "@/api/service/route";
import { Prisma } from "@prisma/client";

describe("Service API Integration Tests", () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.$transaction([
      prisma.appointment.deleteMany(),
      prisma.clinicianServices.deleteMany(),
      prisma.practiceService.deleteMany(),
    ]);
  });

  const defaultServiceData = {
    type: "INDIVIDUAL",
    code: "IT101",
    description: "One-on-one therapy session",
    rate: new Prisma.Decimal(150.0),
    duration: 50,
    color: "#FF5733",
    is_default: false,
    bill_in_units: false,
    available_online: true,
    allow_new_clients: true,
    require_call: false,
    block_before: 0,
    block_after: 0,
  };

  it("GET /api/service should return all services", async () => {
    const services = await Promise.all([
      prisma.practiceService.create({ data: defaultServiceData }),
      prisma.practiceService.create({
        data: {
          ...defaultServiceData,
          type: "GROUP",
          code: "GT101",
          description: "Group therapy session",
          rate: new Prisma.Decimal(100.0),
          duration: 90,
          color: "#33FF57",
        },
      }),
    ]);

    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(services.length);

    services.forEach((service: PracticeService) => {
      const foundService = json.find(
        (s: PracticeService) => s.id === service.id,
      );
      expect(foundService).toBeDefined();
      expect(foundService).toMatchObject({
        id: service.id,
        type: service.type,
        code: service.code,
        description: service.description,
        duration: service.duration,
        color: service.color,
        is_default: service.is_default,
        bill_in_units: service.bill_in_units,
        available_online: service.available_online,
        allow_new_clients: service.allow_new_clients,
        require_call: service.require_call,
        block_before: service.block_before,
        block_after: service.block_after,
      });
      expect(foundService.rate.toString()).toBe(service.rate.toString());
    });
  });

  it("GET /api/service/?id=<id> should return a specific service", async () => {
    const service = await prisma.practiceService.create({
      data: defaultServiceData,
    });

    const req = createRequest(`/api/service/?id=${service.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      id: service.id,
      type: service.type,
      code: service.code,
      description: service.description,
      duration: service.duration,
      color: service.color,
      is_default: service.is_default,
      bill_in_units: service.bill_in_units,
      available_online: service.available_online,
      allow_new_clients: service.allow_new_clients,
      require_call: service.require_call,
      block_before: service.block_before,
      block_after: service.block_after,
    });
    expect(json.rate.toString()).toBe(service.rate.toString());
  });

  it("POST /api/service should create a new service", async () => {
    const serviceData = {
      type: "FAMILY",
      code: "FT101",
      description: "Family counseling session",
      rate: 200.0,
      duration: 90,
      color: "#5733FF",
      is_default: false,
      bill_in_units: true,
      available_online: false,
      allow_new_clients: true,
      require_call: true,
      block_before: 15,
      block_after: 15,
    };

    const req = createRequestWithBody("/api/service", serviceData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toMatchObject({
      type: serviceData.type,
      code: serviceData.code,
      description: serviceData.description,
      duration: serviceData.duration,
      color: serviceData.color,
      is_default: serviceData.is_default,
      bill_in_units: serviceData.bill_in_units,
      available_online: serviceData.available_online,
      allow_new_clients: serviceData.allow_new_clients,
      require_call: serviceData.require_call,
      block_before: serviceData.block_before,
      block_after: serviceData.block_after,
    });
    expect(parseFloat(json.rate)).toBe(serviceData.rate);
  });

  it("POST /api/service should return 400 for missing required fields", async () => {
    const invalidData = {
      description: "Invalid service",
      color: "#FF0000",
    };

    const req = createRequestWithBody("/api/service", invalidData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");
  });

  it("PUT /api/service should update an existing service", async () => {
    const service = await prisma.practiceService.create({
      data: defaultServiceData,
    });

    const updateData = {
      id: service.id,
      type: "UPDATED",
      code: "UT101",
      description: "Updated therapy session",
      rate: 175.0,
      duration: 75,
      color: "#33FF57",
      is_default: true,
      bill_in_units: true,
      available_online: false,
      allow_new_clients: false,
      require_call: true,
      block_before: 30,
      block_after: 30,
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      id: service.id,
      type: updateData.type,
      code: updateData.code,
      description: updateData.description,
      duration: updateData.duration,
      color: updateData.color,
      is_default: updateData.is_default,
      bill_in_units: updateData.bill_in_units,
      available_online: updateData.available_online,
      allow_new_clients: updateData.allow_new_clients,
      require_call: updateData.require_call,
      block_before: updateData.block_before,
      block_after: updateData.block_after,
    });
    expect(parseFloat(json.rate)).toBe(updateData.rate);
  });

  it("PUT /api/service should return 400 when id is missing", async () => {
    const updateData = {
      type: "UPDATED",
      code: "UT101",
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service ID is required");
  });

  it("DELETE /api/service/?id=<id> should delete a service", async () => {
    const service = await prisma.practiceService.create({
      data: defaultServiceData,
    });

    const req = createRequest(`/api/service/?id=${service.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Service deleted successfully");
    expect(json).toHaveProperty("service");
    expect(json.service).toHaveProperty("id", service.id);

    // Verify the service was actually deleted
    const deletedService = await prisma.practiceService.findUnique({
      where: { id: service.id },
    });
    expect(deletedService).toBeNull();
  });

  it("DELETE /api/service/?id=<id> should return 404 for non-existent service", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const req = createRequest(`/api/service/?id=${nonExistentId}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service not found");
  });
});
