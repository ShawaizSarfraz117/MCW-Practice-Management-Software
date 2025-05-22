import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/clinician/route";
import prismaMock from "@mcw/database/mock";
import { ClinicianFactory, UserFactory } from "@mcw/database/mock-data";

// Mock the getBackOfficeSession helper
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        roles: ["ADMIN"],
        isAdmin: true,
      },
    }),
  ),
}));

describe("Clinician API Unit Tests", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/clinician should return all clinicians", async () => {
    const user0 = UserFactory.build();
    const user1 = UserFactory.build();
    const clinician0 = ClinicianFactory.build({
      user_id: user0.id,
      User: {
        email: user0.email,
      },
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const clinician1 = ClinicianFactory.build({
      user_id: user1.id,
      User: {
        email: user1.email,
      },
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });

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
    expect(json[0]).toHaveProperty("User.email", clinician0.User.email);

    // Verify second clinician data
    expect(json[1]).toHaveProperty("id", clinician1.id);
    expect(json[1]).toHaveProperty("user_id", clinician1.user_id);
    expect(json[1]).toHaveProperty("User.email", clinician1.User.email);

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
      ClinicianLocation: [],
      ClinicianServices: [],
      ClinicianClient: [],
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
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
    const clinician = ClinicianFactory.build({
      user_id: user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });

    const clinicianBody = {
      user_id: user.id,
      address: clinician.address,
      percentage_split: clinician.percentage_split,
      is_active: clinician.is_active,
      first_name: clinician.first_name,
      last_name: clinician.last_name,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    };

    // The data that will actually be used in the create call
    const expectedCreateData = {
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
    expect(prismaMock.clinician.create).toHaveBeenCalledWith({
      data: expectedCreateData,
    });
  });

  it("DELETE /api/clinician/?id=<id> should deactivate a clinician", async () => {
    const user = UserFactory.build();
    const clinician = ClinicianFactory.build({
      user_id: user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const deactivatedClinician = {
      ...clinician,
      is_active: false,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    };

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
    expect(json).toHaveProperty(
      "message",
      "Clinician deactivated successfully",
    );
    expect(json).toHaveProperty("clinician");
    expect(json.clinician).toHaveProperty("id", deactivatedClinician.id);
    expect(json.clinician).toHaveProperty("is_active", false);

    // Verify update was called with correct data
    expect(prismaMock.clinician.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clinician.id },
        data: { is_active: false },
      }),
    );
  });

  it("PUT /api/clinician should update an existing clinician", async () => {
    const user = UserFactory.build();
    const clinician = ClinicianFactory.build({
      user_id: user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });

    // Create a clean object for the updated clinician to avoid non-serializable properties
    const updatedClinicianData = {
      id: clinician.id,
      user_id: clinician.user_id,
      first_name: "John 2",
      last_name: clinician.last_name,
      address: clinician.address,
      percentage_split: clinician.percentage_split,
      is_active: clinician.is_active,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    };

    // Mock upsert instead of update since that's what the route uses
    prismaMock.clinician.upsert.mockResolvedValueOnce(updatedClinicianData);

    const req = createRequestWithBody("/api/clinician", updatedClinicianData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify response matches updated clinician
    expect(json).toEqual(updatedClinicianData);

    // Verify upsert was called with correct data
    expect(prismaMock.clinician.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: updatedClinicianData.user_id },
        update: {
          first_name: updatedClinicianData.first_name,
          last_name: updatedClinicianData.last_name,
          address: updatedClinicianData.address,
          percentage_split: updatedClinicianData.percentage_split,
          is_active: updatedClinicianData.is_active,
        },
        create: expect.any(Object),
      }),
    );
  });
});
