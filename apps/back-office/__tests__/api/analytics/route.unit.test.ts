import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/api/analytics/route";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Prisma } from "@prisma/client";
import { createRequest } from "@mcw/utils";
import prismaMock from "@mcw/database/mock";

// Mock the database module to use the shared prismaMock
vi.mock("@mcw/database", async () => ({
  ...(await vi.importActual("@mcw/database")),
  prisma: prismaMock,
}));

describe("Analytics API Unit Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  describe("GET /api/analytics", () => {
    it("should handle this month range correctly", async () => {
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);

      // Mock all Prisma aggregate calls
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(1500) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1500) },
        _min: { amount: new Prisma.Decimal(1500) },
        _max: { amount: new Prisma.Decimal(1500) },
      });

      // Mock outstanding invoices aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(3000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(3000) },
        _min: { amount: new Prisma.Decimal(3000) },
        _max: { amount: new Prisma.Decimal(3000) },
      });

      // Mock total paid amount aggregate
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1000) },
        _min: { amount: new Prisma.Decimal(1000) },
        _max: { amount: new Prisma.Decimal(1000) },
      });

      // Mock uninvoiced amount aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1000) },
        _min: { amount: new Prisma.Decimal(1000) },
        _max: { amount: new Prisma.Decimal(1000) },
      });

      prismaMock.appointment.count.mockResolvedValueOnce(2);
      prismaMock.surveyAnswers.count.mockResolvedValueOnce(2);

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        income: "1500",
        outstanding: 2000, // 3000 (total unpaid) - 1000 (paid)
        uninvoiced: 1000,
        appointments: 2,
        notes: 2,
      });

      // Verify Prisma calls
      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          payment_date: { gte: startDate, lte: endDate },
          status: "Completed",
        },
      });
    });

    it("should handle last month range correctly", async () => {
      const lastMonth = subMonths(new Date(), 1);
      const startDate = startOfMonth(lastMonth);
      const endDate = endOfMonth(lastMonth);

      // Mock all Prisma aggregate calls
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1000) },
        _min: { amount: new Prisma.Decimal(1000) },
        _max: { amount: new Prisma.Decimal(1000) },
      });

      // Mock outstanding invoices aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(2000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(2000) },
        _min: { amount: new Prisma.Decimal(2000) },
        _max: { amount: new Prisma.Decimal(2000) },
      });

      // Mock total paid amount aggregate
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(500) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(500) },
        _min: { amount: new Prisma.Decimal(500) },
        _max: { amount: new Prisma.Decimal(500) },
      });

      // Mock uninvoiced amount aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(0) },
        _count: { _all: 0 },
        _avg: { amount: null },
        _min: { amount: null },
        _max: { amount: null },
      });

      prismaMock.appointment.count.mockResolvedValueOnce(0);
      prismaMock.surveyAnswers.count.mockResolvedValueOnce(0);

      const request = createRequest("/api/analytics?range=lastMonth");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        income: "1000",
        outstanding: 1500, // 2000 (total unpaid) - 500 (paid)
        uninvoiced: 0,
        appointments: 0,
        notes: 0,
      });

      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          payment_date: { gte: startDate, lte: endDate },
          status: "Completed",
        },
      });
    });

    it("should handle custom date range correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Mock all Prisma aggregate calls
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(2000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(2000) },
        _min: { amount: new Prisma.Decimal(2000) },
        _max: { amount: new Prisma.Decimal(2000) },
      });

      // Mock outstanding invoices aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(3000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(3000) },
        _min: { amount: new Prisma.Decimal(3000) },
        _max: { amount: new Prisma.Decimal(3000) },
      });

      // Mock total paid amount aggregate
      prismaMock.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1000) },
        _min: { amount: new Prisma.Decimal(1000) },
        _max: { amount: new Prisma.Decimal(1000) },
      });

      // Mock uninvoiced amount aggregate
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(0) },
        _count: { _all: 0 },
        _avg: { amount: null },
        _min: { amount: null },
        _max: { amount: null },
      });

      prismaMock.appointment.count.mockResolvedValueOnce(2);
      prismaMock.surveyAnswers.count.mockResolvedValueOnce(2);

      const request = createRequest(
        `/api/analytics?range=custom&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        income: "2000",
        outstanding: 2000, // 3000 (total unpaid) - 1000 (paid)
        uninvoiced: 0,
        appointments: 2,
        notes: 2,
      });

      // Verify Prisma calls
      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          payment_date: { gte: startDate, lte: endDate },
          status: "Completed",
        },
      });
    });

    it("should return 400 for invalid custom date range", async () => {
      const request = createRequest("/api/analytics?range=custom");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing custom date range");
    });

    it("should handle database errors gracefully", async () => {
      prismaMock.payment.aggregate.mockRejectedValueOnce(new Error("DB Error"));

      const request = createRequest("/api/analytics");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
