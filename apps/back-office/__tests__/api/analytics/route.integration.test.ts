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
import { startOfMonth, subMonths } from "date-fns";
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
          status: "UNPAID",
          invoice_number: "INV-001",
          due_date: new Date(),
          type: "STANDARD",
        },
      });

      const invoice2 = await prisma.invoice.create({
        data: {
          amount: 2000,
          status: "PARTIALLY_PAID",
          invoice_number: "INV-002",
          due_date: new Date(),
          type: "STANDARD",
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

      // Create appointments
      await prisma.appointment.create({
        data: {
          start_date: now,
          end_date: new Date(now.getTime() + 3600000),
          type: "CONSULTATION",
          status: "SCHEDULED",
          created_by: user.id,
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
          type: "STANDARD",
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

      const request = createRequest("/api/analytics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        income: "500", // Sum of completed payments
        outstanding: 2500, // 3000 (total unpaid/partially paid) - 500 (partial payment)
        uninvoiced: 1000, // Amount of completely unpaid invoice
        appointments: 1,
        notes: 1,
      });
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
          type: "STANDARD",
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
      expect(data.income).toBe("1000");
    });

    it("should handle custom date range correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Create test data for custom range
      const invoice = await prisma.invoice.create({
        data: {
          amount: 2000,
          status: "PAID",
          invoice_number: "INV-004",
          due_date: startDate,
          type: "STANDARD",
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
      expect(data.income).toBe("2000");
    });

    it("should return 400 for invalid custom date range", async () => {
      const request = createRequest("/api/analytics?range=custom");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing custom date range");
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
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
