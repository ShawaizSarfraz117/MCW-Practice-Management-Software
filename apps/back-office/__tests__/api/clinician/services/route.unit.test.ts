/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequestWithBody } from "@mcw/utils";
import { PUT } from "@/api/clinician/services/route";
import prismaMock from "@mcw/database/mock";
import {
  ClinicianFactory,
  PracticeServiceFactory,
} from "@mcw/database/mock-data";
import { Decimal } from "@prisma/client/runtime/library";

describe("ClinicianServices API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("PUT /api/clinician/services should update a clinician service", async () => {
    // Create mock clinician and service
    const clinician = ClinicianFactory.build({
      user_id: "user-123",
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const service = PracticeServiceFactory.build({ id: "service-1" }); // Use a string ID

    // Mock existing relationship
    const existingClinicianService = {
      clinician_id: clinician.id,
      service_id: service.id,
      custom_rate: new Decimal(100),
      is_active: true,
    };

    // Mock updated relationship - use string for custom_rate to match JSON response
    const updatedClinicianService = {
      clinician_id: clinician.id,
      service_id: service.id,
      custom_rate: "150",
      is_active: true,
    };

    // Setup request data
    const requestData = {
      clinician_id: clinician.id,
      service_ids: [service.id], // Array of strings
      custom_rate: 150,
      is_active: true,
    };

    // Mock Prisma responses
    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinician);
    prismaMock.practiceService.findMany.mockResolvedValueOnce([service]);
    prismaMock.clinicianServices.findMany.mockResolvedValueOnce([
      existingClinicianService,
    ]);

    // Mock the update call
    prismaMock.clinicianServices.update.mockResolvedValueOnce({
      clinician_id: clinician.id,
      service_id: service.id,
      custom_rate: new Decimal(150),
      is_active: true,
    });

    // Mock the final findMany call
    prismaMock.clinicianServices.findMany.mockResolvedValueOnce([
      {
        clinician_id: clinician.id,
        service_id: service.id,
        custom_rate: new Decimal(150),
        is_active: true,
      },
    ]);

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestData, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify the response
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);
    expect(json[0]).toEqual(updatedClinicianService);

    // Verify mock calls
    expect(prismaMock.clinician.findUnique).toHaveBeenCalledWith({
      where: { id: clinician.id },
    });

    expect(prismaMock.practiceService.findMany).toHaveBeenCalledWith({
      where: { id: { in: [service.id] } },
    });

    expect(prismaMock.clinicianServices.findMany).toHaveBeenCalledWith({
      where: {
        clinician_id: clinician.id,
        service_id: { in: [service.id] },
      },
    });

    expect(prismaMock.clinicianServices.update).toHaveBeenCalledWith({
      where: {
        clinician_id_service_id: {
          clinician_id: clinician.id,
          service_id: service.id,
        },
      },
      data: {
        custom_rate: expect.any(Number),
        is_active: true,
      },
    });
  });

  it("PUT /api/clinician/services should create a service relationship when it doesn't exist", async () => {
    // Create mock clinician and service
    const clinician = ClinicianFactory.build({
      user_id: "user-456",
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const service = PracticeServiceFactory.build({ id: "service-2" }); // Use a string ID

    // Mock created relationship - use string for custom_rate to match JSON response
    const newClinicianService = {
      clinician_id: clinician.id,
      service_id: service.id,
      custom_rate: "200",
      is_active: true,
    };

    // Setup request data
    const requestData = {
      clinician_id: clinician.id,
      service_ids: [service.id], // Array of strings
      custom_rate: 200,
      is_active: true,
    };

    // Mock Prisma responses
    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinician);
    prismaMock.practiceService.findMany.mockResolvedValueOnce([service]);
    prismaMock.clinicianServices.findMany.mockResolvedValueOnce([]); // No existing relation

    // Mock the createMany call
    prismaMock.clinicianServices.createMany.mockResolvedValueOnce({ count: 1 });

    // Mock the final findMany call
    prismaMock.clinicianServices.findMany.mockResolvedValueOnce([
      {
        clinician_id: clinician.id,
        service_id: service.id,
        custom_rate: new Decimal(200),
        is_active: true,
      },
    ]);

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestData, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify the response
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);
    expect(json[0]).toEqual(newClinicianService);

    // Verify mock calls
    expect(prismaMock.clinician.findUnique).toHaveBeenCalledWith({
      where: { id: clinician.id },
    });

    expect(prismaMock.practiceService.findMany).toHaveBeenCalledWith({
      where: { id: { in: [service.id] } },
    });

    expect(prismaMock.clinicianServices.findMany).toHaveBeenCalledWith({
      where: {
        clinician_id: clinician.id,
        service_id: { in: [service.id] },
      },
    });

    expect(prismaMock.clinicianServices.createMany).toHaveBeenCalledWith({
      data: [
        {
          clinician_id: clinician.id,
          service_id: service.id,
          custom_rate: 200,
          is_active: true,
        },
      ],
    });
  });

  it("PUT /api/clinician/services should return 404 if clinician doesn't exist", async () => {
    // Using a valid UUID format for the test
    const validUuid = "00000000-0000-0000-0000-000000000000";

    // Setup request data with non-existent clinician ID
    const requestData = {
      clinician_id: validUuid,
      service_ids: ["service-1"], // Array of strings
      custom_rate: 150,
    };

    // Mock Prisma responses
    prismaMock.clinician.findUnique.mockResolvedValueOnce(null);

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestData, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify the response
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Clinician not found");
  });

  it("PUT /api/clinician/services should return 404 if service doesn't exist", async () => {
    // Create mock clinician
    const clinician = ClinicianFactory.build({
      user_id: "user-789",
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });

    // Setup request data with non-existent service ID
    const requestData = {
      clinician_id: clinician.id,
      service_ids: ["non-existent-service"], // Non-existent service ID
      custom_rate: 150,
    };

    // Mock Prisma responses
    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinician);
    prismaMock.practiceService.findMany.mockResolvedValueOnce([]); // No services found

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestData, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify the response
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "One or more services not found");
    expect(json).toHaveProperty("missing_service_ids");
  });

  it("PUT /api/clinician/services should return 422 for invalid payload", async () => {
    // Setup invalid request data (missing required fields)
    const requestData = {
      // Missing clinician_id and service_ids
      custom_rate: 150,
    };

    // Make the request
    const req = createRequestWithBody("/api/clinician/services", requestData, {
      method: "PUT",
    });

    const response = await PUT(req);

    // Verify the response
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Validation error");
    expect(json).toHaveProperty("details");
  });
});
