import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/income/route"; // Corrected alias based on tsconfig
import { logger } from "@mcw/logger";
import { prisma } from "@mcw/database"; // Import prisma

// Mock the logger
vi.mock("@mcw/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mcw/logger")>();
  return {
    ...actual, // Preserve other exports from @mcw/logger
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
    getDbLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      query: vi.fn(),
    })), // Provide a mock for getDbLogger
  };
});

// Mock prisma
vi.mock("@mcw/database", async (importOriginal) => {
  const actualModule = await importOriginal<typeof import("@mcw/database")>();
  return {
    ...actualModule, // Spread other potential exports from the module
    prisma: {
      // Override the 'prisma' export specifically
      ...(actualModule.prisma as typeof actualModule.prisma), // Changed any to typeof actualModule.prisma
      $queryRaw: vi.fn(), // Mock $queryRaw
    },
  };
});

// Helper to create NextRequest objects
const createMockRequest = (
  searchParams: Record<string, string>,
): NextRequest => {
  const url = new URL("http://localhost/api/analytics/income");
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString());
};

describe("GET /api/analytics/income - Unit Tests", () => {
  let originalURL: typeof global.URL;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Provide a default mock resolution for $queryRaw to avoid undefined returns in tests not specifically targeting its failure/success
    vi.mocked(prisma.$queryRaw).mockReset().mockResolvedValue([]);
    originalURL = global.URL; // Backup original URL constructor
  });

  afterEach(() => {
    global.URL = originalURL; // Restore original URL constructor
  });

  describe("Input Validation", () => {
    it("should return 400 if startDate is missing", async () => {
      const req = createMockRequest({ endDate: "2023-01-15" });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Both startDate and endDate are required");
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 if endDate is missing", async () => {
      const req = createMockRequest({ startDate: "2023-01-01" });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Both startDate and endDate are required");
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid startDate format", async () => {
      const req = createMockRequest({
        startDate: "invalid-date",
        endDate: "2023-01-15",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Invalid date format. Use YYYY-MM-DD");
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid endDate format", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "invalid-date",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Invalid date format. Use YYYY-MM-DD");
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid date value (e.g., 2023-02-30)", async () => {
      const req = createMockRequest({
        startDate: "2023-02-30",
        endDate: "2023-03-15",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe(
        "Invalid date value. Ensure dates like YYYY-MM-DD are correct (e.g., no 2023-02-30).",
      );
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 if endDate is before startDate", async () => {
      const req = createMockRequest({
        startDate: "2023-01-15",
        endDate: "2023-01-01",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("endDate must be on or after startDate");
      expect(logger.info).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 200 for valid startDate and endDate", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([]); // Expecting the default empty array from mock
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate },
        "Income analytics request",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1); // Verify it was called
    });

    it("should return 200 when startDate and endDate are the same valid day", async () => {
      const date = "2023-01-10";
      const req = createMockRequest({ startDate: date, endDate: date });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([]); // Expecting the default empty array from mock
      expect(logger.info).toHaveBeenCalledWith(
        { startDate: date, endDate: date },
        "Income analytics request",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1); // Verify it was called
    });

    it("should return 500 and log error if an unexpected error occurs (simulated)", async () => {
      const req = new NextRequest(
        "http://localhost/api/analytics/income?startDate=2023-01-01&endDate=2023-01-15",
      );

      const mockUrlImplementation = vi.fn(() => {
        throw new Error("Simulated unexpected error during URL construction");
      });

      global.URL = Object.assign(mockUrlImplementation, originalURL);

      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalled();
      // Check if logger.error was called with an Error instance
      // This requires the error to be an instance of Error in the catch block of GET route
      const errorCall = vi.mocked(logger.error).mock.calls[0];
      if (errorCall && errorCall[0] instanceof Error) {
        expect(errorCall[0].message).toBe(
          "Simulated unexpected error during URL construction",
        );
        expect(errorCall[1]).toBe("Error in analytics income route");
      } else {
        // Fallback check if error was not an Error instance or logger was called differently
        expect(logger.error).toHaveBeenCalledWith(
          { details: "Simulated unexpected error during URL construction" },
          "An unknown error occurred in analytics income route",
        );
      }
    });
  });

  describe("SQL Query Logic & Data Transformation", () => {
    it("should call prisma.$queryRaw, transform data, and log query time on success", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const mockRawResult = [
        {
          metric_date: new Date("2023-01-01T00:00:00.000Z"), // UTC date
          total_client_payments: "100.50",
          total_gross_income: "200.75",
          total_net_income: "150.25",
        },
        {
          metric_date: new Date("2023-01-02T00:00:00.000Z"),
          total_client_payments: "0",
          total_gross_income: "50",
          total_net_income: "40",
        },
      ];
      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockRawResult);

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();

      const expectedFormattedResult = [
        {
          date: "2023-01-01",
          clientPayments: 100.5,
          grossIncome: 200.75,
          netIncome: 150.25,
        },
        {
          date: "2023-01-02",
          clientPayments: 0,
          grossIncome: 50,
          netIncome: 40,
        },
      ];
      expect(json).toEqual(expectedFormattedResult);

      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate },
        "Income analytics request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Income analytics query executed",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const queryCall = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      expect(queryCall).toHaveProperty("sql");
      expect(queryCall).toHaveProperty("values");
      expect(queryCall.values).toContain(startDate);
      expect(queryCall.values).toContain(endDate);
    });

    it("should return an empty array if prisma.$queryRaw returns an empty array", async () => {
      const startDate = "2023-02-01";
      const endDate = "2023-02-10";
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // Empty result

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Income analytics query executed",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it("should return 500 and log error if prisma.$queryRaw throws an error", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const dbError = new Error("Database query failed");
      vi.mocked(prisma.$queryRaw).mockRejectedValue(dbError);

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalledWith(
        dbError,
        "Error in analytics income route",
      );
    });
  });

  describe("General Error Handling (already partially covered)", () => {
    it("should return 500 and log error if new URL() throws an error (simulated)", async () => {
      const req = new NextRequest(
        "http://localhost/api/analytics/income?startDate=2023-01-01&endDate=2023-01-15",
      );
      const urlError = new Error(
        "Simulated unexpected error during URL construction",
      );
      const mockUrlImplementation = vi.fn(() => {
        throw urlError;
      });
      global.URL = Object.assign(mockUrlImplementation, originalURL);

      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalledWith(
        urlError,
        "Error in analytics income route",
      );
    });
  });
});
