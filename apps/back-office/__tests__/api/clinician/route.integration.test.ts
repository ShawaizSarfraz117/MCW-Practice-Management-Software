import { describe, it, expect, beforeEach } from "vitest";
import type { Clinician } from "@mcw/database";
import { prisma } from "@mcw/database";
import {
  UserPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/clinician/route";

describe("Clinician API", async () => {
  beforeEach(async () => {
    await prisma.clinician.deleteMany();
    await prisma.user.deleteMany();
  });

  it(`GET /api/clinician/?id=<id>`, async () => {
    const clinician = await ClinicianPrismaFactory.create();

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

    const req = createRequest("/api/clinician");

    const response = await GET(req);

    expect(response.status).toBe(200);

    const json = (await response.json()) as Clinician[];

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
    const clinician = await ClinicianPrismaFactory.build({
      User: {
        connect: {
          id: user.id,
        },
      },
    });

    const clinicianBody = {
      user_id: user.id,
      address: clinician.address,
      percentage_split: clinician.percentage_split,
      is_active: clinician.is_active,
      first_name: clinician.first_name,
      last_name: clinician.last_name,
    };

    const req = createRequestWithBody("/api/clinician", clinicianBody);

    const response = await POST(req);

    expect(response.status).toBe(201);

    const json = await response.json();

    expect(json).toHaveProperty("address", clinicianBody.address);
    expect(json).toHaveProperty("is_active", clinicianBody.is_active);
    expect(json).toHaveProperty("first_name", clinicianBody.first_name);
    expect(json).toHaveProperty("last_name", clinicianBody.last_name);
    expect(json).toHaveProperty("user_id", user.id);
  });

  it(`DELETE /api/clinician/?id=<id>`, async () => {
    const clinician = await ClinicianPrismaFactory.create();

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
