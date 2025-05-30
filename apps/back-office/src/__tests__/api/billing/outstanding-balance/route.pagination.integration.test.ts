import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";
import { GET } from "../../../../../src/app/api/billing/outstanding-balance/route";
import { createRequest } from "@mcw/utils";

describe("/api/billing/outstanding-balance Pagination Integration Tests", () => {
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

  it("getOutstandingBalances_Pagination_WorksAsExpected", async () => {
    const numClients = 7;
    const clientsData = [];
    for (let i = 0; i < numClients; i++) {
      const client = await prisma.client.create({
        data: {
          legal_first_name: `PageClient${i + 1}`,
          legal_last_name: "Test",
          is_active: true,
          created_at: new Date(2023, 0, i + 1),
        },
      });
      createdClientIds.push(client.id);
      const group = await prisma.clientGroup.create({
        data: {
          id: `group-page-${i}`,
          type: "Individual",
          name: `Group Page ${i}`,
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
      const appointment = await prisma.appointment.create({
        data: {
          client_group_id: group.id,
          type: "Session",
          start_date: new Date(
            `2024-03-1${i % 2 === 0 ? "0" : "1"}T10:00:00.000Z`,
          ),
          end_date: new Date(
            `2024-03-1${i % 2 === 0 ? "0" : "1"}T11:00:00.000Z`,
          ),
          created_by: "test-user",
          status: "completed",
          appointment_fee: new Prisma.Decimal(100 + i),
          adjustable_amount: new Prisma.Decimal(10 + i),
        },
      });
      createdAppointmentIds.push(appointment.id);
      clientsData.push({ client, group, appointment });
    }

    const startDate = "2024-03-01";
    const endDate = "2024-03-31";
    const rowsPerPage = 3;

    let req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}&page=1&rowsPerPage=${rowsPerPage}`,
    );
    let response = await GET(req);
    let responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toHaveLength(rowsPerPage);
    expect(responseBody.pagination.page).toBe(1);
    expect(responseBody.pagination.rowsPerPage).toBe(rowsPerPage);
    expect(responseBody.pagination.total).toBe(numClients);
    expect(responseBody.pagination.totalPages).toBe(
      Math.ceil(numClients / rowsPerPage),
    );
    expect(responseBody.data[0].clientLegalFirstName).toBe("PageClient1");
    expect(responseBody.data[1].clientLegalFirstName).toBe("PageClient2");
    expect(responseBody.data[2].clientLegalFirstName).toBe("PageClient3");

    req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}&page=2&rowsPerPage=${rowsPerPage}`,
    );
    response = await GET(req);
    responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toHaveLength(rowsPerPage);
    expect(responseBody.pagination.page).toBe(2);
    expect(responseBody.data[0].clientLegalFirstName).toBe("PageClient4");
    expect(responseBody.data[1].clientLegalFirstName).toBe("PageClient5");
    expect(responseBody.data[2].clientLegalFirstName).toBe("PageClient6");

    req = createRequest(
      `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}&page=3&rowsPerPage=${rowsPerPage}`,
    );
    response = await GET(req);
    responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.data).toHaveLength(
      numClients % rowsPerPage === 0 && numClients > 0
        ? rowsPerPage
        : numClients % rowsPerPage,
    );
    expect(responseBody.pagination.page).toBe(3);
    if (responseBody.data.length > 0) {
      expect(responseBody.data[0].clientLegalFirstName).toBe("PageClient7");
    }
  });
});
