import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET } from "@/api/requests/summary/documents/route";
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
  const surveyAnswersCountMock = vi.fn();

  return {
    prisma: {
      surveyAnswers: {
        count: surveyAnswersCountMock,
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

describe("Document Summary API", () => {
  const MOCK_CLINICIAN_ID = "test-clinician-id";

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mock for getClinicianInfo
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: MOCK_CLINICIAN_ID,
    });
  });

  describe("GET /api/requests/summary/documents", () => {
    it("should return document summary counts successfully", async () => {
      // Arrange
      (prisma.surveyAnswers.count as Mock)
        .mockResolvedValueOnce(3) // expiring soon
        .mockResolvedValueOnce(7) // incomplete
        .mockResolvedValueOnce(15); // completed

      // Act
      const req = createRequest("/api/requests/summary/documents");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        expiringSoonCount: 3,
        documentsIncompleteCount: 7,
        documentsCompletedCount: 15,
      });

      // Verify database calls
      expect(prisma.surveyAnswers.count).toHaveBeenCalledTimes(3);
    });

    it("should call database with correct filters for expiring soon documents", async () => {
      // Arrange
      (prisma.surveyAnswers.count as Mock)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(15);

      // Act
      const req = createRequest("/api/requests/summary/documents");
      await GET(req);

      // Assert - Check the first call (expiring soon)
      const firstCall = (prisma.surveyAnswers.count as Mock).mock.calls[0][0];
      expect(firstCall.where).toMatchObject({
        status: {
          not: "completed",
        },
        Client: {
          ClinicianClient: {
            some: {
              clinician_id: MOCK_CLINICIAN_ID,
            },
          },
        },
      });

      // Check that expiry_date filter is present and has correct structure
      expect(firstCall.where.expiry_date).toBeDefined();
      expect(firstCall.where.expiry_date.lte).toBeInstanceOf(Date);
      expect(firstCall.where.expiry_date.gte).toBeInstanceOf(Date);
    });

    it("should call database with correct filters for incomplete documents", async () => {
      // Arrange
      (prisma.surveyAnswers.count as Mock)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(15);

      // Act
      const req = createRequest("/api/requests/summary/documents");
      await GET(req);

      // Assert - Check the second call (incomplete)
      const secondCall = (prisma.surveyAnswers.count as Mock).mock.calls[1][0];
      expect(secondCall.where).toMatchObject({
        OR: [
          { status: "sent" },
          { status: "pending" },
          { status: "in_progress" },
          {
            AND: [{ content: null }, { status: { not: "completed" } }],
          },
        ],
        Client: {
          ClinicianClient: {
            some: {
              clinician_id: MOCK_CLINICIAN_ID,
            },
          },
        },
      });
    });

    it("should call database with correct filters for completed documents", async () => {
      // Arrange
      (prisma.surveyAnswers.count as Mock)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(15);

      // Act
      const req = createRequest("/api/requests/summary/documents");
      await GET(req);

      // Assert - Check the third call (completed)
      const thirdCall = (prisma.surveyAnswers.count as Mock).mock.calls[2][0];
      expect(thirdCall.where).toMatchObject({
        status: "completed",
        Client: {
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
      const req = createRequest("/api/requests/summary/documents");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });

      // Verify no database calls were made
      expect(prisma.surveyAnswers.count).not.toHaveBeenCalled();
    });

    it("should return 500 when database error occurs", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      (prisma.surveyAnswers.count as Mock).mockRejectedValue(mockError);

      // Act
      const req = createRequest("/api/requests/summary/documents");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        error: "Failed to fetch document summary counts",
      });
    });

    it("should handle zero counts correctly", async () => {
      // Arrange
      (prisma.surveyAnswers.count as Mock)
        .mockResolvedValueOnce(0) // expiring soon
        .mockResolvedValueOnce(0) // incomplete
        .mockResolvedValueOnce(0); // completed

      // Act
      const req = createRequest("/api/requests/summary/documents");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        expiringSoonCount: 0,
        documentsIncompleteCount: 0,
        documentsCompletedCount: 0,
      });
    });

    it("should handle getClinicianInfo returning undefined", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      // Act
      const req = createRequest("/api/requests/summary/documents");
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
