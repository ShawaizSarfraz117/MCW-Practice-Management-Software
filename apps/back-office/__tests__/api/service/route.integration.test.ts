import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST, PUT } from "@/api/service/route";
import {
  PracticeServiceFactory,
  PracticeServicePrismaFactory,
} from "@mcw/database/mock-data";

describe("Service API Integration Tests", () => {
  afterAll(async () => {
    await prisma.practiceService.deleteMany();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/service should return services", async () => {
    const service = await PracticeServicePrismaFactory.create();
    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual([
      expect.objectContaining({
        id: service.id,
        type: service.type,
        code: service.code,
        description: service.description,
        rate: service.rate.toString(),
        duration: service.duration,
      }),
    ]);
  });

  it("POST /api/service should create services", async () => {
    const payload = PracticeServiceFactory.build();

    const request = createRequestWithBody("/api/service", payload);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({
      type: payload.type,
      code: payload.code,
      description: payload.description,
      rate: payload.rate.toString(),
      duration: payload.duration,
    });
  });

  it("POST /api/service should return 400 for invalid payload", async () => {
    const request = createRequestWithBody("/api/service", { not: "valid" });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("PUT /api/service should update a service", async () => {
    const service = await PracticeServicePrismaFactory.create();
    const updateData = {
      id: service.id,
      type: "GROUP",
      code: "GT101",
      description: "Group therapy session",
      rate: 200.0,
      duration: 90,
    };

    const request = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: service.id,
      type: updateData.type,
      code: updateData.code,
      description: updateData.description,
      rate: updateData.rate.toString(),
      duration: updateData.duration,
    });
  });

  it("DELETE /api/service/?id=<id> should delete a service", async () => {
    const service = await PracticeServicePrismaFactory.create();

    const request = createRequest(`/api/service/?id=${service.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(request);

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
});
