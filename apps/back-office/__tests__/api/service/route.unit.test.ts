import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/service/route";
import prismaMock from "@mcw/database/mock";
import { PracticeServiceFactory } from "@mcw/database/mock-data";

describe("Service API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/service should return all services", async () => {
    const service1 = PracticeServiceFactory.build();
    const service2 = PracticeServiceFactory.build();
    const services = [service1, service2];

    prismaMock.practiceService.findMany.mockResolvedValueOnce(services);

    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(services.length);
    expect(json[0]).toMatchObject({
      id: service1.id,
      type: service1.type,
      code: service1.code,
      duration: service1.duration,
      rate: service1.rate.toString(),
    });
    expect(json[1]).toMatchObject({
      id: service2.id,
      type: service2.type,
      code: service2.code,
      duration: service2.duration,
      rate: service2.rate.toString(),
    });

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
    const serviceData = PracticeServiceFactory.build();
    const { id, rate, ...createData } = serviceData;
    const newService = PracticeServiceFactory.build(serviceData);

    prismaMock.practiceService.create.mockResolvedValueOnce(newService);

    const req = createRequestWithBody("/api/service", {
      ...serviceData,
      rate: rate.toString(),
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toMatchObject({
      type: serviceData.type,
      code: serviceData.code,
      duration: serviceData.duration,
      rate: rate.toString(),
    });

    expect(prismaMock.practiceService.create).toHaveBeenCalledWith({
      data: {
        ...createData,
        rate: rate.toString(),
      },
    });
  });

  it("PUT /api/service should update an existing service", async () => {
    const existingService = PracticeServiceFactory.build();
    const updateData = PracticeServiceFactory.build();
    const { id, rate, ...updateDataWithoutId } = updateData;
    const updatedService = PracticeServiceFactory.build(updateData);

    prismaMock.practiceService.findUnique.mockResolvedValueOnce(
      existingService,
    );
    prismaMock.practiceService.update.mockResolvedValueOnce(updatedService);

    const req = createRequestWithBody(
      "/api/service",
      {
        ...updateData,
        id: existingService.id,
        rate: rate.toString(),
      },
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      type: updateData.type,
      code: updateData.code,
      duration: updateData.duration,
      rate: rate.toString(),
    });

    expect(prismaMock.practiceService.update).toHaveBeenCalledWith({
      where: { id: existingService.id },
      data: {
        ...updateDataWithoutId,
        rate: rate.toString(),
      },
    });
  });

  it("DELETE /api/service/?id=<id> should delete a service", async () => {
    const service = PracticeServiceFactory.build();
    const deletedService = PracticeServiceFactory.build();

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
    expect(json.service).toMatchObject({
      id: deletedService.id,
      type: deletedService.type,
      code: deletedService.code,
      duration: deletedService.duration,
      rate: deletedService.rate.toString(),
    });

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
