// Unit tests for /api/analytics/income route
import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";
import prismaMock from "@mcw/database/mock";
import { GET } from "@/api/analytics/income/route";
import { createRequest } from "@mcw/utils";
import { NextRequest } from "next/server";

// Mock the logger to prevent actual logging during tests
// vi.mock("@mcw/logger", () => ({
//   logger: {
//     info: vi.fn(),
//     error: vi.fn(),
//   },
// }));

describe("GET /api/analytics/income", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return successful data retrieval and processed metrics", async () => {
    const mockRawData = [
      {
        metric_date: new Date("2023-01-01T00:00:00.000Z"),
        total_gross_income: "100.00",
        total_net_income: "80.00",
        total_client_payments: "70.00",
      },
      {
        metric_date: new Date("2023-01-02T00:00:00.000Z"),
        total_gross_income: "200.00",
        total_net_income: "180.00",
        total_client_payments: "170.00",
      },
    ];
    const expectedProcessedData = {
      data: [
        {
          metric_date: "2023-01-01",
          total_gross_income: 100.0,
          total_net_income: 80.0,
          total_client_payments: 70.0,
        },
        {
          metric_date: "2023-01-02",
          total_gross_income: 200.0,
          total_net_income: 180.0,
          total_client_payments: 170.0,
        },
      ],
    };

    (prismaMock.$queryRaw as unknown as Mock).mockResolvedValue(mockRawData);

    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-01&endDate=2023-01-02",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual(expectedProcessedData);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("should return an empty data array when no income data exists for the given range", async () => {
    (prismaMock.$queryRaw as unknown as Mock).mockResolvedValue([]);

    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-10&endDate=2023-01-12",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ data: [] });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("should return 500 and error response when prisma.$queryRaw throws an error", async () => {
    (prismaMock.$queryRaw as unknown as Mock).mockRejectedValue(
      new Error("Database failure"),
    );

    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-10&endDate=2023-01-12",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(500);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Failed to perform operation");
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("should return 400 and error when startDate is in an invalid format", async () => {
    const req = createRequest(
      "/api/analytics/income?startDate=invalid-date&endDate=2023-01-12",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Invalid input");
    expect(jsonResponse).toHaveProperty("details");
    expect(Array.isArray(jsonResponse.details)).toBe(true);
    expect(
      jsonResponse.details.some(
        (err: unknown) =>
          typeof err === "object" &&
          err !== null &&
          JSON.stringify(err).includes("startDate"),
      ),
    ).toBe(true);
  });

  it("should return 400 and error when endDate is in an invalid format", async () => {
    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-10&endDate=invalid-date",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Invalid input");
    expect(jsonResponse).toHaveProperty("details");
    expect(Array.isArray(jsonResponse.details)).toBe(true);
    expect(
      jsonResponse.details.some(
        (err: unknown) =>
          typeof err === "object" &&
          err !== null &&
          JSON.stringify(err).includes("endDate"),
      ),
    ).toBe(true);
  });

  it("should return 400 and error when endDate is before startDate", async () => {
    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-12&endDate=2023-01-10",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Invalid input");
    expect(jsonResponse).toHaveProperty("details");
    expect(Array.isArray(jsonResponse.details)).toBe(true);
    expect(
      jsonResponse.details.some(
        (err: unknown) =>
          typeof err === "object" &&
          err !== null &&
          (JSON.stringify(err).toLowerCase().includes("enddate") ||
            JSON.stringify(err).toLowerCase().includes("startdate")),
      ),
    ).toBe(true);
  });

  it("should return 400 and error when startDate is missing", async () => {
    const req = createRequest(
      "/api/analytics/income?endDate=2023-01-12",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Invalid input");
    expect(jsonResponse).toHaveProperty("details");
    expect(Array.isArray(jsonResponse.details)).toBe(true);
    expect(
      jsonResponse.details.some(
        (err: unknown) =>
          typeof err === "object" &&
          err !== null &&
          JSON.stringify(err).includes("startDate"),
      ),
    ).toBe(true);
  });

  it("should return 400 and error when endDate is missing", async () => {
    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-10",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse).toHaveProperty("error", "Invalid input");
    expect(jsonResponse).toHaveProperty("details");
    expect(Array.isArray(jsonResponse.details)).toBe(true);
    expect(
      jsonResponse.details.some(
        (err: unknown) =>
          typeof err === "object" &&
          err !== null &&
          JSON.stringify(err).includes("endDate"),
      ),
    ).toBe(true);
  });

  it("should convert decimal string values to numbers in the response", async () => {
    const mockRawData = [
      {
        metric_date: new Date("2023-01-15T00:00:00.000Z"),
        total_gross_income: "123.45",
        total_net_income: "100.00",
        total_client_payments: "99.99",
      },
    ];
    (prismaMock.$queryRaw as unknown as Mock).mockResolvedValue(mockRawData);

    const req = createRequest(
      "/api/analytics/income?startDate=2023-01-15&endDate=2023-01-15",
    ) as NextRequest;
    const response = await GET(req);

    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.data).toHaveLength(1);
    const result = jsonResponse.data[0];
    expect(typeof result.total_gross_income).toBe("number");
    expect(result.total_gross_income).toBe(123.45);
    expect(typeof result.total_net_income).toBe("number");
    expect(result.total_net_income).toBe(100.0);
    expect(typeof result.total_client_payments).toBe("number");
    expect(result.total_client_payments).toBe(99.99);
  });
});
