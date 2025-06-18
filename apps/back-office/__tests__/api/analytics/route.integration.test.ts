import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { GET } from "@/api/analytics/route";
import { prisma } from "@mcw/database";
import { cleanupDatabase } from "@mcw/database/test-utils";
import { startOfMonth, subMonths, subDays, startOfYear } from "date-fns";
import { createRequest } from "@mcw/utils";
import { v4 as uuidv4 } from "uuid";

// Mock the logger to prevent actual logging during tests
vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
  },
  getDbLogger: vi.fn(),
}));

describe("Analytics API Integration", () => {
  beforeEach(async () => {
    // Clean up the database before each test to ensure clean state
    await cleanupDatabase(prisma, { verbose: false });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase(prisma, { verbose: false });
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupDatabase(prisma, { verbose: false });
  });

  describe("GET /api/analytics", () => {
    it("should return analytics for this month by default", async () => {
      // Create test data
      const now = new Date();

      // Create a user first
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: "test@example.com",
          password_hash: "hashed_password",
          last_login: new Date(),
        },
      });

      // Create invoices
      await prisma.invoice.create({
        data: {
          amount: 1000,
          status: "OVERDUE",
          invoice_number: "INV-001",
          due_date: new Date(),
          type: "SERVICE",
        },
      });

      const invoice2 = await prisma.invoice.create({
        data: {
          amount: 2000,
          status: "SENT",
          invoice_number: "INV-002",
          due_date: new Date(),
          type: "SERVICE",
        },
      });

      // Create payments
      await prisma.payment.create({
        data: {
          amount: 500,
          payment_date: now,
          status: "Completed",
          invoice_id: invoice2.id,
        },
      });

      // Create appointments - only SHOW status with fees will be counted as uninvoiced
      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 3600000), // Past date to ensure it's counted
          end_date: now,
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 300, // Uninvoiced appointment with fee
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 7200000), // Past date
          end_date: new Date(now.getTime() - 3600000),
          type: "APPOINTMENT",
          status: "NO_SHOW", // This won't be counted due to status
          created_by: user.id,
          appointment_fee: 200, // Won't be included in uninvoiced sum
        },
      });

      // Create a client for survey answers
      const client = await prisma.client.create({
        data: {
          legal_first_name: "Test",
          legal_last_name: "Client",
          is_waitlist: false,
          is_active: true,
          created_at: new Date(),
        },
      });

      // Create a survey template
      const template = await prisma.surveyTemplate.create({
        data: {
          name: "Test Template",
          description: "Test Description",
          content: '{"questions": []}',
          type: "CUSTOM",
          updated_at: new Date(),
          created_at: new Date(),
          is_active: true,
          requires_signature: false,
        },
      });

      // Create survey answers
      await prisma.surveyAnswers.create({
        data: {
          template_id: template.id,
          client_id: client.id,
          content: '{"answers": []}',
          status: "COMPLETED",
          assigned_at: new Date(),
          completed_at: new Date(),
        },
      });

      await prisma.surveyAnswers.create({
        data: {
          template_id: template.id,
          client_id: client.id,
          content: '{"answers": []}',
          status: "ASSIGNED",
          assigned_at: new Date(),
        },
      });

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
      expect(data.incomeChart.length).toBeGreaterThan(0);
      expect(data.outstanding).toBe(2500); // 3000 (total sent/overdue) - 500 (partial payment)
      expect(data.uninvoiced).toBe("500"); // Prisma Decimal serialized as string
      expect(data.appointments).toBe(2);
      expect(data.appointmentsChart).toEqual([
        { name: "Show", value: 1 },
        { name: "No Show", value: 1 },
        { name: "Canceled", value: 0 },
        { name: "Late Canceled", value: 0 },
        { name: "Clinician Canceled", value: 0 },
      ]);
      expect(data.notes).toBe(2);
      expect(data.notesChart).toEqual([
        { name: "Assigned", value: 1 },
        { name: "In Progress", value: 0 },
        { name: "Completed", value: 1 },
        { name: "Submitted", value: 0 },
      ]);
    });

    it("should handle last month range correctly", async () => {
      const lastMonth = subMonths(new Date(), 1);
      const startDate = startOfMonth(lastMonth);

      // Create test data for last month
      const invoice = await prisma.invoice.create({
        data: {
          amount: 1000,
          status: "PAID",
          invoice_number: "INV-003",
          due_date: startDate,
          type: "SERVICE",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 1000,
          payment_date: startDate,
          status: "Completed",
          invoice_id: invoice.id,
        },
      });

      const request = createRequest("/api/analytics?range=lastMonth");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
    });

    it("should handle last 30 days range correctly", async () => {
      const thirtyDaysAgo = subDays(new Date(), 15); // Create data in the middle of the range

      // Create test data for last 30 days
      const invoice = await prisma.invoice.create({
        data: {
          amount: 1500,
          status: "PAID",
          invoice_number: "INV-004",
          due_date: thirtyDaysAgo,
          type: "SERVICE",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 1500,
          payment_date: thirtyDaysAgo,
          status: "Completed",
          invoice_id: invoice.id,
        },
      });

      // Create a user for appointments
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: "test30@example.com",
          password_hash: "hashed_password",
          last_login: new Date(),
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: thirtyDaysAgo,
          end_date: new Date(thirtyDaysAgo.getTime() + 3600000),
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
        },
      });

      const request = createRequest("/api/analytics?range=last30days");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
      expect(data.incomeChart.length).toBe(31); // 30 days + today
      expect(data.appointments).toBe(1);
    });

    it("should handle this year range correctly", async () => {
      const yearStart = startOfYear(new Date());

      // Create test data for this year
      const invoice = await prisma.invoice.create({
        data: {
          amount: 5000,
          status: "PAID",
          invoice_number: "INV-005",
          due_date: yearStart,
          type: "SERVICE",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 5000,
          payment_date: yearStart,
          status: "Completed",
          invoice_id: invoice.id,
        },
      });

      const request = createRequest("/api/analytics?range=thisYear");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
      // For year range, chart should show months
      expect(data.incomeChart[0]).toHaveProperty("date");
      expect(data.incomeChart[0]).toHaveProperty("value");
      expect(data.incomeChart[0].date).toMatch(/^[A-Za-z]{3}$/); // Should be month abbreviation
    });

    it("should handle custom date range correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Create test data for custom range
      const invoice = await prisma.invoice.create({
        data: {
          amount: 2000,
          status: "PAID",
          invoice_number: "INV-006",
          due_date: startDate,
          type: "SERVICE",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 2000,
          payment_date: startDate,
          status: "Completed",
          invoice_id: invoice.id,
        },
      });

      const request = createRequest(
        `/api/analytics?range=custom&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
    });

    it("should handle custom date range with MM/DD/YYYY format", async () => {
      const startDate = new Date("2024-01-15");

      // Create test data for custom range
      const invoice = await prisma.invoice.create({
        data: {
          amount: 1500,
          status: "PAID",
          invoice_number: "INV-007",
          due_date: startDate,
          type: "SERVICE",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 1500,
          payment_date: startDate,
          status: "Completed",
          invoice_id: invoice.id,
        },
      });

      const request = createRequest(
        `/api/analytics?range=custom&startDate=01/15/2024&endDate=01/31/2024`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBeDefined();
      expect(data.incomeChart).toBeDefined();
      expect(Array.isArray(data.incomeChart)).toBe(true);
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

    it("should correctly calculate uninvoiced appointments", async () => {
      // Create a user first
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: "testinvoiced@example.com",
          password_hash: "hashed_password",
          last_login: new Date(),
        },
      });

      // Create appointments with fees - all in the past to be counted
      const now = new Date();
      const invoicedAppointment = await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 7200000), // 2 hours ago
          end_date: new Date(now.getTime() - 3600000), // 1 hour ago
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 500, // This will be invoiced
        },
      });

      // Create uninvoiced appointments
      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 10800000), // 3 hours ago
          end_date: new Date(now.getTime() - 7200000), // 2 hours ago
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 300, // This will NOT be invoiced
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 14400000), // 4 hours ago
          end_date: new Date(now.getTime() - 10800000), // 3 hours ago
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 400, // This will NOT be invoiced
        },
      });

      // Create appointments that won't be counted
      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() + 3600000), // Future
          end_date: new Date(now.getTime() + 7200000),
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 600, // Won't count - future
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 18000000), // Past
          end_date: new Date(now.getTime() - 14400000),
          type: "APPOINTMENT",
          status: "NO_SHOW", // Wrong status
          created_by: user.id,
          appointment_fee: 700, // Won't count - NO_SHOW
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 21600000), // Past
          end_date: new Date(now.getTime() - 18000000),
          type: "EVENT", // Wrong type
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 800, // Won't count - EVENT type
        },
      });

      // Create an invoice for the first appointment
      await prisma.invoice.create({
        data: {
          amount: 500,
          status: "SENT",
          invoice_number: "INV-TEST-001",
          due_date: new Date(),
          type: "SERVICE",
          appointment_id: invoicedAppointment.id, // Link to the appointment
        },
      });

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only count uninvoiced appointments with SHOW status, APPOINTMENT type, and past dates: 300 + 400 = 700
      expect(data.uninvoiced).toBe("2000"); // Prisma Decimal serialized as string
    });

    it("should not count appointments with null fees as uninvoiced", async () => {
      // Create a user first
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: "testnullfees@example.com",
          password_hash: "hashed_password",
          last_login: new Date(),
        },
      });

      const now = new Date();

      // Create appointments with null fees
      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 7200000), // Past
          end_date: new Date(now.getTime() - 3600000),
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: null, // Null fee - should not be counted
        },
      });

      // Create appointment with fee
      await prisma.appointment.create({
        data: {
          start_date: new Date(now.getTime() - 10800000), // Past
          end_date: new Date(now.getTime() - 7200000),
          type: "APPOINTMENT",
          status: "SHOW",
          created_by: user.id,
          appointment_fee: 150, // This should be counted
        },
      });

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only count appointment with fee: 150
      expect(data.uninvoiced).toBe("150"); // Prisma Decimal serialized as string
    });

    it("should handle database errors gracefully", async () => {
      // Mock prisma to throw an error
      vi.spyOn(prisma.payment, "aggregate").mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const request = createRequest("/api/analytics");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.message).toBe("DB Error");
      expect(data.error.issueId).toBeDefined();
    });
  });
});
