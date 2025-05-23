import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/outstanding-balances/route";
import { logger } from "@mcw/logger";
import { prisma } from "@mcw/database"; // Import prisma

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

// Mock prisma
vi.mock("@mcw/database", async (importOriginal) => {
  const actualModule = await importOriginal<typeof import("@mcw/database")>();
  return {
    ...actualModule,
    prisma: {
      ...(actualModule.prisma as typeof actualModule.prisma),
      $queryRaw: vi.fn(),
    },
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
    // Reset the mock before each test, specific mocks will be set in individual tests
    vi.mocked(prisma.$queryRaw).mockReset();
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
      const page = "1";
      const pageSize = "10";

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate, page, pageSize },
        "Outstanding balances request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Outstanding balances queries executed",
      );
    });

    it("should return 200 for valid parameters (with custom page/pageSize)", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const page = "2";
      const pageSize = "5";

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      const req = createMockRequest({ startDate, endDate, page, pageSize });
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate, page, pageSize },
        "Outstanding balances request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Outstanding balances queries executed",
      );
    });

    it("should return 200 when startDate and endDate are the same valid day", async () => {
      const date = "2023-01-10";
      const page = "1";
      const pageSize = "10";

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      const req = createMockRequest({ startDate: date, endDate: date });
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        { startDate: date, endDate: date, page, pageSize },
        "Outstanding balances request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Outstanding balances queries executed",
      );
    });
  });

  describe("SQL Query, Data Transformation & Pagination", () => {
    it("should call prisma.$queryRaw for data and count, transform results, and include pagination", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      const page = "1";
      const pageSize = "5";

      const mockDataResult = [
        {
          client_group_id: "cg-1",
          client_group_name: "Group Alpha",
          responsible_client_first_name: "John",
          responsible_client_last_name: "Doe",
          total_amount_invoiced: "1000.00",
          total_amount_paid: "800.00",
          total_amount_unpaid: "200.00",
        },
        {
          client_group_id: "cg-2",
          client_group_name: "Group Beta",
          responsible_client_first_name: "Jane",
          responsible_client_last_name: "Smith",
          total_amount_invoiced: "500.50",
          total_amount_paid: "500.50",
          total_amount_unpaid: "0.00",
        },
      ];
      const mockCountResult = [{ count: BigInt(27) }]; // Total 27 items for pagination example

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce(mockDataResult) // For data query
        .mockResolvedValueOnce(mockCountResult); // For count query

      const req = createMockRequest({ startDate, endDate, page, pageSize });
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();

      const expectedFormattedData = [
        {
          clientGroupId: "cg-1",
          clientGroupName: "Group Alpha",
          responsibleClientFirstName: "John",
          responsibleClientLastName: "Doe",
          totalAmountInvoiced: 1000.0,
          totalAmountPaid: 800.0,
          totalAmountUnpaid: 200.0,
        },
        {
          clientGroupId: "cg-2",
          clientGroupName: "Group Beta",
          responsibleClientFirstName: "Jane",
          responsibleClientLastName: "Smith",
          totalAmountInvoiced: 500.5,
          totalAmountPaid: 500.5,
          totalAmountUnpaid: 0.0,
        },
      ];
      expect(json.data).toEqual(expectedFormattedData);

      expect(json.pagination).toEqual({
        totalItems: 27,
        currentPage: 1,
        pageSize: 5,
        totalPages: Math.ceil(27 / 5), // 6
      });

      expect(logger.info).toHaveBeenCalledWith(
        { startDate, endDate, page, pageSize },
        "Outstanding balances request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Outstanding balances queries executed",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      // Check data query call
      const dataQueryCall = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      expect(dataQueryCall).toHaveProperty("sql");
      expect(dataQueryCall).toHaveProperty("values");
      expect(dataQueryCall.values).toContain(startDate);
      expect(dataQueryCall.values).toContain(endDate);
      expect(dataQueryCall.values).toContain(parseInt(pageSize, 10)); // pageSize
      expect(dataQueryCall.values).toContain(0); // offset for page 1
      // Check count query call
      const countQueryCall = vi.mocked(prisma.$queryRaw).mock.calls[1][0];
      expect(countQueryCall).toHaveProperty("sql");
      expect(countQueryCall).toHaveProperty("values");
      expect(countQueryCall.values).toContain(startDate);
      expect(countQueryCall.values).toContain(endDate);
    });

    it("should handle empty data result correctly with pagination", async () => {
      const startDate = "2023-03-01";
      const endDate = "2023-03-31";
      const page = "1";
      const pageSize = "10";

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([]) // Empty data
        .mockResolvedValueOnce([{ count: BigInt(0) }]); // Zero count

      const req = createMockRequest({ startDate, endDate, page, pageSize });
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual([]);
      expect(json.pagination).toEqual({
        totalItems: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryTime: expect.any(Number) }),
        "Outstanding balances queries executed",
      );
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it("should return 500 if data query fails", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
        new Error("Data query failed"),
      );

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalledWith(
        new Error("Data query failed"),
        "Error in outstanding balances analytics route",
      );
    });

    it("should return 500 if count query fails after successful data query", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-15";
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([]) // Data query succeeds
        .mockRejectedValueOnce(new Error("Count query failed")); // Count query fails

      const req = createMockRequest({ startDate, endDate });
      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Internal server error");
      expect(logger.error).toHaveBeenCalledWith(
        new Error("Count query failed"),
        "Error in outstanding balances analytics route",
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
