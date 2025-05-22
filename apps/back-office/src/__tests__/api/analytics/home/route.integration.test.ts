import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";
import { GET } from "../../../../../src/app/api/analytics/home/route"; // Adjusted path
import { createRequest } from "@mcw/utils";
// import { GET } from "@/app/api/analytics/home/route"; // Path alias needs to be configured for tests
// import { GET } from "../../../../../src/app/api/analytics/home/route"; // Adjusted path - Commented out as GET is not used yet

describe("/api/analytics/home Integration Tests", () => {
  let createdAppointmentIds: string[] = [];
  // We might need client/group setup if future tests involve more complex scenarios,
  // but for these direct appointment aggregations, it's not strictly necessary yet.
  // Let's add them for potential future use and good practice.
  let createdClientIds: string[] = [];
  let createdClientGroupIds: string[] = [];

  beforeEach(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.client.deleteMany({});
    createdAppointmentIds = [];
    createdClientIds = [];
    createdClientGroupIds = [];
  });

  afterEach(async () => {
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }
    if (createdClientIds.length > 0 || createdClientGroupIds.length > 0) {
      const membershipsToDelete = await prisma.clientGroupMembership.findMany({
        where: {
          OR: [
            { client_id: { in: createdClientIds } },
            { client_group_id: { in: createdClientGroupIds } },
          ],
        },
      });
      if (membershipsToDelete.length > 0) {
        await prisma.clientGroupMembership.deleteMany({
          where: {
            OR: [
              { client_id: { in: createdClientIds } },
              { client_group_id: { in: createdClientGroupIds } },
            ],
          },
        });
      }
    }
    if (createdClientGroupIds.length > 0) {
      await prisma.clientGroup.deleteMany({
        where: { id: { in: createdClientGroupIds } },
      });
    }
    if (createdClientIds.length > 0) {
      await prisma.client.deleteMany({
        where: { id: { in: createdClientIds } },
      });
    }
  });

  it("should have a placeholder test that passes", () => {
    expect(true).toBe(true);
  });

  describe("GET /api/analytics/home", () => {
    it("getAnalyticsHome_ValidDateRange_CorrectMetricsCalculation", async () => {
      // 1. Setup: Create necessary ClientGroup for appointments
      const group1 = await prisma.clientGroup.create({
        data: {
          id: "group-analytics-1",
          type: "Individual",
          name: "Analytics Group 1",
          is_active: true,
        },
      });
      createdClientGroupIds.push(group1.id);

      // Appointments within the date range and 'completed'
      const appt1 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S1",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-10T10:00:00Z"),
          end_date: new Date("2024-03-10T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(100),
          write_off: new Prisma.Decimal(10),
          adjustable_amount: new Prisma.Decimal(5),
          // Expected: Gross=100, Payments=100-10-5 = 85
        },
      });
      const appt2 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S2",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-15T10:00:00Z"),
          end_date: new Date("2024-03-15T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(200),
          write_off: null,
          adjustable_amount: new Prisma.Decimal(50),
          // Expected: Gross=200, Payments=200-0-50 = 150
        },
      });
      const appt3 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S3",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-20T10:00:00Z"),
          end_date: new Date("2024-03-20T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(150),
          write_off: new Prisma.Decimal(20),
          adjustable_amount: null,
          // Expected: Gross=150, Payments=150-20-0 = 130
        },
      });

      // Appointment with null fee (should be treated as 0)
      const appt4NullFee = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S4",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-22T10:00:00Z"),
          end_date: new Date("2024-03-22T11:00:00Z"),
          appointment_fee: null,
          write_off: new Prisma.Decimal(5),
          adjustable_amount: new Prisma.Decimal(5),
          // Expected: Gross=0, Payments=0-5-5 = -10
        },
      });

      // Appointment outside date range
      const apptOutside = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S_OUT",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-02-01T10:00:00Z"),
          end_date: new Date("2024-02-01T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(1000),
        },
      });

      // Appointment within date range but NOT 'completed'
      const apptNotCompleted = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S_NC",
          created_by: "tu",
          status: "scheduled",
          start_date: new Date("2024-03-12T10:00:00Z"),
          end_date: new Date("2024-03-12T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(500),
        },
      });
      createdAppointmentIds.push(
        appt1.id,
        appt2.id,
        appt3.id,
        appt4NullFee.id,
        apptOutside.id,
        apptNotCompleted.id,
      );

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/analytics/home?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);

      // Expected Gross Income = 100 (appt1) + 200 (appt2) + 150 (appt3) + 0 (appt4NullFee) = 450
      // Expected Total Client Payments = 85 (appt1) + 150 (appt2) + 130 (appt3) + (-10) (appt4NullFee) = 355

      expect(responseBody.grossIncome).toBeCloseTo(450.0);
      expect(responseBody.totalClientPayments).toBeCloseTo(355.0);
      expect(responseBody.netIncome).toBeCloseTo(450.0); // NetIncome = GrossIncome for now
      expect(responseBody.startDate).toBe(startDate);
      expect(responseBody.endDate).toBe(endDate);
    });

    it("getAnalyticsHome_NoAppointmentsInDateRange_ReturnsZeroMetrics", async () => {
      // 1. Setup: Ensure no relevant appointments in the target range
      // (beforeEach already cleans up, so we just don't create any for this range)
      // Or, create appointments outside the range or with non-completed status
      const group1 = await prisma.clientGroup.create({
        data: {
          id: "group-analytics-empty",
          type: "Individual",
          name: "Analytics Empty Group",
          is_active: true,
        },
      });
      createdClientGroupIds.push(group1.id);

      await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S_OUT_EMPTY",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-01-15T10:00:00Z"), // Outside target range
          end_date: new Date("2024-01-15T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(100),
        },
      });
      await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "S_NC_EMPTY",
          created_by: "tu",
          status: "scheduled", // Not completed
          start_date: new Date("2024-03-15T10:00:00Z"), // Inside target range
          end_date: new Date("2024-03-15T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(100),
        },
      });

      // 2. Make API Call for a range expected to be empty
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/analytics/home?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.totalClientPayments).toBeCloseTo(0.0);
      expect(responseBody.grossIncome).toBeCloseTo(0.0);
      expect(responseBody.netIncome).toBeCloseTo(0.0);
      expect(responseBody.startDate).toBe(startDate);
      expect(responseBody.endDate).toBe(endDate);
    });

    it("getAnalyticsHome_AppointmentsWithNullFinancialFields_AggregatedAsZero", async () => {
      const group1 = await prisma.clientGroup.create({
        data: {
          id: "group-analytics-nulls",
          type: "Individual",
          name: "Analytics Nulls Group",
          is_active: true,
        },
      });
      createdClientGroupIds.push(group1.id);

      // Appointment 1: All null financial fields
      const appt1 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "N1",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-10T10:00:00Z"),
          end_date: new Date("2024-03-10T11:00:00Z"),
          appointment_fee: null,
          write_off: null,
          adjustable_amount: null,
          // Expected: Gross=0, Payments=0
        },
      });

      // Appointment 2: Fee present, others null
      const appt2 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "N2",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-11T10:00:00Z"),
          end_date: new Date("2024-03-11T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(100),
          write_off: null,
          adjustable_amount: null,
          // Expected: Gross=100, Payments=100
        },
      });

      // Appointment 3: Fee and write_off present, adjustable_amount null
      const appt3 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "N3",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-12T10:00:00Z"),
          end_date: new Date("2024-03-12T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(150),
          write_off: new Prisma.Decimal(20),
          adjustable_amount: null,
          // Expected: Gross=150, Payments=130
        },
      });

      // Appointment 4: Fee and adjustable_amount present, write_off null
      const appt4 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "N4",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-13T10:00:00Z"),
          end_date: new Date("2024-03-13T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(200),
          write_off: null,
          adjustable_amount: new Prisma.Decimal(30),
          // Expected: Gross=200, Payments=170
        },
      });

      // Appointment 5: All fields present
      const appt5 = await prisma.appointment.create({
        data: {
          client_group_id: group1.id,
          type: "N5",
          created_by: "tu",
          status: "completed",
          start_date: new Date("2024-03-14T10:00:00Z"),
          end_date: new Date("2024-03-14T11:00:00Z"),
          appointment_fee: new Prisma.Decimal(250),
          write_off: new Prisma.Decimal(25),
          adjustable_amount: new Prisma.Decimal(25),
          // Expected: Gross=250, Payments=200
        },
      });

      createdAppointmentIds.push(
        appt1.id,
        appt2.id,
        appt3.id,
        appt4.id,
        appt5.id,
      );

      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/analytics/home?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      expect(response.status).toBe(200);

      // Expected Gross Income = 0 + 100 + 150 + 200 + 250 = 700
      // Expected Total Client Payments = 0 + 100 + 130 + 170 + 200 = 600

      expect(responseBody.grossIncome).toBeCloseTo(700.0);
      expect(responseBody.totalClientPayments).toBeCloseTo(600.0);
      expect(responseBody.netIncome).toBeCloseTo(700.0); // NetIncome = GrossIncome
    });
  });

  // TODO: Add integration tests as per the plan
});
