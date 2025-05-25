import { describe, it, expect, beforeEach, vi } from "vitest";
import prismaMock from "@mcw/database/mock";
import { GET } from "@/app/api/analytics/outstanding-balances/route";
// import { NextRequest } from 'next/server'; // NextRequest might not be needed directly in many unit tests if createRequest handles it.
import { createRequest } from "@mcw/utils";
import { logger } from "@mcw/logger"; // Import logger for spying

// Spy on logger.error
const errorLogSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

describe("GET /api/analytics/outstanding-balances Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    errorLogSpy.mockClear(); // Clear spy calls before each test
    // Mock logger to prevent console output during tests, if desired
    // vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  it("should have a placeholder test to ensure setup is correct", () => {
    expect(true).toBe(true);
  });

  // Interfaces for mocking (mirroring those in the route handler)
  interface OutstandingBalanceItemFromDb {
    clientGroupId: string;
    clientGroupName: string;
    responsibleClientFirstName: string | null;
    responsibleClientLastName: string | null;
    totalBilled: string | number;
    totalPaid: string | number;
    outstandingBalance: string | number;
  }

  interface CountQueryResult {
    totalCount: bigint | number;
  }

  it("should return 200 with paginated data and correct pagination on successful data retrieval", async () => {
    // Arrange
    const mockPage = 1;
    const mockPageSize = 2;
    const mockRawData: OutstandingBalanceItemFromDb[] = [
      {
        clientGroupId: "grp1",
        clientGroupName: "Group Alpha",
        responsibleClientFirstName: "John",
        responsibleClientLastName: "Doe",
        totalBilled: "100.50",
        totalPaid: "50.25",
        outstandingBalance: "50.25",
      },
      {
        clientGroupId: "grp2",
        clientGroupName: "Group Beta",
        responsibleClientFirstName: "Jane",
        responsibleClientLastName: "Smith",
        totalBilled: "200.00",
        totalPaid: "100.00",
        outstandingBalance: "100.00",
      },
      {
        clientGroupId: "grp3",
        clientGroupName: "Group Gamma",
        responsibleClientFirstName: null,
        responsibleClientLastName: null,
        totalBilled: "300.75",
        totalPaid: "150.00",
        outstandingBalance: "150.75",
      },
    ];
    // Simulate that only pageSize items are returned by the data query based on limit/offset
    const paginatedMockRawData = mockRawData.slice(0, mockPageSize);
    const mockRawCount: CountQueryResult[] = [
      { totalCount: BigInt(mockRawData.length) },
    ];

    prismaMock.$queryRaw
      .mockResolvedValueOnce(paginatedMockRawData) // For data query
      .mockResolvedValueOnce(mockRawCount); // For count query

    const req = createRequest(
      `/api/analytics/outstanding-balances?page=${mockPage}&pageSize=${mockPageSize}`,
    );

    // Act
    const response = await GET(req);
    const jsonResponse = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(jsonResponse.data).toHaveLength(paginatedMockRawData.length);

    // Check data processing
    paginatedMockRawData.forEach((mockItem, index) => {
      expect(jsonResponse.data[index]).toEqual({
        clientGroupId: mockItem.clientGroupId,
        clientGroupName: mockItem.clientGroupName,
        responsibleClientFirstName:
          mockItem.responsibleClientFirstName || undefined,
        responsibleClientLastName:
          mockItem.responsibleClientLastName || undefined,
        totalBilled: parseFloat(String(mockItem.totalBilled)),
        totalPaid: parseFloat(String(mockItem.totalPaid)),
        outstandingBalance: parseFloat(String(mockItem.outstandingBalance)),
      });
    });

    expect(jsonResponse.pagination).toEqual({
      page: mockPage,
      limit: mockPageSize,
      total: mockRawData.length, // Total records from count query
      totalPages: Math.ceil(mockRawData.length / mockPageSize),
    });
  });

  it("should return 200 with empty data array and correct pagination when no outstanding balances are found", async () => {
    // Arrange
    const mockEmptyRawData: OutstandingBalanceItemFromDb[] = [];
    const mockEmptyRawCount: CountQueryResult[] = [{ totalCount: BigInt(0) }];

    prismaMock.$queryRaw
      .mockResolvedValueOnce(mockEmptyRawData) // For data query
      .mockResolvedValueOnce(mockEmptyRawCount); // For count query

    const req = createRequest("/api/analytics/outstanding-balances"); // Use default params

    // Act
    const response = await GET(req);
    const jsonResponse = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(jsonResponse.data).toBeInstanceOf(Array);
    expect(jsonResponse.data).toHaveLength(0);
    expect(jsonResponse.pagination).toEqual({
      page: 1, // Default page
      limit: 10, // Default pageSize
      total: 0,
      totalPages: 0, // Math.ceil(0 / 10)
    });
  });

  it("should return 500 and log an error when a database error occurs", async () => {
    // Arrange
    const dbError = new Error("Simulated Database Error");
    prismaMock.$queryRaw.mockRejectedValueOnce(dbError);

    const req = createRequest("/api/analytics/outstanding-balances");

    // Act
    const response = await GET(req);
    const jsonResponse = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(jsonResponse.error).toBe("Failed to retrieve outstanding balances");
    expect(jsonResponse.details).toBe("Simulated Database Error");

    expect(errorLogSpy).toHaveBeenCalledTimes(1);
    // Verify the logger was called with the original error and the constructed message
    expect(errorLogSpy).toHaveBeenCalledWith(
      dbError,
      "Failed to GET /api/analytics/outstanding-balances: Simulated Database Error",
    );
  });

  // Group all input validation tests
  describe("Input Validation Tests", () => {
    it("should pass input validation and proceed to data fetching when all parameters are valid", async () => {
      // Arrange
      prismaMock.$queryRaw
        .mockResolvedValueOnce([]) // Mock for data query (empty is fine)
        .mockResolvedValueOnce([{ totalCount: BigInt(0) }]); // Mock for count query

      const startDateStr = "2024-01-01";
      const endDateStr = "2024-03-31";
      const pageStr = "1";
      const pageSizeStr = "5";

      const req = createRequest(
        `/api/analytics/outstanding-balances?startDate=${startDateStr}&endDate=${endDateStr}&page=${pageStr}&pageSize=${pageSizeStr}`,
      );
      prismaMock.$queryRaw.mockClear(); // ensure this test does not affect others for call count

      // Act
      const response = await GET(req);
      const jsonResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
      expect(jsonResponse.data).toEqual([]);
      expect(jsonResponse.pagination).toEqual({
        page: Number(pageStr),
        limit: Number(pageSizeStr),
        total: 0,
        totalPages: 0,
      });
    });

    it("should return 400 if startDate is provided with an invalid format", async () => {
      // Arrange
      const invalidStartDate = "2023-13-01";
      const req = createRequest(
        `/api/analytics/outstanding-balances?startDate=${invalidStartDate}`,
      );
      prismaMock.$queryRaw.mockClear();

      // Act
      const response = await GET(req);
      const jsonResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(jsonResponse.error).toBe("Invalid input");
      expect(jsonResponse.details).toBe(
        "startDate must be a valid YYYY-MM-DD date.",
      );
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 if endDate is provided with an invalid format", async () => {
      // Arrange
      const invalidEndDate = "2023-02-30";
      const req = createRequest(
        `/api/analytics/outstanding-balances?endDate=${invalidEndDate}`,
      );
      prismaMock.$queryRaw.mockClear();

      // Act
      const response = await GET(req);
      const jsonResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(jsonResponse.error).toBe("Invalid input");
      expect(jsonResponse.details).toBe(
        "endDate must be a valid YYYY-MM-DD date.",
      );
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("should return 400 if endDate is chronologically before startDate", async () => {
      // Arrange
      const startDate = "2023-03-15";
      const earlierEndDate = "2023-03-01";
      const req = createRequest(
        `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${earlierEndDate}`,
      );
      prismaMock.$queryRaw.mockClear();

      // Act
      const response = await GET(req);
      const jsonResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(jsonResponse.error).toBe("Invalid input");
      expect(jsonResponse.details).toBe("endDate cannot be before startDate.");
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    describe("Page Parameter Validation", () => {
      const invalidPageTestCases = [
        { pageParam: "abc", description: "non-integer" },
        { pageParam: "0", description: "zero" },
        { pageParam: "-1", description: "negative" },
        { pageParam: "1.5", description: "float" },
      ];

      it.each(invalidPageTestCases)(
        "should return 400 if page parameter is $description ($pageParam)",
        async ({ pageParam }) => {
          const req = createRequest(
            `/api/analytics/outstanding-balances?page=${pageParam}`,
          );
          prismaMock.$queryRaw.mockClear();

          const response = await GET(req);
          const jsonResponse = await response.json();

          expect(response.status).toBe(400);
          expect(jsonResponse.error).toBe("Invalid input");
          expect(jsonResponse.details).toBe("page must be a positive integer.");
          expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
        },
      );
    });

    describe("PageSize Parameter Validation", () => {
      const invalidPageSizeTestCases = [
        { pageSizeParam: "xyz", description: "non-integer" },
        { pageSizeParam: "0", description: "zero" },
        { pageSizeParam: "-5", description: "negative" },
        { pageSizeParam: "5.5", description: "float" },
      ];

      it.each(invalidPageSizeTestCases)(
        "should return 400 if pageSize parameter is $description ($pageSizeParam)",
        async ({ pageSizeParam }) => {
          const req = createRequest(
            `/api/analytics/outstanding-balances?pageSize=${pageSizeParam}`,
          );
          prismaMock.$queryRaw.mockClear();

          const response = await GET(req);
          const jsonResponse = await response.json();

          expect(response.status).toBe(400);
          expect(jsonResponse.error).toBe("Invalid input");
          expect(jsonResponse.details).toBe(
            "pageSize must be a positive integer.",
          );
          expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
        },
      );
    });
  }); // End of Input Validation Tests describe block

  // Detailed test cases will be added in subsequent subtasks.
});
