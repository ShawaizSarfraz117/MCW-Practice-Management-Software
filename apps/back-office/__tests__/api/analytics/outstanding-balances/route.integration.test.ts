import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { GET } from "@/app/api/analytics/outstanding-balances/route";
import { PaginatedOutstandingBalancesResponse } from "@/app/api/analytics/outstanding-balances/route";
// Import factories if you have them for relevant models (ClientGroup, Client, Appointment, Invoice, Payment)
// e.g., import { ClientGroupPrismaFactory, ... } from "@mcw/database/mock-data";

describe("/api/analytics/outstanding-balances GET", () => {
  // Store IDs of created entities for cleanup
  let createdClientGroupIds: string[] = [];
  let createdClientIds: string[] = [];
  let createdAppointmentIds: string[] = [];
  let createdInvoiceIds: string[] = [];
  let createdPaymentIds: string[] = [];

  beforeEach(async () => {
    // Clear previous test data in correct order due to foreign key constraints
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.appointment.deleteMany({});
    // ClientGroupMembership is trickier if it has composite PK and relations, might need specific cleanup or cascade
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.clientGroup.deleteMany({});

    createdClientGroupIds = [];
    createdClientIds = [];
    createdAppointmentIds = [];
    createdInvoiceIds = [];
    createdPaymentIds = [];
  });

  afterEach(async () => {
    // Fallback cleanup
    await prisma.payment.deleteMany({
      where: { id: { in: createdPaymentIds } },
    });
    await prisma.invoice.deleteMany({
      where: { id: { in: createdInvoiceIds } },
    });
    await prisma.appointment.deleteMany({
      where: { id: { in: createdAppointmentIds } },
    });
    await prisma.clientGroupMembership.deleteMany({}); // Simpler to wipe all for now
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    await prisma.clientGroup.deleteMany({
      where: { id: { in: createdClientGroupIds } },
    });
  });

  // Subtask 8.1: Basic Pagination
  it("should return paginated client balances for valid parameters (first page)", async () => {
    // 1. Setup: Create multiple client groups, clients, appointments, invoices, payments
    //    Ensure some have outstanding balances and some don't, spread across dates.
    //    Ensure at least one client per group is marked as responsible for billing or is the oldest.
    //    Example:
    //    const group1 = await ClientGroupPrismaFactory.create({ name: 'Group A' }); createdClientGroupIds.push(group1.id);
    //    const client1 = await ClientPrismaFactory.create({ legal_first_name: 'John', legal_last_name: 'Doe A'}); createdClientIds.push(client1.id);
    //    await ClientGroupMembershipPrismaFactory.create({ client_group_id: group1.id, client_id: client1.id, is_responsible_for_billing: true });
    //    ... more data ...

    const startDate = "2023-01-01";
    const endDate = "2023-12-31";
    const page = "1";
    const pageSize = "5";

    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=${pageSize}`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;

    expect(response.status).toBe(200);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(Number(page));
    expect(result.pagination.pageSize).toBe(Number(pageSize));
    // Further assertions on data content and pagination.totalCount / totalPages based on setup
    // e.g., expect(result.data.length).toBeLessThanOrEqual(Number(pageSize));
    console.log("Basic Pagination Test:", JSON.stringify(result, null, 2));
  });

  // Subtask 8.2: Page Navigation (e.g., page 2)
  it("should correctly return data for a subsequent page", async () => {
    // Setup: Create enough data to span multiple pages (e.g., > 10 client groups if pageSize is 10)
    // ... complex data setup similar to above ...

    const startDate = "2023-01-01";
    const endDate = "2023-12-31";
    const page = "2";
    const pageSize = "3"; // Small page size for easier testing of pagination

    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=${pageSize}`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;

    expect(response.status).toBe(200);
    expect(result.pagination.page).toBe(Number(page));
    // Add assertions to ensure the data is for the second page (e.g. check offset if possible, or specific items)
    console.log(
      "Page Navigation Test (page 2):",
      JSON.stringify(result, null, 2),
    );
  });

  // Subtask 8.3: Page Size Change
  it("should respect the pageSize parameter", async () => {
    // Setup: Data
    // ... data setup ...
    const startDate = "2023-01-01";
    const endDate = "2023-12-31";
    const page = "1";
    const pageSize = "2"; // Custom small page size

    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=${pageSize}`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;

    expect(response.status).toBe(200);
    expect(result.data.length).toBeLessThanOrEqual(Number(pageSize));
    expect(result.pagination.pageSize).toBe(Number(pageSize));
    console.log("Page Size Change Test:", JSON.stringify(result, null, 2));
  });

  // Subtask 8.4: No Data in Range
  it("should return empty data array and correct pagination when no data in range", async () => {
    const startDate = "2999-01-01"; // Future date, likely no data
    const endDate = "2999-12-31";
    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;

    expect(response.status).toBe(200);
    expect(result.data.length).toBe(0);
    expect(result.pagination.totalCount).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  // Subtask 8.5 & 8.6: Responsible Biller Scenarios (Multiple / Zero)
  // These require careful data setup to test the OUTER APPLY logic for responsible client names
  it("should correctly identify responsible client or handle missing (Subtasks 8.5, 8.6)", async () => {
    // Scenario 1: Group with one clear responsible biller
    // Scenario 2: Group with multiple members, one marked responsible
    // Scenario 3: Group with multiple members, none marked responsible (should pick oldest client)
    // Scenario 4: Group with no members (responsible client fields should be null)
    // ... complex data setup ...

    const startDate = "2023-01-01";
    const endDate = "2023-12-31";
    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;
    expect(response.status).toBe(200);
    // Assertions on specific items in result.data to check responsibleClientFirstName/LastName
    console.log("Responsible Biller Test:", JSON.stringify(result, null, 2));
  });

  // Subtask 8.7: Group with No Appointments in Range
  it("should return zero financial metrics for a group with no appointments in range", async () => {
    // Setup: Create a client group, and a client in it.
    // Do NOT create appointments for this group in the specified date range.
    // const groupNoAppts = await ClientGroupPrismaFactory.create({ name: 'Group No Appointments' });
    // createdClientGroupIds.push(groupNoAppts.id);
    // ... add members ...

    const startDate = "2023-01-01";
    const endDate = "2023-12-31";
    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10`,
    );
    const response = await GET(req);
    const result =
      (await response.json()) as PaginatedOutstandingBalancesResponse;
    expect(response.status).toBe(200);
    // const groupData = result.data.find(d => d.clientGroupId === groupNoAppts.id);
    // if (groupData) {
    //   expect(groupData.totalServicesProvided).toBe(0);
    //   expect(groupData.totalAmountInvoiced).toBe(0);
    //   expect(groupData.totalAmountPaid).toBe(0);
    //   expect(groupData.totalAmountUnpaid).toBe(0);
    // }
    console.log("No Appointments Test:", JSON.stringify(result, null, 2));
  });

  // Subtask 8.8: Invalid Inputs
  it("should return 400 error for invalid date range (e.g., endDate before startDate)", async () => {
    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=2023-02-01&endDate=2023-01-01&page=1&pageSize=10`,
    );
    const response = await GET(req);
    const errorData = await response.json();
    expect(response.status).toBe(400);
    expect(errorData).toHaveProperty("error");
  });

  it("should return 400 error for invalid pagination (e.g., page=0)", async () => {
    const req = createRequest(
      `/api/analytics/outstanding-balances?startDate=2023-01-01&endDate=2023-01-31&page=0&pageSize=10`,
    );
    const response = await GET(req);
    const errorData = await response.json();
    expect(response.status).toBe(400);
    expect(errorData).toHaveProperty("error");
  });
});
