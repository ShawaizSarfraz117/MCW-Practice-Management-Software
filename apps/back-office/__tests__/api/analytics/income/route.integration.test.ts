import { describe, it, expect, beforeEach, afterEach, vi as _vi } from "vitest";
import {
  prisma,
  Appointment as _Appointment,
  Payment as _Payment,
} from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { GET } from "@/app/api/analytics/income/route"; // Adjusted path based on common structure
import { DailyIncomeMetric } from "@/app/api/analytics/income/route";
// Import factories if you have them for Appointment and Payment, e.g.:
// import { AppointmentPrismaFactory, PaymentPrismaFactory } from "@mcw/database/mock-data";

describe("/api/analytics/income GET", () => {
  let createdAppointmentIds: string[] = [];
  let createdPaymentIds: string[] = [];
  // Add other necessary IDs for cleanup, e.g., client groups, invoices if they are created directly

  beforeEach(async () => {
    // Clear previous test data
    // Order matters due to foreign key constraints
    await prisma.payment.deleteMany({});
    await prisma.appointment.deleteMany({});
    // Add deletions for other related entities if necessary
    createdAppointmentIds = [];
    createdPaymentIds = [];
  });

  afterEach(async () => {
    // Fallback cleanup in case beforeEach didn't catch everything or tests failed mid-way
    if (createdPaymentIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { id: { in: createdPaymentIds } },
      });
    }
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }
  });

  it("should return daily income metrics for a valid date range", async () => {
    // 1. Setup: Create mock appointments and payments within a date range
    // Example: Create an appointment for 2023-10-01 with service_fee 100, discount 10
    // const appointment1 = await AppointmentPrismaFactory.create({
    //   start_date: new Date("2023-10-01T10:00:00Z"),
    //   end_date: new Date("2023-10-01T11:00:00Z"),
    //   service_fee: 100,
    //   discount_amount: 10,
    //   // ... other required fields (created_by, type, status etc.)
    // });
    // createdAppointmentIds.push(appointment1.id);

    // Example: Create a payment for 2023-10-01 for 50
    // const payment1 = await PaymentPrismaFactory.create({
    //   payment_date: new Date("2023-10-01T12:00:00Z"),
    //   amount: 50,
    //   invoice_id: "some-invoice-id" // ensure this invoice exists or mock it
    //   // ... other required fields
    // });
    // createdPaymentIds.push(payment1.id);

    // 2. Act: Call the API route
    const startDate = "2023-10-01";
    const endDate = "2023-10-02";
    const req = createRequest(
      `/api/analytics/income?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const data: DailyIncomeMetric[] = await response.json();

    // 3. Assert: Verify the response
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    // Check for specific dates and their calculated values
    // const day1Data = data.find(d => d.date === "2023-10-01");
    // expect(day1Data).toBeDefined();
    // expect(day1Data?.clientPayments).toBe(50);
    // expect(day1Data?.grossIncome).toBe(100);
    // expect(day1Data?.netIncome).toBe(90); // 100 - 10

    // const day2Data = data.find(d => d.date === "2023-10-02");
    // expect(day2Data?.clientPayments).toBe(0);
    // expect(day2Data?.grossIncome).toBe(0);
    // expect(day2Data?.netIncome).toBe(0);
    console.log(
      "Received data (valid range test):",
      JSON.stringify(data, null, 2),
    ); // For debugging during test development
  });

  it("should return empty metrics for a date range with no appointments or payments", async () => {
    const startDate = "2023-11-01";
    const endDate = "2023-11-01";
    const req = createRequest(
      `/api/analytics/income?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const data: DailyIncomeMetric[] = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1); // DateSeries should produce one entry for the date
    const dayData = data.find((d) => d.date === startDate);
    expect(dayData).toBeDefined();
    expect(dayData?.clientPayments).toBe(0);
    expect(dayData?.grossIncome).toBe(0);
    expect(dayData?.netIncome).toBe(0);
  });

  it("should return a 400 error for an invalid date range (endDate before startDate)", async () => {
    const startDate = "2023-10-02";
    const endDate = "2023-10-01";
    const req = createRequest(
      `/api/analytics/income?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const errorData = await response.json();

    expect(response.status).toBe(400);
    expect(errorData).toHaveProperty("error");
    expect(errorData.details[0].message).toContain(
      "End date must be on or after start date",
    );
  });

  it("should return a 400 error for missing startDate", async () => {
    const endDate = "2023-10-01";
    const req = createRequest(`/api/analytics/income?endDate=${endDate}`);
    const response = await GET(req);
    const errorData = await response.json();

    expect(response.status).toBe(400);
    expect(errorData).toHaveProperty("error", "Invalid date parameters");
    expect(errorData.details[0].field).toBe("startDate");
  });

  it("should return a 400 error for invalid date format", async () => {
    const startDate = "invalid-date";
    const endDate = "2023-10-01";
    const req = createRequest(
      `/api/analytics/income?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const errorData = await response.json();

    expect(response.status).toBe(400);
    expect(errorData).toHaveProperty("error", "Invalid date format");
  });

  // Optional: Test for database errors if you can reliably mock Prisma client to throw during $queryRaw
  // This is harder for integration tests but could be a unit test for the error handling block.
  // it("should return a 500 error if the database query fails", async () => {
  //   vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("DB Error"));
  //
  //   const startDate = "2023-10-01";
  //   const endDate = "2023-10-01";
  //   const req = createRequest(`/api/analytics/income?startDate=${startDate}&endDate=${endDate}`);
  //   const response = await GET(req);
  //   const errorData = await response.json();

  //   expect(response.status).toBe(500);
  //   expect(errorData).toHaveProperty("error", "Failed to retrieve income data. DB Error");
  //   vi.restoreAllMocks();
  // });
});
