import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import {
  ClinicianPrismaFactory,
  PracticeServicePrismaFactory,
} from "@mcw/database/mock-data";
import { createRequestWithBody } from "@mcw/utils";

import { PUT } from "@/api/clinician/services/route";

// Helper function to clean the database before each test
async function cleanDatabase() {
  try {
    // Delete records in order of dependency
    await prisma.clinicianServices.deleteMany();
    await prisma.clinician.deleteMany();
    await prisma.practiceService.deleteMany();

    // Skip user deletion as it has foreign key constraints
    // await prisma.user.deleteMany();
  } catch (error) {
    console.error("[Cleanup] Error during database cleanup:", error);
    throw error; // Re-throw the error to fail the test if cleanup fails
  }
}

describe("ClinicianServices API Integration Tests", () => {
  // Clean up data before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("PUT /api/clinician/services should update an existing clinician service relation", async () => {
    // Create a clinician and service in the database
    const clinician = await ClinicianPrismaFactory.create();
    const service = await PracticeServicePrismaFactory.create();

    // Create the initial relation
    await prisma.clinicianServices.create({
      data: {
        clinician_id: clinician.id,
        service_id: service.id,
        custom_rate: 100,
        is_active: true,
      },
    });

    // Setup update request body with service_ids as array of strings
    const updateBody = {
      clinician_id: clinician.id,
      service_ids: [service.id],
      custom_rate: 150,
      is_active: true,
    };

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", updateBody, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify response
    expect(response.status).toBe(200);
    const json = await response.json();

    // Expect array response with one item
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);

    // Verify updated data in first result
    expect(json[0]).toHaveProperty("clinician_id", clinician.id);
    expect(json[0]).toHaveProperty("service_id", service.id);
    expect(json[0]).toHaveProperty("custom_rate");
    expect(Number(json[0].custom_rate)).toBe(150); // Decimal returns as string in JSON

    // Verify the relation was updated in the database
    const updatedRelation = await prisma.clinicianServices.findUnique({
      where: {
        clinician_id_service_id: {
          clinician_id: clinician.id,
          service_id: service.id,
        },
      },
    });

    expect(updatedRelation).not.toBeNull();
    expect(updatedRelation?.custom_rate?.toNumber()).toBe(150);
  });

  it("PUT /api/clinician/services should create a new clinician service relation if it doesn't exist", async () => {
    // Create a clinician and service in the database
    const clinician = await ClinicianPrismaFactory.create();
    const service = await PracticeServicePrismaFactory.create();

    // Setup create request body with service_ids as array of strings
    const createBody = {
      clinician_id: clinician.id,
      service_ids: [service.id],
      custom_rate: 200,
      is_active: true,
    };

    // Verify the relation doesn't exist yet
    const initialRelation = await prisma.clinicianServices.findUnique({
      where: {
        clinician_id_service_id: {
          clinician_id: clinician.id,
          service_id: service.id,
        },
      },
    });

    expect(initialRelation).toBeNull();

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", createBody, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify response
    expect(response.status).toBe(201); // Created
    const json = await response.json();

    // Expect array response with one item
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);

    // Verify created data in first result
    expect(json[0]).toHaveProperty("clinician_id", clinician.id);
    expect(json[0]).toHaveProperty("service_id", service.id);
    expect(json[0]).toHaveProperty("custom_rate");
    expect(Number(json[0].custom_rate)).toBe(200);

    // Verify the relation exists in the database
    const createdRelation = await prisma.clinicianServices.findUnique({
      where: {
        clinician_id_service_id: {
          clinician_id: clinician.id,
          service_id: service.id,
        },
      },
    });

    expect(createdRelation).not.toBeNull();
    expect(createdRelation?.custom_rate?.toNumber()).toBe(200);
  });

  it("PUT /api/clinician/services should return 404 if clinician doesn't exist", async () => {
    // Create just a service
    const service = await PracticeServicePrismaFactory.create();

    // Setup request with non-existent clinician ID
    const requestBody = {
      clinician_id: "00000000-0000-0000-0000-000000000000", // Non-existent ID
      service_ids: [service.id],
      custom_rate: 150,
    };

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestBody, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify response
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Clinician not found");
  });

  it("PUT /api/clinician/services should return 404 if service doesn't exist", async () => {
    // Create just a clinician
    const clinician = await ClinicianPrismaFactory.create();

    // Setup request with non-existent service ID
    const requestBody = {
      clinician_id: clinician.id,
      service_ids: ["00000000-0000-0000-0000-000000000000"], // Non-existent ID
      custom_rate: 150,
    };

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestBody, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify response
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "One or more services not found");
    expect(json).toHaveProperty("missing_service_ids");
  });

  it("PUT /api/clinician/services should return 422 for invalid payload", async () => {
    // Setup request with invalid data (missing required fields)
    const requestBody = {
      // Missing clinician_id and service_ids
      custom_rate: 150,
    };

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestBody, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify response
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Validation error");
    expect(json).toHaveProperty("details");
  });
});
