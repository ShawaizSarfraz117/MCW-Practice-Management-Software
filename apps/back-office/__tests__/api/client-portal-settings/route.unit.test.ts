import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import prismaMock from "@mcw/database/mock";
import { GET } from "@/api/client-portal-settings/route";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Mock database
vi.mock("@mcw/database", () => ({
  database: {
    clientPortalSettings: {
      findFirst: vi.fn(),
    },
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);
const mockDatabase = vi.mocked(prismaMock);

describe("/api/client-portal-settings GET", () => {
  const mockSettings = {
    id: "12345678-1234-1234-1234-123456789012",
    clinician_id: "87654321-4321-4321-4321-210987654321",
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
      expect(
        mockDatabase.clientPortalSettings.findFirst,
      ).not.toHaveBeenCalled();
    });

    it("should return 401 when session exists but user.id is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as Session);

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
      expect(
        mockDatabase.clientPortalSettings.findFirst,
      ).not.toHaveBeenCalled();
    });
  });

  describe("query parameter validation", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "87654321-4321-4321-4321-210987654321" },
      } as Session);
    });

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
      expect(
        mockDatabase.clientPortalSettings.findFirst,
      ).not.toHaveBeenCalled();
    });

    it("should accept valid clinician_id parameter", async () => {
      mockDatabase.clientPortalSettings.findFirst.mockResolvedValue(
        mockSettings,
      );

      const clinicianId = "12345678-1234-1234-1234-123456789012";
      const request = new NextRequest(
        new URL(
          `http://localhost:3000/api/client-portal-settings?clinician_id=${clinicianId}`,
        ),
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockDatabase.clientPortalSettings.findFirst).toHaveBeenCalledWith({
        where: {
          clinician_id: clinicianId,
        },
      });
    });
  });

  describe("successful responses", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "87654321-4321-4321-4321-210987654321" },
      } as Session);
    });

    it("should return settings for authenticated user when no clinician_id provided", async () => {
      mockDatabase.clientPortalSettings.findFirst.mockResolvedValue(
        mockSettings,
      );

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockSettings);
      expect(responseData.message).toBe(
        "Client portal settings retrieved successfully",
      );
      expect(mockDatabase.clientPortalSettings.findFirst).toHaveBeenCalledWith({
        where: {
          clinician_id: "87654321-4321-4321-4321-210987654321",
        },
      });
    });

    it("should return settings for specified clinician_id", async () => {
      mockDatabase.clientPortalSettings.findFirst.mockResolvedValue(
        mockSettings,
      );

      const clinicianId = "12345678-1234-1234-1234-123456789012";
      const request = new NextRequest(
        new URL(
          `http://localhost:3000/api/client-portal-settings?clinician_id=${clinicianId}`,
        ),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockSettings);
      expect(responseData.message).toBe(
        "Client portal settings retrieved successfully",
      );
      expect(mockDatabase.clientPortalSettings.findFirst).toHaveBeenCalledWith({
        where: {
          clinician_id: clinicianId,
        },
      });
    });
  });

  describe("error cases", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "87654321-4321-4321-4321-210987654321" },
      } as Session);
    });

    it("should return 404 when settings not found", async () => {
      mockDatabase.clientPortalSettings.findFirst.mockResolvedValue(null);

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe("Client portal settings not found");
    });

    it("should return 500 when database throws error", async () => {
      mockDatabase.clientPortalSettings.findFirst.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const request = new NextRequest(
        new URL("http://localhost:3000/api/client-portal-settings"),
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Internal server error");
    });
  });
});
