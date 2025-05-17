import { describe, it, expect, afterEach, vi } from "vitest";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/client-portal-settings/route";
import { ClinicianPrismaFactory } from "@mcw/database/mock-data";

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

describe("Client Portal Settings API Integration Tests", () => {
  let createdClinicianIds: string[] = [];
  let createdSettingsIds: string[] = [];

  afterEach(async () => {
    // Clean up created settings
    if (createdSettingsIds.length > 0) {
      await prisma.clientPortalSettings.deleteMany({
        where: { id: { in: createdSettingsIds } },
      });
      createdSettingsIds = [];
    }

    // Clean up created clinicians
    if (createdClinicianIds.length > 0) {
      await prisma.clinician.deleteMany({
        where: { id: { in: createdClinicianIds } },
      });
      createdClinicianIds = [];
    }

    vi.restoreAllMocks();
  });

  it("GET /api/client-portal-settings should return settings", async () => {
    // Create a test clinician
    const clinician = await ClinicianPrismaFactory.create({
      user_id: "test-user-id",
    });
    createdClinicianIds.push(clinician.id);

    // Create test settings
    const settings = await prisma.clientPortalSettings.create({
      data: {
        clinician_id: clinician.id,
        website_domain: "test.clientsecure.me",
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
      },
    });
    createdSettingsIds.push(settings.id);

    const req = createRequest("/api/client-portal-settings");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: settings.id,
      website_domain: settings.website_domain,
      allow_appointments: settings.allow_appointments,
      allow_file_uploads: settings.allow_file_uploads,
      greeting_message: settings.greeting_message,
    });
  });

  it("GET /api/client-portal-settings should create default settings if none exist", async () => {
    // Create a test clinician
    const clinician = await ClinicianPrismaFactory.create({
      user_id: "test-user-id",
      first_name: "John",
      last_name: "Doe",
    });
    createdClinicianIds.push(clinician.id);

    const req = createRequest("/api/client-portal-settings");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("website_domain", "john-doe.clientsecure.me");
    expect(json).toHaveProperty("clinician_id", clinician.id);

    // Store the created settings ID for cleanup
    createdSettingsIds.push(json.id);
  });

  it("PUT /api/client-portal-settings should update settings", async () => {
    // Create a test clinician
    const clinician = await ClinicianPrismaFactory.create({
      user_id: "test-user-id",
    });
    createdClinicianIds.push(clinician.id);

    // Create initial settings
    const settings = await prisma.clientPortalSettings.create({
      data: {
        clinician_id: clinician.id,
        website_domain: "test.clientsecure.me",
        allow_appointments: true,
        allow_file_uploads: true,
      },
    });
    createdSettingsIds.push(settings.id);

    const updateData = {
      greeting_message: "Updated greeting",
      allow_appointments: false,
      allow_file_uploads: false,
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
    expect(json).toHaveProperty("allow_appointments", false);
    expect(json).toHaveProperty("allow_file_uploads", false);

    // Verify the update in the database
    const updatedSettings = await prisma.clientPortalSettings.findUnique({
      where: { id: settings.id },
    });
    expect(updatedSettings).toHaveProperty(
      "greeting_message",
      "Updated greeting",
    );
    expect(updatedSettings).toHaveProperty("allow_appointments", false);
    expect(updatedSettings).toHaveProperty("allow_file_uploads", false);
  });

  it("PUT /api/client-portal-settings should create settings if they don't exist", async () => {
    // Create a test clinician
    const clinician = await ClinicianPrismaFactory.create({
      user_id: "test-user-id",
    });
    createdClinicianIds.push(clinician.id);

    const settingsData = {
      website_domain: "new.clientsecure.me",
      allow_appointments: true,
      allow_file_uploads: true,
      greeting_message: "New portal",
    };

    const req = createRequestWithBody(
      "/api/client-portal-settings",
      settingsData,
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("website_domain", settingsData.website_domain);
    expect(json).toHaveProperty(
      "greeting_message",
      settingsData.greeting_message,
    );
    expect(json).toHaveProperty("clinician_id", clinician.id);

    // Store the created settings ID for cleanup
    createdSettingsIds.push(json.id);
  });

  it("PUT /api/client-portal-settings should return 422 for invalid payload", async () => {
    // Create a test clinician
    const clinician = await ClinicianPrismaFactory.create({
      user_id: "test-user-id",
    });
    createdClinicianIds.push(clinician.id);

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
});
