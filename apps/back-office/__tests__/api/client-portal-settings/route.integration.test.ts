import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@mcw/database";
import { GET } from "@/api/client-portal-settings/route";

// Mock next-auth with controllable session data
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

let mockSession: { user: { id?: string } } | null = null;

// Override the mock implementation
vi.mocked(getServerSession).mockImplementation(() => {
  return Promise.resolve(mockSession);
});

async function setupTestData(testClinicianId: string, testSettingsId: string) {
  // First clean up any existing data
  await prisma.clientPortalSettings.deleteMany({
    where: { id: testSettingsId },
  });

  await prisma.clinician.deleteMany({
    where: { id: testClinicianId },
  });

  // Create test user first
  await prisma.user.create({
    data: {
      id: testClinicianId,
      email: `test-${testClinicianId}@example.com`,
      password_hash: "test_password_hash",
    },
  });

  // Create test clinician
  await prisma.clinician.create({
    data: {
      user_id: testClinicianId,
      first_name: "Test",
      last_name: "Clinician",
      address: "123 Test Street, Test City, TS 12345",
      percentage_split: 70.0,
      is_active: true,
    },
  });

  // Create test client portal settings using the correct schema field names
  await prisma.clientPortalSettings.create({
    data: {
      id: testSettingsId,
      clinician_id: testClinicianId,
      is_enabled: true,
      domain_url: "https://example.com",
      is_appointment_requests_enabled: true,
      appointment_start_times: "09:00,10:00,11:00",
      request_minimum_notice: "24",
      maximum_request_notice: "168",
      allow_new_clients_request: false,
      requests_from_new_individuals: true,
      requests_from_new_couples: false,
      requests_from_new_contacts: false,
      is_prescreen_new_clinets: false,
      card_for_appointment_request: true,
      is_upload_documents_allowed: false,
      welcome_message: "Welcome to our client portal!",
    },
  });

  // Mock the session
  mockSession = {
    user: { id: testClinicianId },
  };
}

async function cleanupTestData(
  testClinicianId: string,
  testSettingsId: string,
) {
  try {
    // Clean up test data
    await prisma.clientPortalSettings.deleteMany({
      where: { id: testSettingsId },
    });

    await prisma.clinician.deleteMany({
      where: { id: testClinicianId },
    });

    mockSession = null;
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

describe("/api/client-portal-settings GET - Integration Tests", () => {
  let testClinicianId: string;
  let testSettingsId: string;

  beforeEach(async () => {
    // Generate proper UUIDs
    testClinicianId = crypto.randomUUID();
    testSettingsId = crypto.randomUUID();

    try {
      await setupTestData(testClinicianId, testSettingsId);
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  afterEach(async () => {
    await cleanupTestData(testClinicianId, testSettingsId);
  });

  describe("authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSession = null;

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 401 when session exists but user.id is missing", async () => {
      mockSession = { user: {} };

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
    });
  });

  describe("successful responses", () => {
    it("should return settings for authenticated user when no clinician_id provided", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.message).toBe(
        "Client portal settings retrieved successfully",
      );

      const { data } = responseData;

      // Verify returned data structure
      expect(data).toBeDefined();
      expect(data.id).toBe(testSettingsId);
      expect(data.clinician_id).toBe(testClinicianId);
      expect(data.is_enabled).toBe(true);
      expect(data.domain_url).toBe("https://example.com");
      expect(data.is_appointment_requests_enabled).toBe(true);
      expect(data.appointment_start_times).toBe("09:00,10:00,11:00");
      expect(data.request_minimum_notice).toBe("24");
      expect(data.maximum_request_notice).toBe("168");
      expect(data.allow_new_clients_request).toBe(false);
      expect(data.requests_from_new_individuals).toBe(true);
      expect(data.requests_from_new_couples).toBe(false);
      expect(data.requests_from_new_contacts).toBe(false);
      expect(data.is_prescreen_new_clinets).toBe(false);
      expect(data.card_for_appointment_request).toBe(true);
      expect(data.is_upload_documents_allowed).toBe(false);
      expect(data.welcome_message).toBe("Welcome to our client portal!");
    });
  });

  describe("query parameter validation", () => {
    it("should return 400 for invalid clinician_id format", async () => {
      const request = new NextRequest(
        new URL(
          "http://localhost:3000/api/client-portal-settings?clinician_id=invalid-uuid",
        ),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid query parameters");
      expect(responseData.details).toBeDefined();
    });
  });

  describe("error cases", () => {
    it("should return 404 when settings not found for clinician", async () => {
      const nonExistentClinicianId = "99999999-9999-9999-9999-999999999999";

      const request = new NextRequest(
        new URL(
          `http://localhost:3000/api/client-portal-settings?clinician_id=${nonExistentClinicianId}`,
        ),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe("Client portal settings not found");
    });
  });

  describe("data integrity", () => {
    it("should return all fields with correct data types", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);

      const { data } = responseData;

      // Verify data types
      expect(typeof data.id).toBe("string");
      expect(typeof data.clinician_id).toBe("string");
      expect(typeof data.is_enabled).toBe("boolean");
      expect(typeof data.domain_url).toBe("string");
      expect(typeof data.is_appointment_requests_enabled).toBe("boolean");
      expect(typeof data.appointment_start_times).toBe("string");
      expect(typeof data.request_minimum_notice).toBe("string");
      expect(typeof data.maximum_request_notice).toBe("string");
      expect(typeof data.allow_new_clients_request).toBe("boolean");
      expect(typeof data.requests_from_new_individuals).toBe("boolean");
      expect(typeof data.requests_from_new_couples).toBe("boolean");
      expect(typeof data.requests_from_new_contacts).toBe("boolean");
      expect(typeof data.is_prescreen_new_clinets).toBe("boolean");
      expect(typeof data.card_for_appointment_request).toBe("boolean");
      expect(typeof data.is_upload_documents_allowed).toBe("boolean");
      expect(typeof data.welcome_message).toBe("string");
    });
  });
});
