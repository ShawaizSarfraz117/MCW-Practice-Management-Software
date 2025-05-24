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
});
