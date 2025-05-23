import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/income/route"; // Corrected alias based on tsconfig
import { logger } from "@mcw/logger";

// Mock the logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

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
    });

    it("should return 400 if endDate is missing", async () => {
      const req = createMockRequest({ startDate: "2023-01-01" });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Both startDate and endDate are required");
      expect(logger.info).not.toHaveBeenCalled();
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
    });

    it("should return 200 for valid startDate and endDate", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe("Validation passed");
      expect(json.data).toEqual({ startDate, endDate });
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate },
        "Income analytics request",
      );
    });

    it("should return 200 when startDate and endDate are the same valid day", async () => {
      const date = "2023-01-10";
      const req = createMockRequest({ startDate: date, endDate: date });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe("Validation passed");
      expect(json.data).toEqual({ startDate: date, endDate: date });
      expect(logger.info).toHaveBeenCalledWith(
        { startDate: date, endDate: date },
        "Income analytics request",
      );
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
});
