import { describe, it, expect, beforeEach } from "vitest";
import type { Clinician } from "@mcw/database";
import { prisma } from "@mcw/database";
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/clinician/route";

// Helper function to clean the database before each test
async function cleanDatabase() {
  console.log("[Cleanup] Starting database cleanup before test.");
  try {
    // Delete records in order of dependency
    await prisma.audit.deleteMany();
    await prisma.clinicalInfo.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.clientGroupMembership.deleteMany();
    await prisma.clientGroup.deleteMany();
    await prisma.clinicianServices.deleteMany();
    await prisma.clinicianLocation.deleteMany();
    await prisma.clinicianClient.deleteMany();
    // Now delete Clinicians and Users
    await prisma.clinician.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.user.deleteMany();
    console.log("[Cleanup] Finished database cleanup.");
  } catch (error) {
    console.error("[Cleanup] Error during database cleanup:", error);
    throw error; // Re-throw the error to fail the test if cleanup fails
  }
}

describe("Clinician API", async () => {
  // // Store IDs created in tests for cleanup -- REMOVED
  // let createdClinicianIds: string[] = [];
  // let createdUserIds: string[] = [];

  // Clean up data before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  it(`GET /api/clinician/?id=<id>`, async () => {
    const clinician = await ClinicianPrismaFactory.create();
    // createdClinicianIds.push(clinician.id); // Store ID for cleanup
    // createdUserIds.push(clinician.user_id); // Store associated user ID

    const req = createRequest(`/api/clinician/?id=${clinician.id}`);

    const response = await GET(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toHaveProperty("id", clinician.id);
    expect(json).toHaveProperty("user_id", clinician.user_id);
    expect(json).toHaveProperty("address", clinician.address);
    expect(json).toHaveProperty("is_active", clinician.is_active);
    expect(json).toHaveProperty("first_name", clinician.first_name);
    expect(json).toHaveProperty("last_name", clinician.last_name);
  });

  it("GET /api/clinician", async () => {
    const clinicians = await ClinicianPrismaFactory.createList(2);
    // Store IDs for cleanup
    // createdClinicianIds.push(...clinicians.map((c) => c.id));
    // createdUserIds.push(...clinicians.map((c) => c.user_id));

    const req = createRequest("/api/clinician");

    const response = await GET(req);

    expect(response.status).toBe(200);

    const json = (await response.json()) as Clinician[];

    // Debug: log all clinicians in DB
    const allClinicians = await prisma.clinician.findMany();
    console.log("All clinicians in DB:", allClinicians);

    expect(json).toHaveLength(clinicians.length);

    clinicians.forEach((clinician: Clinician) => {
      const foundClinician = json.find((c) => c.id === clinician.id);

      expect(foundClinician).toBeDefined();

      expect(foundClinician).toHaveProperty("id", clinician.id);
      expect(foundClinician).toHaveProperty("user_id", clinician.user_id);
      expect(foundClinician).toHaveProperty("address", clinician.address);
      expect(foundClinician).toHaveProperty("is_active", clinician.is_active);
      expect(foundClinician).toHaveProperty("first_name", clinician.first_name);
      expect(foundClinician).toHaveProperty("last_name", clinician.last_name);
    });
  });

  it("POST /api/clinician", async () => {
    const user = await UserPrismaFactory.create();
    // createdUserIds.push(user.id); // Store user ID first

    const clinicianData = await ClinicianPrismaFactory.build(); // Build doesn't save, just creates data object

    const clinicianBody = {
      user_id: user.id,
      address: clinicianData.address,
      percentage_split: clinicianData.percentage_split,
      is_active: clinicianData.is_active,
      first_name: clinicianData.first_name,
      last_name: clinicianData.last_name,
    };

    const req = createRequestWithBody("/api/clinician", clinicianBody);

    const response = await POST(req);

    expect(response.status).toBe(201);

    const json = await response.json();
    // createdClinicianIds.push(json.id); // Store the ID of the created clinician

    expect(json).toHaveProperty("address", clinicianBody.address);
    expect(json).toHaveProperty("is_active", clinicianBody.is_active);
    expect(json).toHaveProperty("first_name", clinicianBody.first_name);
    expect(json).toHaveProperty("last_name", clinicianBody.last_name);
    expect(json).toHaveProperty("user_id", user.id);
  });

  it(`DELETE /api/clinician/?id=<id>`, async () => {
    const clinician = await ClinicianPrismaFactory.create();
    // createdClinicianIds.push(clinician.id); // Store ID for cleanup
    // createdUserIds.push(clinician.user_id);

    const req = createRequest(`/api/clinician/?id=${clinician.id}`, {
      method: "DELETE",
    });

    const response = await DELETE(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual({
      message: "Clinician deactivated successfully",
      clinician: {
        ...clinician,
        is_active: false,
      },
    });
  });

  it("PUT /api/clinician", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    // createdClinicianIds.push(clinician.id); // Store ID for cleanup
    // createdUserIds.push(clinician.user_id);

    const updatedClinician = {
      ...clinician,
      first_name: "John 2",
    };
    const req = createRequestWithBody("/api/clinician", updatedClinician, {
      method: "PUT",
    });

    const response = await PUT(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual({
      ...clinician,
      first_name: "John 2",
    });
  });
});
