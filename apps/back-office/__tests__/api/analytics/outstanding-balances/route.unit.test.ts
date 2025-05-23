import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/outstanding-balances/route";
import { logger } from "@mcw/logger";
// Prisma not used in validation-only part, so not mocked here for now

// Mock the logger
vi.mock("@mcw/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mcw/logger")>();
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
    getDbLogger: vi.fn(() => ({
      // Though not directly used by this route, it might be a dependency of an imported module
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      query: vi.fn(),
    })),
  };
});

// Helper to create NextRequest objects
const createMockRequest = (
  searchParams: Record<string, string | null> = {},
): NextRequest => {
  const url = new URL("http://localhost/api/analytics/outstanding-balances");
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return new NextRequest(url.toString());
};

describe("GET /api/analytics/outstanding-balances - Unit Tests", () => {
  let originalURL: typeof global.URL;

  beforeEach(() => {
    vi.clearAllMocks();
    originalURL = global.URL;
  });

  afterEach(() => {
    global.URL = originalURL;
  });

  describe("Input Validation", () => {
    it("should return 400 if startDate is missing", async () => {
      const req = createMockRequest({ endDate: "2023-01-15", startDate: null });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Both startDate and endDate are required");
    });

    it("should return 400 if endDate is missing", async () => {
      const req = createMockRequest({ startDate: "2023-01-01", endDate: null });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Both startDate and endDate are required");
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
    });

    it("should return 400 for invalid date value (e.g., 2023-02-30 for startDate)", async () => {
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
    });

    it("should return 400 for invalid date value (e.g., 2023-13-01 for endDate)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-13-01", // Invalid month
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe(
        "Invalid date value. Ensure dates like YYYY-MM-DD are correct (e.g., no 2023-02-30).",
      );
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
    });

    it("should return 400 for invalid page (non-numeric)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        page: "abc",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("page must be a positive integer");
    });

    it("should return 400 for invalid page (zero)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        page: "0",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("page must be a positive integer");
    });

    it("should return 400 for invalid page (negative)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        page: "-1",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("page must be a positive integer");
    });

    it("should return 400 for invalid pageSize (non-numeric)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        pageSize: "xyz",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("pageSize must be a positive integer");
    });

    it("should return 400 for invalid pageSize (zero)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        pageSize: "0",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("pageSize must be a positive integer");
    });

    it("should return 400 for invalid pageSize (negative)", async () => {
      const req = createMockRequest({
        startDate: "2023-01-01",
        endDate: "2023-01-15",
        pageSize: "-5",
      });
      const response = await GET(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("pageSize must be a positive integer");
    });

    it("should return 200 for valid parameters (using defaults for page/pageSize)", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe(
        "Validation passed. Data fetching not yet implemented.",
      );
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.pageSize).toBe(10);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate, page: 1, pageSize: 10 },
        "Outstanding balances analytics request",
      );
    });

    it("should return 200 for valid parameters (with custom page/pageSize)", async () => {
      const startDate = "2023-02-01";
      const endDate = "2023-02-28";
      const page = "2";
      const pageSize = "5";
      const req = createMockRequest({ startDate, endDate, page, pageSize });
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe(
        "Validation passed. Data fetching not yet implemented.",
      );
      expect(json.pagination.page).toBe(2);
      expect(json.pagination.pageSize).toBe(5);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate, page: 2, pageSize: 5 },
        "Outstanding balances analytics request",
      );
    });

    it("should return 200 when startDate and endDate are the same valid day", async () => {
      const date = "2023-01-10";
      const req = createMockRequest({ startDate: date, endDate: date });
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate: date, endDate: date, page: 1, pageSize: 10 },
        "Outstanding balances analytics request",
      );
    });
  });

  describe("General Error Handling", () => {
    it("should return 500 and log error if new URL() throws an error (simulated)", async () => {
      // For this test, we don't use createMockRequest as we want to simulate URL constructor failure
      const req = new NextRequest(
        "http://localhost/api/analytics/outstanding-balances?startDate=2023-01-01&endDate=2023-01-15",
      );
      const urlError = new Error(
        "Simulated unexpected error during URL construction",
      );

      // Temporarily break the global URL constructor for this test case
      const mockUrlImplementation = vi.fn(() => {
        throw urlError;
      });
      global.URL = Object.assign(mockUrlImplementation, originalURL); // originalURL is saved in beforeEach

      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalledWith(
        urlError,
        "Error in outstanding balances analytics route",
      );
    });
  });
});
