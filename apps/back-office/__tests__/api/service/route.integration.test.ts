import { describe, it, expect, afterEach } from "vitest";
import type { PracticeService } from "@mcw/database";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/service/route";

// Helper function to clean up services
async function cleanupServices(serviceIds: string[]) {
  if (!serviceIds || serviceIds.length === 0) return;
  try {
    // Delete related data first (e.g., ClinicianServices)
    await prisma.clinicianServices.deleteMany({
      where: { service_id: { in: serviceIds } },
    });
    // Then delete the services themselves
    await prisma.practiceService.deleteMany({
      where: { id: { in: serviceIds } },
    });
  } catch (error) {
    console.error("Error cleaning up services:", error);
  }
}

// eslint-disable-next-line max-lines-per-function
describe("Service API Integration Tests", () => {
  let createdServiceIds: string[] = [];

  afterEach(async () => {
    await cleanupServices(createdServiceIds);
    createdServiceIds = []; // Reset after cleanup
  });

  it("GET /api/service should return all services", async () => {
    const servicesData = [
      {
        type: "Therapy Session",
        code: "THERAPY-001",
        duration: 60,
        rate: 175.0,
        description: "Standard therapy session",
        color: "#4CAF50", // Green
      },
      {
        type: "Consultation",
        code: "CONSULT-001",
        duration: 30,
        rate: 120.0,
        description: "Initial consultation",
        color: "#2196F3", // Blue
      },
    ];
    const createdServices = await Promise.all(
      servicesData.map((data) => prisma.practiceService.create({ data })),
    );
    createdServiceIds = createdServices.map((srv) => srv.id); // Store IDs

    const req = createRequest("/api/service");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(servicesData.length);

    servicesData.forEach((data, index) => {
      const foundService = json.find(
        (s: PracticeService) => s.id === createdServices[index].id,
      );
      expect(foundService).toBeDefined();
      expect(foundService).toHaveProperty("id", createdServices[index].id);
      expect(foundService).toHaveProperty("type", data.type);
      expect(foundService).toHaveProperty("code", data.code);
      expect(foundService).toHaveProperty("duration", data.duration);
    });
  });

  it("GET /api/service/?id=<id> should return a specific service", async () => {
    const service = await prisma.practiceService.create({
      data: {
        type: "Therapy Session",
        code: "THERAPY-001",
        duration: 60,
        rate: 175.0,
        description: "Standard therapy session",
        color: "#4CAF50", // Green
      },
    });
    createdServiceIds.push(service.id); // Store ID

    const req = createRequest(`/api/service/?id=${service.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("id", service.id);
    expect(json).toHaveProperty("type", service.type);
    expect(json).toHaveProperty("code", service.code);
    expect(json).toHaveProperty("duration", service.duration);
    expect(json).toHaveProperty("rate");
    expect(String(json.rate)).toBe(String(service.rate));
  });

  it("GET /api/service/?id=<id> should return 500 for non-existent service", async () => {
    const req = createRequest("/api/service/?id=non-existent-id");
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  it("POST /api/service should create a new service", async () => {
    const serviceData = {
      type: "Group Session",
      code: "GROUP-001",
      duration: 90,
      rate: 150.0,
      description: "Group therapy session",
      color: "#FFC107", // Amber
    };

    const req = createRequestWithBody("/api/service", serviceData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    createdServiceIds.push(json.id); // Store ID

    expect(json).toHaveProperty("type", serviceData.type);
    expect(json).toHaveProperty("code", serviceData.code);
    expect(json).toHaveProperty("duration", serviceData.duration);
    expect(json).toHaveProperty("rate");
    expect(String(json.rate)).toBe(String(serviceData.rate));

    // Verify the service was actually created in the database
    const createdService = await prisma.practiceService.findUnique({
      where: { id: json.id },
    });
    expect(createdService).not.toBeNull();
    expect(createdService).toHaveProperty("type", serviceData.type);
    expect(createdService).toHaveProperty("code", serviceData.code);
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
  });

  it("PUT /api/service should update an existing service", async () => {
    const service = await prisma.practiceService.create({
      data: {
        type: "Original Service",
        code: "ORIG-001",
        duration: 45,
        rate: 130.0,
        description: "Original description",
        color: "#9C27B0", // Purple
      },
    });
    createdServiceIds.push(service.id); // Store ID

    const updateData = {
      id: service.id,
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 60,
      rate: 150.0,
      description: "Updated description",
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
    expect(json).toHaveProperty("description", updateData.description);

    // Verify the service was actually updated in the database
    const updatedService = await prisma.practiceService.findUnique({
      where: { id: service.id },
    });
    expect(updatedService).toHaveProperty("type", updateData.type);
    expect(updatedService).toHaveProperty("code", updateData.code);
    expect(updatedService).toHaveProperty("duration", updateData.duration);
  });

  it("PUT /api/service should return 500 for non-existent service", async () => {
    const updateData = {
      id: "non-existent-id",
      type: "Updated Service",
      code: "UPDATE-001",
      duration: 60,
    };

    const req = createRequestWithBody("/api/service", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  it("DELETE /api/service/?id=<id> should delete a service", async () => {
    const service = await prisma.practiceService.create({
      data: {
        type: "Temporary Service",
        code: "TEMP-001",
        duration: 30,
        rate: 100.0,
        description: "Temporary service to be deleted",
        color: "#E91E63", // Pink
      },
    });

    const req = createRequest(`/api/service/?id=${service.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Service deleted successfully");
    expect(json.service).toHaveProperty("id", service.id);

    // Verify the service was actually deleted from the database
    const deletedService = await prisma.practiceService.findUnique({
      where: { id: service.id },
    });
    expect(deletedService).toBeNull();
  });

  it("DELETE /api/service/?id=<id> should return 500 for non-existent service", async () => {
    const req = createRequest("/api/service/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });
});
