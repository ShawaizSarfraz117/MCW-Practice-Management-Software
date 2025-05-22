import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";
import { GET } from "../../../../../src/app/api/billing/outstanding-balance/route";
import { createRequest } from "@mcw/utils";

describe("/api/billing/outstanding-balance Data Integrity Integration Tests", () => {
  let createdClientIds: string[] = [];
  let createdClientGroupIds: string[] = [];
  let createdAppointmentIds: string[] = [];

  beforeEach(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.client.deleteMany({});
    createdClientIds = [];
    createdClientGroupIds = [];
    createdAppointmentIds = [];
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

  it("getOutstandingBalances_DateFiltering_StrictlyAdhered", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "DateFilter",
        legal_last_name: "Client",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client.id);
    const group = await prisma.clientGroup.create({
      data: {
        id: `group-datefilter`,
        type: "Individual",
        name: "Date Filter Group",
        is_active: true,
      },
    });
    createdClientGroupIds.push(group.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: client.id,
        client_group_id: group.id,
        is_responsible_for_billing: true,
        role: "Self",
      },
    });
    const targetStartDate = new Date("2024-03-15T00:00:00.000Z");
    const apptBefore = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "BF",
        start_date: new Date("2024-03-14T10:00:00Z"),
        end_date: new Date("2024-03-14T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(10),
      },
    });
    const apptWithin = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "WI",
        start_date: new Date("2024-03-16T10:00:00Z"),
        end_date: new Date("2024-03-16T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(20),
        adjustable_amount: new Prisma.Decimal(5),
      },
    });
    const apptAtStart = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "AS",
        start_date: targetStartDate,
        end_date: new Date("2024-03-15T01:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(30),
      },
    });
    const apptAtEnd = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "AE",
        start_date: new Date("2024-03-20T23:00:00Z"),
        end_date: new Date("2024-03-20T23:59:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(40),
      },
    });
    const apptAfter = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "AF",
        start_date: new Date("2024-03-21T10:00:00Z"),
        end_date: new Date("2024-03-21T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(50),
      },
    });
    createdAppointmentIds.push(
      apptBefore.id,
      apptWithin.id,
      apptAtStart.id,
      apptAtEnd.id,
      apptAfter.id,
    );
    const apiStartDate = "2024-03-15";
    const apiEndDate = "2024-03-20";
    const req = createRequest(
      `/api/billing/outstanding-balance?startDate=${apiStartDate}&endDate=${apiEndDate}`,
    );
    const response = await GET(req);
    const responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toBeInstanceOf(Array);
    expect(responseBody.data).toHaveLength(1);
    const clientData = responseBody.data[0];
    expect(clientData.totalServiceAmount).toBeCloseTo(90.0);
    expect(clientData.totalPaidAmount).toBeCloseTo(85.0);
    expect(clientData.totalOutstandingBalance).toBeCloseTo(5.0);
    expect(responseBody.pagination.total).toBe(1);
  });

  it("getOutstandingBalances_NoAppointmentsInDateRange_ReturnsEmpty", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "NoAppointments",
        legal_last_name: "Client",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client.id);
    const group = await prisma.clientGroup.create({
      data: {
        id: `group-noappt`,
        type: "Individual",
        name: "No Appt Group",
        is_active: true,
      },
    });
    createdClientGroupIds.push(group.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: client.id,
        client_group_id: group.id,
        is_responsible_for_billing: true,
        role: "Self",
      },
    });
    const apptOutside = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "OldSession",
        start_date: new Date("2024-01-10T10:00:00Z"),
        end_date: new Date("2024-01-10T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(100),
      },
    });
    createdAppointmentIds.push(apptOutside.id);
    const startDate = "2024-03-01";
    const endDate = "2024-03-31";
    const req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toBeInstanceOf(Array);
    expect(responseBody.data).toHaveLength(0);
    expect(responseBody.pagination.total).toBe(0);
    expect(responseBody.pagination.totalPages).toBe(0);
    expect(responseBody.pagination.page).toBe(1);
    expect(responseBody.pagination.rowsPerPage).toBe(20);
  });

  it("getOutstandingBalances_AppointmentsWithNullFinancialFields_TreatedAsZero", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "NullField",
        legal_last_name: "Client",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client.id);
    const group = await prisma.clientGroup.create({
      data: {
        id: "group-nullfield",
        type: "Individual",
        name: "Null Field Group",
        is_active: true,
      },
    });
    createdClientGroupIds.push(group.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: client.id,
        client_group_id: group.id,
        is_responsible_for_billing: true,
        role: "Self",
      },
    });
    const appt1 = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "NF1",
        start_date: new Date("2024-03-10T10:00:00Z"),
        end_date: new Date("2024-03-10T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: null,
        write_off: null,
        adjustable_amount: null,
      },
    });
    const appt2 = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "NF2",
        start_date: new Date("2024-03-11T10:00:00Z"),
        end_date: new Date("2024-03-11T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(100),
        write_off: null,
        adjustable_amount: null,
      },
    });
    const appt3 = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "NF3",
        start_date: new Date("2024-03-12T10:00:00Z"),
        end_date: new Date("2024-03-12T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(150),
        write_off: new Prisma.Decimal(20),
        adjustable_amount: null,
      },
    });
    const appt4 = await prisma.appointment.create({
      data: {
        client_group_id: group.id,
        type: "NF4",
        start_date: new Date("2024-03-13T10:00:00Z"),
        end_date: new Date("2024-03-13T11:00:00Z"),
        created_by: "tu",
        status: "completed",
        appointment_fee: new Prisma.Decimal(200),
        write_off: null,
        adjustable_amount: new Prisma.Decimal(30),
      },
    });
    createdAppointmentIds.push(appt1.id, appt2.id, appt3.id, appt4.id);
    const startDate = "2024-03-01";
    const endDate = "2024-03-31";
    const req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toBeInstanceOf(Array);
    expect(responseBody.data).toHaveLength(1);
    const clientData = responseBody.data[0];
    expect(clientData.clientId).toBe(client.id);
    expect(clientData.totalServiceAmount).toBeCloseTo(450.0);
    expect(clientData.totalPaidAmount).toBeCloseTo(400.0);
    expect(clientData.totalOutstandingBalance).toBeCloseTo(30.0);
    expect(responseBody.pagination.total).toBe(1);
  });
});
