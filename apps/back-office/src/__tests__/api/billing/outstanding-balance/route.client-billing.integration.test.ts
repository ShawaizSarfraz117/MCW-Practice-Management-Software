import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";
import { GET } from "../../../../../src/app/api/billing/outstanding-balance/route";
import { createRequest } from "@mcw/utils";

describe("/api/billing/outstanding-balance Client Billing Integration Tests", () => {
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

  it("getOutstandingBalances_SingleClient_NoGroup_VariousAppointments", async () => {
    // 1. Setup: Create Client, a dedicated ClientGroup, Membership, and Appointments
    const client = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_active: true,
        created_at: new Date(), // ensure created_at is set
      },
    });
    createdClientIds.push(client.id);

    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: `group-for-${client.id}`, // Predictable ID for this test structure
        type: "Individual", // Representing a group for a single client
        name: `Group for ${client.legal_first_name} ${client.legal_last_name}`,
        is_active: true,
      },
    });
    createdClientGroupIds.push(clientGroup.id);

    await prisma.clientGroupMembership.create({
      data: {
        client_id: client.id,
        client_group_id: clientGroup.id,
        is_responsible_for_billing: true,
        role: "Self",
      },
    });

    const appointment1 = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Therapy",
        start_date: new Date("2024-03-10T10:00:00.000Z"),
        end_date: new Date("2024-03-10T11:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(100.0),
        write_off: new Prisma.Decimal(10.0),
        adjustable_amount: new Prisma.Decimal(20.0),
      },
    });
    createdAppointmentIds.push(appointment1.id);

    const appointment2 = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Consultation",
        start_date: new Date("2024-03-15T14:00:00.000Z"),
        end_date: new Date("2024-03-15T15:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(150.0),
        write_off: null,
        adjustable_amount: new Prisma.Decimal(150.0),
      },
    });
    createdAppointmentIds.push(appointment2.id);

    const appointment3 = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Therapy",
        start_date: new Date("2024-03-20T09:00:00.000Z"),
        end_date: new Date("2024-03-20T10:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(120.0),
        write_off: new Prisma.Decimal(0.0),
        adjustable_amount: null,
      },
    });
    createdAppointmentIds.push(appointment3.id);

    const appointmentOutsideRange = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Follow-up",
        start_date: new Date("2024-02-01T09:00:00.000Z"),
        end_date: new Date("2024-02-01T10:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(50.0),
      },
    });
    createdAppointmentIds.push(appointmentOutsideRange.id);

    const startDate = "2024-03-01";
    const endDate = "2024-03-31";
    const req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data).toBeInstanceOf(Array);
    if (responseBody.data.length > 0) {
      expect(responseBody.data).toHaveLength(1);
      const clientData = responseBody.data[0];
      expect(clientData.clientId).toBe(client.id);
      expect(clientData.clientLegalFirstName).toBe("John");
      expect(clientData.clientLegalLastName).toBe("Doe");
      expect(clientData.totalServiceAmount).toBeCloseTo(370.0);
      expect(clientData.totalPaidAmount).toBeCloseTo(190.0);
      expect(clientData.totalOutstandingBalance).toBeCloseTo(170.0);
    } else {
      expect(responseBody.data).not.toHaveLength(0);
    }
    const expectedTotal = responseBody.data.length > 0 ? 1 : 0;
    expect(responseBody.pagination.total).toBe(expectedTotal);
  });

  it("getOutstandingBalances_ClientInGroup_SingleResponsibleBillingContact", async () => {
    const client1 = await prisma.client.create({
      data: {
        legal_first_name: "Alice",
        legal_last_name: "Smith",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client1.id);
    const client2 = await prisma.client.create({
      data: {
        legal_first_name: "Bob",
        legal_last_name: "Johnson",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client2.id);
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: "group-abc-123",
        type: "Family",
        name: "Smith Family Group",
        is_active: true,
      },
    });
    createdClientGroupIds.push(clientGroup.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: client1.id,
        client_group_id: clientGroup.id,
        is_responsible_for_billing: true,
        role: "Parent",
      },
    });
    await prisma.clientGroupMembership.create({
      data: {
        client_id: client2.id,
        client_group_id: clientGroup.id,
        is_responsible_for_billing: false,
        role: "Child",
      },
    });
    const appointment1 = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Group Session",
        start_date: new Date("2024-03-12T10:00:00.000Z"),
        end_date: new Date("2024-03-12T11:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(200.0),
        write_off: new Prisma.Decimal(0.0),
        adjustable_amount: new Prisma.Decimal(50.0),
      },
    });
    createdAppointmentIds.push(appointment1.id);
    const appointment2 = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Assessment",
        start_date: new Date("2024-03-18T14:00:00.000Z"),
        end_date: new Date("2024-03-18T15:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(250.0),
        adjustable_amount: new Prisma.Decimal(250.0),
      },
    });
    createdAppointmentIds.push(appointment2.id);
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
    const responsibleClientData = responseBody.data[0];
    expect(responsibleClientData.clientId).toBe(client1.id);
    expect(responsibleClientData.clientLegalFirstName).toBe("Alice");
    expect(responsibleClientData.clientLegalLastName).toBe("Smith");
    expect(responsibleClientData.totalServiceAmount).toBeCloseTo(450.0);
    expect(responsibleClientData.totalPaidAmount).toBeCloseTo(150.0);
    expect(responsibleClientData.totalOutstandingBalance).toBeCloseTo(300.0);
    expect(responseBody.pagination.total).toBe(1);
  });

  it("getOutstandingBalances_ClientInGroup_MultipleResponsibleBillingContacts", async () => {
    const client1 = await prisma.client.create({
      data: {
        legal_first_name: "Carol",
        legal_last_name: "Davis",
        is_active: true,
        created_at: new Date("2023-01-01T10:00:00.000Z"),
      },
    });
    createdClientIds.push(client1.id);
    const client2 = await prisma.client.create({
      data: {
        legal_first_name: "David",
        legal_last_name: "Miller",
        is_active: true,
        created_at: new Date("2023-01-05T10:00:00.000Z"),
      },
    });
    createdClientIds.push(client2.id);
    const client3 = await prisma.client.create({
      data: {
        legal_first_name: "Eve",
        legal_last_name: "Wilson",
        is_active: true,
        created_at: new Date(),
      },
    });
    createdClientIds.push(client3.id);
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: "group-multi-resp-456",
        type: "Organization",
        name: "Davis & Miller Co.",
        is_active: true,
      },
    });
    createdClientGroupIds.push(clientGroup.id);
    await prisma.clientGroupMembership.createMany({
      data: [
        {
          client_id: client1.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: true,
          role: "Partner",
        },
        {
          client_id: client2.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: true,
          role: "Partner",
        },
        {
          client_id: client3.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: false,
          role: "Associate",
        },
      ],
    });
    const appointment = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Consulting",
        start_date: new Date("2024-03-25T10:00:00.000Z"),
        end_date: new Date("2024-03-25T12:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(500.0),
        adjustable_amount: new Prisma.Decimal(100.0),
      },
    });
    createdAppointmentIds.push(appointment.id);
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
    const billableClientData = responseBody.data[0];
    expect(billableClientData.clientId).toBe(client1.id);
    expect(billableClientData.clientLegalFirstName).toBe("Carol");
    expect(billableClientData.clientLegalLastName).toBe("Davis");
    expect(billableClientData.totalServiceAmount).toBeCloseTo(500.0);
    expect(billableClientData.totalPaidAmount).toBeCloseTo(400.0);
    expect(billableClientData.totalOutstandingBalance).toBeCloseTo(100.0);
    expect(responseBody.pagination.total).toBe(1);
  });

  it("getOutstandingBalances_ClientInGroup_NoResponsibleBillingContacts", async () => {
    const client1 = await prisma.client.create({
      data: {
        legal_first_name: "Frank",
        legal_last_name: "Green",
        is_active: true,
        created_at: new Date("2023-02-01T10:00:00.000Z"),
      },
    });
    createdClientIds.push(client1.id);
    const client2 = await prisma.client.create({
      data: {
        legal_first_name: "Grace",
        legal_last_name: "Hall",
        is_active: true,
        created_at: new Date("2023-02-05T10:00:00.000Z"),
      },
    });
    createdClientIds.push(client2.id);
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: "group-no-resp-789",
        type: "Couple",
        name: "Green & Hall",
        is_active: true,
      },
    });
    createdClientGroupIds.push(clientGroup.id);
    await prisma.clientGroupMembership.createMany({
      data: [
        {
          client_id: client1.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: false,
          role: "Spouse",
        },
        {
          client_id: client2.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: null,
          role: "Spouse",
        },
      ],
    });
    const appointment = await prisma.appointment.create({
      data: {
        client_group_id: clientGroup.id,
        type: "Couples Therapy",
        start_date: new Date("2024-03-28T10:00:00.000Z"),
        end_date: new Date("2024-03-28T11:00:00.000Z"),
        created_by: "test-user-id",
        status: "completed",
        appointment_fee: new Prisma.Decimal(180.0),
        adjustable_amount: new Prisma.Decimal(30.0),
      },
    });
    createdAppointmentIds.push(appointment.id);
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
    const billableClientData = responseBody.data[0];
    expect(billableClientData.clientId).toBe(client1.id);
    expect(billableClientData.clientLegalFirstName).toBe("Frank");
    expect(billableClientData.clientLegalLastName).toBe("Green");
    expect(billableClientData.totalServiceAmount).toBeCloseTo(180.0);
    expect(billableClientData.totalPaidAmount).toBeCloseTo(150.0);
    expect(billableClientData.totalOutstandingBalance).toBeCloseTo(30.0);
    expect(responseBody.pagination.total).toBe(1);
  });

  it("getOutstandingBalances_ClientIsResponsibleForOwnAndGroupBilling", async () => {
    const henry = await prisma.client.create({
      data: {
        legal_first_name: "Henry",
        legal_last_name: "Ford",
        is_active: true,
        created_at: new Date("2023-03-01T10:00:00.000Z"),
      },
    });
    createdClientIds.push(henry.id);
    const henrysPersonalGroup = await prisma.clientGroup.create({
      data: {
        id: `group-henry-personal`,
        type: "Individual",
        name: "Henry Ford Personal",
        is_active: true,
      },
    });
    createdClientGroupIds.push(henrysPersonalGroup.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: henry.id,
        client_group_id: henrysPersonalGroup.id,
        is_responsible_for_billing: true,
        role: "Self",
      },
    });
    const henrysAppt = await prisma.appointment.create({
      data: {
        client_group_id: henrysPersonalGroup.id,
        type: "Personal Consult",
        start_date: new Date("2024-03-05T10:00:00.000Z"),
        end_date: new Date("2024-03-05T11:00:00.000Z"),
        created_by: "test-user",
        status: "completed",
        appointment_fee: new Prisma.Decimal(100.0),
        adjustable_amount: new Prisma.Decimal(20.0),
        write_off: new Prisma.Decimal(0.0),
      },
    });
    createdAppointmentIds.push(henrysAppt.id);
    const familyClientGroup = await prisma.clientGroup.create({
      data: {
        id: `group-ford-family`,
        type: "Family",
        name: "Ford Family",
        is_active: true,
      },
    });
    createdClientGroupIds.push(familyClientGroup.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: henry.id,
        client_group_id: familyClientGroup.id,
        is_responsible_for_billing: true,
        role: "Parent",
      },
    });
    const childClient = await prisma.client.create({
      data: {
        legal_first_name: "Edsel",
        legal_last_name: "Ford",
        is_active: true,
        created_at: new Date("2023-03-02T10:00:00.000Z"),
      },
    });
    createdClientIds.push(childClient.id);
    await prisma.clientGroupMembership.create({
      data: {
        client_id: childClient.id,
        client_group_id: familyClientGroup.id,
        is_responsible_for_billing: false,
        role: "Child",
      },
    });
    const familyAppt = await prisma.appointment.create({
      data: {
        client_group_id: familyClientGroup.id,
        type: "Family Session",
        start_date: new Date("2024-03-15T10:00:00.000Z"),
        end_date: new Date("2024-03-15T11:00:00.000Z"),
        created_by: "test-user",
        status: "completed",
        appointment_fee: new Prisma.Decimal(250.0),
        adjustable_amount: new Prisma.Decimal(50.0),
        write_off: new Prisma.Decimal(0.0),
      },
    });
    createdAppointmentIds.push(familyAppt.id);
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
    const henryData = responseBody.data[0];
    expect(henryData.clientId).toBe(henry.id);
    expect(henryData.clientLegalFirstName).toBe("Henry");
    expect(henryData.totalServiceAmount).toBeCloseTo(350.0);
    expect(henryData.totalPaidAmount).toBeCloseTo(280.0);
    expect(henryData.totalOutstandingBalance).toBeCloseTo(70.0);
    expect(responseBody.pagination.total).toBe(1);
  });
});
