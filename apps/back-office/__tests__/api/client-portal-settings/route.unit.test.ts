import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/client-portal-settings/route";
import prismaMock from "@mcw/database/mock";

// Mock the authentication helper
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
      },
    }),
  ),
}));

// Mock data
const mockClinician = {
  id: "clinician-id",
  first_name: "John",
  last_name: "Doe",
  user_id: "test-user-id",
};

const mockClientPortalSettings = {
  id: "settings-id",
  clinician_id: mockClinician.id,
  website_domain: "john-doe.clientsecure.me",
  allow_appointments: true,
  allow_file_uploads: true,
  greeting_message: "Welcome to my portal",
  allow_new_clients: true,
  allow_individual_clients: true,
  allow_couple_clients: true,
  allow_contact_clients: true,
  show_prescreener: true,
  ask_payment_method: true,
  require_credit_card: false,
  created_at: new Date(),
  updated_at: new Date(),
};

describe("Client Portal Settings API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/client-portal-settings should return settings", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.clientPortalSettings.findUnique.mockResolvedValueOnce(
      mockClientPortalSettings,
    );

    const req = createRequest("/api/client-portal-settings");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockClientPortalSettings.id,
      website_domain: mockClientPortalSettings.website_domain,
      allow_appointments: mockClientPortalSettings.allow_appointments,
      allow_file_uploads: mockClientPortalSettings.allow_file_uploads,
    });
  });

  it("GET /api/client-portal-settings should create default settings if none exist", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.clientPortalSettings.findUnique.mockResolvedValueOnce(null);
    prismaMock.clientPortalSettings.create.mockResolvedValueOnce({
      ...mockClientPortalSettings,
      website_domain: "john-doe.clientsecure.me",
    });

    const req = createRequest("/api/client-portal-settings");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("website_domain", "john-doe.clientsecure.me");
    expect(prismaMock.clientPortalSettings.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clinician_id: mockClinician.id,
        website_domain: "john-doe.clientsecure.me",
      }),
    });
  });

  it("GET /api/client-portal-settings should return 404 if clinician not found", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/client-portal-settings");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Clinician not found");
  });

  it("PUT /api/client-portal-settings should update settings", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.clientPortalSettings.upsert.mockResolvedValueOnce({
      ...mockClientPortalSettings,
      greeting_message: "Updated greeting",
    });

    const updateData = {
      greeting_message: "Updated greeting",
      allow_appointments: true,
      allow_file_uploads: true,
    };

    const req = createRequestWithBody(
      "/api/client-portal-settings",
      updateData,
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("greeting_message", "Updated greeting");
    expect(prismaMock.clientPortalSettings.upsert).toHaveBeenCalledWith({
      where: { clinician_id: mockClinician.id },
      update: updateData,
      create: expect.objectContaining({
        clinician_id: mockClinician.id,
        ...updateData,
      }),
    });
  });

  it("PUT /api/client-portal-settings should return 422 for invalid payload", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);

    const invalidData = {
      website_domain: "", // Invalid empty domain
    };

    const req = createRequestWithBody(
      "/api/client-portal-settings",
      invalidData,
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid request payload");
    expect(json).toHaveProperty("details");
  });

  it("PUT /api/client-portal-settings should return 404 if clinician not found", async () => {
    prismaMock.clinician.findUnique.mockResolvedValueOnce(null);

    const req = createRequestWithBody(
      "/api/client-portal-settings",
      {},
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Clinician not found");
  });
});
