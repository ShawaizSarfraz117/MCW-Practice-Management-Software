import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE } from "@/api/clinician/route";
import prismaMock from "@mcw/database/mock";
import { ClinicianFactory, UserFactory } from "@mcw/database/mock-data";

describe("Clinician API Unit Tests", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/clinician should return all clinicians", async () => {
    const user0 = UserFactory.build();
    const user1 = UserFactory.build();
    const clinician0 = ClinicianFactory.build({ user_id: user0.id });
    const clinician1 = ClinicianFactory.build({ user_id: user1.id });

    const clinicians = [clinician0, clinician1];

    // Mock the prisma response for findMany
    prismaMock.clinician.findMany.mockResolvedValueOnce(clinicians);

    const req = createRequest("/api/clinician");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify response structure
    expect(json).toHaveLength(clinicians.length);

    // Verify first clinician data
    expect(json[0]).toHaveProperty("id", clinician0.id);
    expect(json[0]).toHaveProperty("user_id", clinician0.user_id);

    // Verify second clinician data
    expect(json[1]).toHaveProperty("id", clinician1.id);
    expect(json[1]).toHaveProperty("user_id", clinician1.user_id);

    // Verify the mock was called with correct parameters
    expect(prismaMock.clinician.findMany).toHaveBeenCalledWith({
      include: {
        User: {
          select: {
            email: true,
          },
        },
      },
    });
  });

  it("GET /api/clinician/?id=<id> should return a specific clinician", async () => {
    const user = UserFactory.build();
    const clinician = ClinicianFactory.build({
      user_id: user.id,
      User: {
        email: user.email,
      },
    });

    // Mock the prisma response for findUnique
    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinician);

    const req = createRequest(`/api/clinician/?id=${clinician.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify essential response properties
    expect(json).toHaveProperty("id", clinician.id);
    expect(json).toHaveProperty("user_id", clinician.user_id);
    expect(json).toHaveProperty("first_name", clinician.first_name);
    expect(json).toHaveProperty("last_name", clinician.last_name);
    expect(json).toHaveProperty("User.email", user.email);

    // Verify the mock was called with the correct ID
    expect(prismaMock.clinician.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clinician.id },
      }),
    );
  });

  it("POST /api/clinician should create a new clinician", async () => {
    const user = UserFactory.build();
    const clinician = ClinicianFactory.build({ user_id: user.id });

    const clinicianBody = {
      user_id: user.id,
      address: clinician.address,
      percentage_split: clinician.percentage_split,
      is_active: clinician.is_active,
      first_name: clinician.first_name,
      last_name: clinician.last_name,
    };

    // Mock findUnique to return null (no existing clinician)
    prismaMock.clinician.findUnique.mockResolvedValueOnce(null);
    // Mock create to return the new clinician
    prismaMock.clinician.create.mockResolvedValueOnce(clinician);

    const req = createRequestWithBody("/api/clinician", clinicianBody);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    // Verify essential response properties
    expect(json).toHaveProperty("address", clinicianBody.address);
    expect(json).toHaveProperty("is_active", clinicianBody.is_active);
    expect(json).toHaveProperty("first_name", clinicianBody.first_name);
    expect(json).toHaveProperty("last_name", clinicianBody.last_name);
    expect(json).toHaveProperty("user_id", user.id);

    // Verify create was called with correct data
    expect(prismaMock.clinician.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: clinicianBody,
      }),
    );
  });

  it("DELETE /api/clinician/?id=<id> should deactivate a clinician", async () => {
    const user = UserFactory.build();
    const clinician = ClinicianFactory.build({ user_id: user.id });
    const deactivatedClinician = { ...clinician, is_active: false };

    // Mock findUnique to return the existing clinician
    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinician);
    // Mock update to return the deactivated clinician
    prismaMock.clinician.update.mockResolvedValueOnce(deactivatedClinician);

    const req = createRequest(`/api/clinician/?id=${clinician.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify response structure
    expect(json).toEqual({
      message: "Clinician deactivated successfully",
      clinician: deactivatedClinician,
    });

    // Verify update was called with correct data
    expect(prismaMock.clinician.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clinician.id },
        data: { is_active: false },
      }),
    );
  });
});
