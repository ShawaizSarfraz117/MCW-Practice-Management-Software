import { describe, it, expect, beforeEach, vi } from "vitest";
import { startOfMonth, endOfMonth } from "date-fns";
import { Prisma } from "@prisma/client";
import { createRequest } from "@mcw/utils";

// Mock the database module first before any imports that use it
vi.mock("@mcw/database", () => {
  const mockPaymentAggregate = vi.fn();
  const mockInvoiceFindMany = vi.fn();
  const mockAppointmentGroupBy = vi.fn();
  const mockAppointmentFindMany = vi.fn();
  const mockAppointmentAggregate = vi.fn();
  const mockSurveyAnswersGroupBy = vi.fn();

  return {
    prisma: {
      payment: { aggregate: mockPaymentAggregate },
      invoice: { findMany: mockInvoiceFindMany },
      appointment: {
        groupBy: mockAppointmentGroupBy,
        findMany: mockAppointmentFindMany,
        aggregate: mockAppointmentAggregate,
      },
      surveyAnswers: { groupBy: mockSurveyAnswersGroupBy },
    },
  };
});

// Import after mocking
import { GET } from "@/api/analytics/route";

// Get references to the mocked functions
const { prisma } = await import("@mcw/database");
const mockPaymentAggregate = prisma.payment.aggregate as ReturnType<
  typeof vi.fn
>;
const mockInvoiceFindMany = prisma.invoice.findMany as ReturnType<typeof vi.fn>;
const mockAppointmentGroupBy = prisma.appointment.groupBy as ReturnType<
  typeof vi.fn
>;
const mockAppointmentAggregate = prisma.appointment.aggregate as ReturnType<
  typeof vi.fn
>;
const mockAppointmentFindMany = prisma.appointment.findMany as ReturnType<
  typeof vi.fn
>;
const mockSurveyAnswersGroupBy = prisma.surveyAnswers.groupBy as ReturnType<
  typeof vi.fn
>;

