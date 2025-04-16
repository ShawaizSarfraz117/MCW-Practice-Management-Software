/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/service/route";
import prismaMock from "@mcw/database/mock";
import type { Decimal } from "@prisma/client/runtime/library";

// Mock Decimal for testing
const mockDecimal = (value: number) =>
  ({
    toString: () => String(value),
    toNumber: () => value,
    equals: (other: number | string | { toNumber?: () => number }) =>
      value === (typeof other === "number" ? other : Number(other)),
  }) as unknown as Decimal;

describe("Service API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockService = (overrides = {}) => ({
    id: "test-id",
    type: "Therapy Session",
    code: "THERAPY-001",
    duration: 60,
    rate: mockDecimal(175.0),
    description: "Standard therapy session",
    color: "#4CAF50",
    created_at: new Date(),
    ...overrides,
  });

  it("GET /api/service should return all services", async () => {
    const service1 = mockService({ id: "1" });
    const service2 = mockService({ id: "2", type: "Consultation" });
    const services = [service1, service2];

    prismaMock.practiceService.findMany.mockResolvedValueOnce(services);

    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(services.length);
    expect(json[0]).toHaveProperty("id", service1.id);
    expect(json[1]).toHaveProperty("id", service2.id);

    expect(prismaMock.practiceService.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        type: true,
        code: true,
        duration: true,
        description: true,
        rate: true,
      },
    });
  });

  it("GET /api/service/?id=<id> should return a specific service", async () => {
    const service = mockService();

    prismaMock.practiceService.findUnique.mockResolvedValueOnce(service);

    const req = createRequest("/api/service/?id=test-id");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("id", service.id);
    expect(json).toHaveProperty("type", service.type);
    expect(json).toHaveProperty("code", service.code);
    expect(json).toHaveProperty("duration", service.duration);
    expect(json).toHaveProperty("rate");
    if (typeof json.rate === "string") {
      expect(json.rate).toBe("175");
    } else if (typeof json.rate === "number") {
      expect(json.rate).toBe(175);
    }

    expect(prismaMock.practiceService.findUnique).toHaveBeenCalledWith({
      where: { id: "test-id" },
      include: {
        ClinicianServices: {
          include: {
            Clinician: true,
          },
        },
      },
    });
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
    const newService = mockService();

    prismaMock.practiceService.create.mockResolvedValueOnce(newService);

    const serviceData = {
      type: "Therapy Session",
      code: "THERAPY-001",
      duration: 60,
      rate: 175.0,
      description: "Standard therapy session",
      color: "#4CAF50",
    };

    const req = createRequestWithBody("/api/service", serviceData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toHaveProperty("type", serviceData.type);
    expect(json).toHaveProperty("code", serviceData.code);
    expect(json).toHaveProperty("duration", serviceData.duration);
    expect(json).toHaveProperty("rate");
    if (typeof json.rate === "string") {
      expect(json.rate).toBe("175");
    } else if (typeof json.rate === "number") {
      expect(json.rate).toBe(175);
    }

    expect(prismaMock.practiceService.create).toHaveBeenCalledWith({
      data: {
        type: serviceData.type,
        code: serviceData.code,
        duration: serviceData.duration,
        rate: serviceData.rate,
      },
    });
  });

  it("POST /api/service should return 400 if required fields are missing", async () => {
    const incompleteData = {
      type: "Incomplete Service",
      // code and duration are missing
    };

    const req = createRequestWithBody("/api/service", incompleteData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");

    expect(prismaMock.practiceService.create).not.toHaveBeenCalled();
  });

  it("PUT /api/service should update an existing service", async () => {
    const existingService = mockService();
    const updatedService = mockService({
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 90,
    });

    prismaMock.practiceService.findUnique.mockResolvedValueOnce(
      existingService,
    );
    prismaMock.practiceService.update.mockResolvedValueOnce(updatedService);

    const updateData = {
      id: existingService.id,
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 90,
      rate: 175.0,
      description: "Updated description",
      color: "#2196F3",
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("type", updateData.type);
    expect(json).toHaveProperty("code", updateData.code);
    expect(json).toHaveProperty("duration", updateData.duration);

    expect(prismaMock.practiceService.update).toHaveBeenCalledWith({
      where: { id: existingService.id },
      data: {
        type: updateData.type,
        code: updateData.code,
        duration: updateData.duration,
        rate: updateData.rate,
        description: updateData.description,
      },
    });
  });

  it("PUT /api/service should return 400 if id is missing", async () => {
    const updateData = {
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 90,
      // id is missing
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service ID is required");

    expect(prismaMock.practiceService.update).not.toHaveBeenCalled();
  });

  it("PUT /api/service should return 404 for non-existent service", async () => {
    prismaMock.practiceService.findUnique.mockResolvedValueOnce(null);

    const updateData = {
      id: "non-existent-id",
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 90,
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service not found");

    expect(prismaMock.practiceService.update).not.toHaveBeenCalled();
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
    expect(json.service).toHaveProperty("id", service.id);

    expect(prismaMock.practiceService.delete).toHaveBeenCalledWith({
      where: { id: service.id },
    });
  });

  it("DELETE /api/service/?id=<id> should return 400 if id is missing", async () => {
    const req = createRequest("/api/service/", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Service ID is required");

    expect(prismaMock.practiceService.delete).not.toHaveBeenCalled();
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

    expect(prismaMock.practiceService.delete).not.toHaveBeenCalled();
  });
});
