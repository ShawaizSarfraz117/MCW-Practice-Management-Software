import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET } from "@/api/requests/summary/clients/route";
import { NextRequest } from "next/server";

// Mock the logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock the helpers module
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  __esModule: true,
}));

// Mock the database operations
vi.mock("@mcw/database", () => {
  const clientCountMock = vi.fn();

  return {
    prisma: {
      client: {
        count: clientCountMock,
      },
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

// Helper function to create request
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

describe("Client Summary API", () => {
  const MOCK_CLINICIAN_ID = "test-clinician-id";

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mock for getClinicianInfo
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: MOCK_CLINICIAN_ID,
    });
  });

  describe("GET /api/requests/summary/clients", () => {
    it("should return client summary counts successfully", async () => {
      // Arrange
      (prisma.client.count as Mock)
        .mockResolvedValueOnce(5) // prospective clients
        .mockResolvedValueOnce(10); // active clients

      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        prospectiveClientsCount: 5,
        activeClientsCount: 10,
      });

      // Verify database calls
      expect(prisma.client.count).toHaveBeenCalledTimes(2);

      // Check prospective clients query
      expect(prisma.client.count).toHaveBeenNthCalledWith(1, {
        where: {
          is_active: false,
          is_waitlist: false,
          ClinicianClient: {
            some: {
              clinician_id: MOCK_CLINICIAN_ID,
            },
          },
        },
      });

      // Check active clients query
      expect(prisma.client.count).toHaveBeenNthCalledWith(2, {
        where: {
          is_active: true,
          ClinicianClient: {
            some: {
              clinician_id: MOCK_CLINICIAN_ID,
            },
          },
        },
      });
    });

    it("should return 401 when clinician is not found", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        isClinician: false,
        clinicianId: null,
      });

      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });

      // Verify no database calls were made
      expect(prisma.client.count).not.toHaveBeenCalled();
    });

    it("should return 500 when database error occurs", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      (prisma.client.count as Mock).mockRejectedValue(mockError);

      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        error: "Failed to fetch client summary counts",
      });
    });

    it("should handle zero counts correctly", async () => {
      // Arrange
      (prisma.client.count as Mock)
        .mockResolvedValueOnce(0) // prospective clients
        .mockResolvedValueOnce(0); // active clients

      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        prospectiveClientsCount: 0,
        activeClientsCount: 0,
      });
    });

    it("should handle getClinicianInfo returning undefined", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });
    });
  });
});