describe("Analytics API Unit Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  // Helper function to create mock invoice with payments
  const createMockInvoice = (amount: number, paidAmount: number) => ({
    id: `inv-${Math.random()}`,
    amount: new Prisma.Decimal(amount),
    status: "SENT",
    Payment:
      paidAmount > 0
        ? [
            {
              id: `pay-${Math.random()}`,
              amount: new Prisma.Decimal(paidAmount),
            },
          ]
        : [],
  });

  // Helper function to create mock unique clients
  const createMockUniqueClients = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      client_group_id: `group-${i + 1}`,
    }));
  };

  describe("GET /api/analytics", () => {
    it("should handle this month range correctly", async () => {
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);

      // Mock payment aggregates for each day (we'll mock just a few days for simplicity)
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(500) },
        _min: { amount: new Prisma.Decimal(500) },
        _max: { amount: new Prisma.Decimal(500) },
      });

      // Mock appointment groupBy
      mockAppointmentGroupBy.mockResolvedValueOnce([
        { status: "SHOW", _count: { status: 1 } },
        { status: "NO_SHOW", _count: { status: 1 } },
      ]);

      // Mock surveyAnswers groupBy
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 1 } },
        { status: "ASSIGNED", _count: { status: 1 } },
      ]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        createMockInvoice(3000, 500), // 3000 invoice with 500 paid
      ]);

      // Mock uninvoiced appointments aggregate
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { appointment_fee: new Prisma.Decimal(1000) },
        _min: { appointment_fee: new Prisma.Decimal(1000) },
        _max: { appointment_fee: new Prisma.Decimal(1000) },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(createMockUniqueClients(3));

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
      expect(data.outstanding).toBe(2500); // 3000 invoice - 500 paid = 2500 unpaid
      expect(data.uninvoiced).toBe("1000"); // 1000 from uninvoiced appointment (Prisma Decimal serialized as string)
      expect(data.appointments).toBe(2);
      expect(data.appointmentsChart).toBeDefined();
      expect(Array.isArray(data.appointmentsChart)).toBe(true);
      expect(data.appointmentsChart).toEqual([
        { name: "Show", value: 1 },
        { name: "No Show", value: 1 },
        { name: "Canceled", value: 0 },
        { name: "Late Canceled", value: 0 },
        { name: "Clinician Canceled", value: 0 },
      ]);
      expect(data.notes).toBe(2);
      expect(data.notesChart).toBeDefined();
      expect(Array.isArray(data.notesChart)).toBe(true);
      expect(data.notesChart).toEqual([
        { name: "Assigned", value: 1 },
        { name: "In Progress", value: 0 },
        { name: "Completed", value: 1 },
        { name: "Submitted", value: 0 },
      ]);
      expect(data.clients).toBe(3); // 3 unique client groups

      // Verify appointment groupBy was called
      expect(mockAppointmentGroupBy).toHaveBeenCalledWith({
        by: ["status"],
        where: {
          start_date: { gte: startDate, lte: endDate },
        },
        _count: {
          status: true,
        },
      });
    });

    it("should handle last month range correctly", async () => {
      // Mock payment aggregates
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(1000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1000) },
        _min: { amount: new Prisma.Decimal(1000) },
        _max: { amount: new Prisma.Decimal(1000) },
      });

      // Mock appointment groupBy with empty results
      mockAppointmentGroupBy.mockResolvedValueOnce([]);

      // Mock surveyAnswers groupBy with empty results
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        {
          id: "2",
          amount: new Prisma.Decimal(2000),
          status: "SENT",
          Payment: [{ id: "p2", amount: new Prisma.Decimal(1000) }],
        },
      ]);

      // Mock uninvoiced appointments aggregate (no uninvoiced)
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: null },
        _count: { _all: 0 },
        _avg: { appointment_fee: null },
        _min: { appointment_fee: null },
        _max: { appointment_fee: null },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(createMockUniqueClients(0));

      const request = createRequest("/api/analytics?range=lastMonth");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(data.outstanding).toBe(1000); // 2000 - 1000 paid
      expect(data.uninvoiced).toBe(null); // No uninvoiced appointments returns null
      expect(data.appointments).toBe(0);
      expect(data.appointmentsChart).toBeDefined();
      expect(data.notes).toBe(0);
      expect(data.notesChart).toBeDefined();
      expect(data.clients).toBe(0); // No clients in last month
    });

    it("should handle last 30 days range correctly", async () => {
      // Mock payment aggregates
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(1500) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1500) },
        _min: { amount: new Prisma.Decimal(1500) },
        _max: { amount: new Prisma.Decimal(1500) },
      });

      // Mock appointment groupBy
      mockAppointmentGroupBy.mockResolvedValueOnce([
        { status: "SHOW", _count: { status: 3 } },
      ]);

      // Mock surveyAnswers groupBy
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 3 } },
      ]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        createMockInvoice(2500, 1500), // 2500 invoice with 1500 paid
      ]);

      // Mock uninvoiced appointments aggregate
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: new Prisma.Decimal(500) },
        _count: { _all: 1 },
        _avg: { appointment_fee: new Prisma.Decimal(500) },
        _min: { appointment_fee: new Prisma.Decimal(500) },
        _max: { appointment_fee: new Prisma.Decimal(500) },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(createMockUniqueClients(2));

      const request = createRequest("/api/analytics?range=last30days");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(data.outstanding).toBe(1000); // 2500 - 1500 paid
      expect(data.uninvoiced).toBe("500"); // Prisma Decimal serialized as string
      expect(data.appointments).toBe(3);
      expect(data.appointmentsChart).toBeDefined();
      expect(data.notes).toBe(3);
      expect(data.notesChart).toBeDefined();
      expect(data.clients).toBe(2); // 2 unique clients
    });

    it("should handle this year range correctly", async () => {
      // Mock payment aggregates
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(5000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(5000) },
        _min: { amount: new Prisma.Decimal(5000) },
        _max: { amount: new Prisma.Decimal(5000) },
      });

      // Mock appointment groupBy
      mockAppointmentGroupBy.mockResolvedValueOnce([
        { status: "SHOW", _count: { status: 10 } },
        { status: "NO_SHOW", _count: { status: 2 } },
        { status: "CANCELLED", _count: { status: 3 } },
      ]);

      // Mock surveyAnswers groupBy
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 10 } },
        { status: "ASSIGNED", _count: { status: 5 } },
      ]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        createMockInvoice(10000, 5000), // 10000 invoice with 5000 paid
      ]);

      // Mock uninvoiced appointments aggregate
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: new Prisma.Decimal(2000) },
        _count: { _all: 1 },
        _avg: { appointment_fee: new Prisma.Decimal(2000) },
        _min: { appointment_fee: new Prisma.Decimal(2000) },
        _max: { appointment_fee: new Prisma.Decimal(2000) },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(
        createMockUniqueClients(10),
      );

      const request = createRequest("/api/analytics?range=thisYear");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(data.incomeChart.length).toBeGreaterThan(0);
      // For year range, chart should show months
      expect(data.incomeChart[0]).toHaveProperty("date");
      expect(data.incomeChart[0]).toHaveProperty("value");
      expect(data.outstanding).toBe(5000); // 10000 - 5000 paid
      expect(data.uninvoiced).toBe("2000"); // Prisma Decimal serialized as string
      expect(data.appointments).toBe(15);
      expect(data.appointmentsChart).toBeDefined();
      expect(data.notes).toBe(15);
      expect(data.notesChart).toBeDefined();
      expect(data.clients).toBe(10); // 10 unique clients
    });

    it("should handle custom date range correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Mock payment aggregates
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(2000) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(2000) },
        _min: { amount: new Prisma.Decimal(2000) },
        _max: { amount: new Prisma.Decimal(2000) },
      });

      // Mock appointment groupBy
      mockAppointmentGroupBy.mockResolvedValueOnce([
        { status: "SHOW", _count: { status: 2 } },
      ]);

      // Mock surveyAnswers groupBy
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 2 } },
      ]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        createMockInvoice(3000, 2000), // 3000 invoice with 2000 paid
      ]);

      // Mock uninvoiced appointments aggregate
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: null },
        _count: { _all: 0 },
        _avg: { appointment_fee: null },
        _min: { appointment_fee: null },
        _max: { appointment_fee: null },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(createMockUniqueClients(1));

      const request = createRequest(
        `/api/analytics?range=custom&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(data.outstanding).toBe(1000); // 3000 - 2000 paid
      expect(data.uninvoiced).toBe(null); // No uninvoiced appointments returns null
      expect(data.appointments).toBe(2);
      expect(data.appointmentsChart).toBeDefined();
      expect(data.notes).toBe(2);
      expect(data.notesChart).toBeDefined();
      expect(data.clients).toBe(1); // 1 unique client
    });

    it("should handle custom date range with MM/DD/YYYY format", async () => {
      // Mock payment aggregates
      mockPaymentAggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(1500) },
        _count: { _all: 1 },
        _avg: { amount: new Prisma.Decimal(1500) },
        _min: { amount: new Prisma.Decimal(1500) },
        _max: { amount: new Prisma.Decimal(1500) },
      });

      // Mock appointment groupBy
      mockAppointmentGroupBy.mockResolvedValueOnce([
        { status: "SHOW", _count: { status: 1 } },
      ]);

      // Mock surveyAnswers groupBy
      mockSurveyAnswersGroupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 1 } },
      ]);

      // Mock unpaid invoices
      mockInvoiceFindMany.mockResolvedValueOnce([
        createMockInvoice(2000, 1500), // 2000 invoice with 1500 paid
      ]);

      // Mock uninvoiced appointments aggregate
      mockAppointmentAggregate.mockResolvedValueOnce({
        _sum: { appointment_fee: new Prisma.Decimal(500) },
        _count: { _all: 1 },
        _avg: { appointment_fee: new Prisma.Decimal(500) },
        _min: { appointment_fee: new Prisma.Decimal(500) },
        _max: { appointment_fee: new Prisma.Decimal(500) },
      });

      // Mock unique clients count
      mockAppointmentFindMany.mockResolvedValueOnce(createMockUniqueClients(1));

      const request = createRequest(
        `/api/analytics?range=custom&startDate=01/15/2024&endDate=01/31/2024`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(data.outstanding).toBe(500); // 2000 - 1500 paid
      expect(data.uninvoiced).toBe("500"); // Prisma Decimal serialized as string
      expect(data.appointments).toBe(1);
      expect(data.appointmentsChart).toBeDefined();
      expect(data.notes).toBe(1);
      expect(data.notesChart).toBeDefined();
      expect(data.clients).toBe(1); // 1 unique client
    });

    it("should return 400 for invalid custom date range", async () => {
      const request = createRequest("/api/analytics?range=custom");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing custom date range");
    });

    it("should return 400 for invalid custom dates", async () => {
      const request = createRequest(
        "/api/analytics?range=custom&startDate=invalid&endDate=invalid",
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid custom date(s)");
    });

    it("should handle database errors gracefully", async () => {
      mockPaymentAggregate.mockRejectedValueOnce(new Error("DB Error"));

      const request = createRequest("/api/analytics");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.message).toBe("DB Error");
      expect(data.error.issueId).toBeDefined();
    });
  });
});
