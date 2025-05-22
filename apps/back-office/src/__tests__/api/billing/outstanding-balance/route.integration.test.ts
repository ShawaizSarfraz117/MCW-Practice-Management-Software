import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client"; // Import Prisma for Decimal type
import { GET } from "../../../../../src/app/api/billing/outstanding-balance/route"; // Adjusted path
import { createRequest } from "@mcw/utils"; // For creating NextRequest

describe("/api/billing/outstanding-balance Integration Tests", () => {
  let createdClientIds: string[] = [];
  let createdClientGroupIds: string[] = [];
  let createdAppointmentIds: string[] = [];

  beforeEach(async () => {
    // Clean up database before each test to ensure isolation
    // Order of deletion matters due to foreign key constraints
    await prisma.appointment.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.client.deleteMany({});
    createdClientIds = [];
    createdClientGroupIds = [];
    createdAppointmentIds = [];
  });

  afterEach(async () => {
    // Final cleanup, though beforeEach should handle most cases
    // Order of deletion matters
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }
    // Order of deletion matters due to foreign key constraints
    // Delete memberships first
    if (createdClientIds.length > 0 || createdClientGroupIds.length > 0) {
      // Check if any IDs to avoid empty `in` array error
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

  describe("GET /api/billing/outstanding-balance", () => {
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
      // Membership IDs are composite, typically not added to simple cleanup arrays unless specifically needed

      const appointment1 = await prisma.appointment.create({
        data: {
          client_group_id: clientGroup.id, // Link to the client's group
          type: "Therapy",
          start_date: new Date("2024-03-10T10:00:00.000Z"),
          end_date: new Date("2024-03-10T11:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(100.0),
          write_off: new Prisma.Decimal(10.0),
          adjustable_amount: new Prisma.Decimal(20.0), // Outstanding: 20, Paid: 100-10-20 = 70
        },
      });
      createdAppointmentIds.push(appointment1.id);

      const appointment2 = await prisma.appointment.create({
        data: {
          client_group_id: clientGroup.id, // Link to the client's group
          type: "Consultation",
          start_date: new Date("2024-03-15T14:00:00.000Z"),
          end_date: new Date("2024-03-15T15:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(150.0),
          write_off: null,
          adjustable_amount: new Prisma.Decimal(150.0), // Outstanding: 150, Paid: 150-0-150 = 0
        },
      });
      createdAppointmentIds.push(appointment2.id);

      const appointment3 = await prisma.appointment.create({
        data: {
          client_group_id: clientGroup.id, // Link to the client's group
          type: "Therapy",
          start_date: new Date("2024-03-20T09:00:00.000Z"),
          end_date: new Date("2024-03-20T10:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(120.0),
          write_off: new Prisma.Decimal(0.0),
          adjustable_amount: null, // Outstanding: 0 (null treated as 0), Paid: 120-0-0 = 120
        },
      });
      createdAppointmentIds.push(appointment3.id);

      // Appointment outside the date range for testing filtering
      const appointmentOutsideRange = await prisma.appointment.create({
        data: {
          client_group_id: clientGroup.id,
          type: "Follow-up",
          start_date: new Date("2024-02-01T09:00:00.000Z"), // Outside range
          end_date: new Date("2024-02-01T10:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(50.0),
        },
      });
      createdAppointmentIds.push(appointmentOutsideRange.id); // Add to cleanup as it's created

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);

      // Ensure responseBody.data is not empty before trying to access its elements
      if (responseBody.data.length > 0) {
        expect(responseBody.data).toHaveLength(1); // Only one client (responsible member)
        const clientData = responseBody.data[0];
        expect(clientData.clientId).toBe(client.id);
        expect(clientData.clientLegalFirstName).toBe("John");
        expect(clientData.clientLegalLastName).toBe("Doe");

        // Expected calculations:
        // Appt1: Service=100, Paid=70, Outstanding=20
        // Appt2: Service=150, Paid=0, Outstanding=150
        // Appt3: Service=120, Paid=120, Outstanding=0
        // Totals: Service=370, Paid=190, Outstanding=170
        expect(clientData.totalServiceAmount).toBeCloseTo(370.0);
        expect(clientData.totalPaidAmount).toBeCloseTo(190.0);
        expect(clientData.totalOutstandingBalance).toBeCloseTo(170.0);
      } else {
        // If data is empty, fail the test with a clear message
        expect(responseBody.data).not.toHaveLength(0); // This will fail and show the empty array
      }

      // Check pagination (default page 1, default rowsPerPage, total 1 if data found)
      const expectedTotal = responseBody.data.length > 0 ? 1 : 0;
      expect(responseBody.pagination.total).toBe(expectedTotal);
    });

    it("getOutstandingBalances_ClientInGroup_SingleResponsibleBillingContact", async () => {
      // 1. Setup
      // Client 1 (Responsible)
      const client1 = await prisma.client.create({
        data: {
          legal_first_name: "Alice",
          legal_last_name: "Smith",
          is_active: true,
          created_at: new Date(),
        },
      });
      createdClientIds.push(client1.id);

      // Client 2 (Not Responsible)
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

      // Alice is responsible
      await prisma.clientGroupMembership.create({
        data: {
          client_id: client1.id,
          client_group_id: clientGroup.id,
          is_responsible_for_billing: true,
          role: "Parent",
        },
      });
      // Bob is in the group but not responsible
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
          client_group_id: clientGroup.id, // Linked to the group
          type: "Group Session",
          start_date: new Date("2024-03-12T10:00:00.000Z"),
          end_date: new Date("2024-03-12T11:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(200.0),
          write_off: new Prisma.Decimal(0.0),
          adjustable_amount: new Prisma.Decimal(50.0), // Outstanding: 50, Paid: 150
        },
      });
      createdAppointmentIds.push(appointment1.id);

      const appointment2 = await prisma.appointment.create({
        data: {
          client_group_id: clientGroup.id, // Linked to the group
          type: "Assessment",
          start_date: new Date("2024-03-18T14:00:00.000Z"),
          end_date: new Date("2024-03-18T15:00:00.000Z"),
          created_by: "test-user-id",
          status: "completed",
          appointment_fee: new Prisma.Decimal(250.0),
          adjustable_amount: new Prisma.Decimal(250.0), // Outstanding: 250, Paid: 0
        },
      });
      createdAppointmentIds.push(appointment2.id);

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1); // Only Alice should be listed as responsible

      const responsibleClientData = responseBody.data[0];
      expect(responsibleClientData.clientId).toBe(client1.id);
      expect(responsibleClientData.clientLegalFirstName).toBe("Alice");
      expect(responsibleClientData.clientLegalLastName).toBe("Smith");

      // Expected calculations for the group (attributed to Alice):
      // Appt1: Service=200, Paid=150, Outstanding=50
      // Appt2: Service=250, Paid=0, Outstanding=250
      // Totals: Service=450, Paid=150, Outstanding=300
      expect(responsibleClientData.totalServiceAmount).toBeCloseTo(450.0);
      expect(responsibleClientData.totalPaidAmount).toBeCloseTo(150.0);
      expect(responsibleClientData.totalOutstandingBalance).toBeCloseTo(300.0);

      expect(responseBody.pagination.total).toBe(1);
    });

    it("getOutstandingBalances_ClientInGroup_MultipleResponsibleBillingContacts", async () => {
      // 1. Setup
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
        // Another member, not responsible
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

      // Both Carol (client1) and David (client2) are marked responsible
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
          adjustable_amount: new Prisma.Decimal(100.0), // Outstanding: 100, Paid: 400
        },
      });
      createdAppointmentIds.push(appointment.id);

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1); // Crucially, only ONE client should be listed as the billable entity

      const billableClientData = responseBody.data[0];
      // Carol (client1) should be chosen due to earlier created_at as a tie-breaker
      expect(billableClientData.clientId).toBe(client1.id);
      expect(billableClientData.clientLegalFirstName).toBe("Carol");
      expect(billableClientData.clientLegalLastName).toBe("Davis");

      // Calculations are for the single group appointment
      expect(billableClientData.totalServiceAmount).toBeCloseTo(500.0);
      expect(billableClientData.totalPaidAmount).toBeCloseTo(400.0);
      expect(billableClientData.totalOutstandingBalance).toBeCloseTo(100.0);

      expect(responseBody.pagination.total).toBe(1);
    });

    it("getOutstandingBalances_ClientInGroup_NoResponsibleBillingContacts", async () => {
      // 1. Setup
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

      // No client is marked responsible
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
          adjustable_amount: new Prisma.Decimal(30.0), // Outstanding: 30, Paid: 150
        },
      });
      createdAppointmentIds.push(appointment.id);

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1); // One client should be chosen based on tie-breaker (created_at)

      const billableClientData = responseBody.data[0];
      // Frank (client1) should be chosen due to earlier created_at as a tie-breaker
      expect(billableClientData.clientId).toBe(client1.id);
      expect(billableClientData.clientLegalFirstName).toBe("Frank");
      expect(billableClientData.clientLegalLastName).toBe("Green");

      expect(billableClientData.totalServiceAmount).toBeCloseTo(180.0);
      expect(billableClientData.totalPaidAmount).toBeCloseTo(150.0);
      expect(billableClientData.totalOutstandingBalance).toBeCloseTo(30.0);

      expect(responseBody.pagination.total).toBe(1);
    });

    it("getOutstandingBalances_ClientIsResponsibleForOwnAndGroupBilling", async () => {
      // 1. Setup
      // Client (Henry)
      const henry = await prisma.client.create({
        data: {
          legal_first_name: "Henry",
          legal_last_name: "Ford",
          is_active: true,
          created_at: new Date("2023-03-01T10:00:00.000Z"),
        },
      });
      createdClientIds.push(henry.id);

      // Henry's individual "group" for his own appointments
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

      // Henry's own appointment
      const henrysAppt = await prisma.appointment.create({
        data: {
          client_group_id: henrysPersonalGroup.id,
          type: "Personal Consult",
          start_date: new Date("2024-03-05T10:00:00.000Z"),
          end_date: new Date("2024-03-05T11:00:00.000Z"),
          created_by: "test-user",
          status: "completed",
          appointment_fee: new Prisma.Decimal(100.0),
          adjustable_amount: new Prisma.Decimal(20.0), // Paid 80, Due 20
          write_off: new Prisma.Decimal(0.0),
        },
      });
      createdAppointmentIds.push(henrysAppt.id);

      // Another Client Group (Family Group) where Henry is also responsible
      const familyClientGroup = await prisma.clientGroup.create({
        data: {
          id: `group-ford-family`,
          type: "Family",
          name: "Ford Family",
          is_active: true,
        },
      });
      createdClientGroupIds.push(familyClientGroup.id);

      // Add Henry to this family group as responsible
      await prisma.clientGroupMembership.create({
        data: {
          client_id: henry.id,
          client_group_id: familyClientGroup.id,
          is_responsible_for_billing: true,
          role: "Parent",
        },
      });

      // Add another member to the family group (not responsible for billing)
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

      // Appointment for the Family Group
      const familyAppt = await prisma.appointment.create({
        data: {
          client_group_id: familyClientGroup.id,
          type: "Family Session",
          start_date: new Date("2024-03-15T10:00:00.000Z"),
          end_date: new Date("2024-03-15T11:00:00.000Z"),
          created_by: "test-user",
          status: "completed",
          appointment_fee: new Prisma.Decimal(250.0),
          adjustable_amount: new Prisma.Decimal(50.0), // Paid 200, Due 50
          write_off: new Prisma.Decimal(0.0),
        },
      });
      createdAppointmentIds.push(familyAppt.id);

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1); // Only Henry should be listed

      const henryData = responseBody.data[0];
      expect(henryData.clientId).toBe(henry.id);
      expect(henryData.clientLegalFirstName).toBe("Henry");

      // Expected calculations for Henry (sum of his personal appt and family group appt):
      // Henry's Appt: Service=100, Paid=80, Outstanding=20
      // Family Appt:  Service=250, Paid=200, Outstanding=50
      // Totals: Service=350, Paid=280, Outstanding=70
      expect(henryData.totalServiceAmount).toBeCloseTo(350.0);
      expect(henryData.totalPaidAmount).toBeCloseTo(280.0);
      expect(henryData.totalOutstandingBalance).toBeCloseTo(70.0);

      expect(responseBody.pagination.total).toBe(1);
    });

    it("getOutstandingBalances_Pagination_WorksAsExpected", async () => {
      // 1. Setup: Create enough clients and appointments to span multiple pages
      const numClients = 7; // e.g., 3 pages if rowsPerPage is 3, or 2 pages if rowsPerPage is 5
      const clientsData = [];

      for (let i = 0; i < numClients; i++) {
        const client = await prisma.client.create({
          data: {
            legal_first_name: `PageClient${i + 1}`,
            legal_last_name: "Test",
            is_active: true,
            created_at: new Date(2023, 0, i + 1), // Ensure distinct created_at for ordering
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
            ), // Alternate days to ensure some data
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

      // Test Page 1
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
      // Verify client names to ensure correct order (sorted by last_name, first_name by default in query)
      // Since all last names are "Test", it orders by first_name: PageClient1, PageClient2, PageClient3
      expect(responseBody.data[0].clientLegalFirstName).toBe("PageClient1");
      expect(responseBody.data[1].clientLegalFirstName).toBe("PageClient2");
      expect(responseBody.data[2].clientLegalFirstName).toBe("PageClient3");

      // Test Page 2
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

      // Test Page 3 (last page, might have fewer records)
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

    it("getOutstandingBalances_DateFiltering_StrictlyAdhered", async () => {
      // 1. Setup
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

      // Appointments: one before, one within, one at start, one at end, one after the target range
      const targetStartDate = new Date("2024-03-15T00:00:00.000Z");
      // const targetEndDate = new Date("2024-03-20T23:59:59.999Z"); // Route logic sets end date to end of day

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

      // 2. Make API Call (using YYYY-MM-DD strings as the API expects)
      const apiStartDate = "2024-03-15";
      const apiEndDate = "2024-03-20";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${apiStartDate}&endDate=${apiEndDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1); // Still one client

      const clientData = responseBody.data[0];
      // Expected total service amount = apptWithin (20) + apptAtStart (30) + apptAtEnd (40) = 90
      // Adjustable for apptWithin is 5. Others are 0 or null.
      // Paid for apptWithin = 20-5=15. Paid for apptAtStart=30. Paid for apptAtEnd=40. Total Paid = 15+30+40 = 85
      // Outstanding = 5
      expect(clientData.totalServiceAmount).toBeCloseTo(90.0);
      expect(clientData.totalPaidAmount).toBeCloseTo(85.0);
      expect(clientData.totalOutstandingBalance).toBeCloseTo(5.0);
      expect(responseBody.pagination.total).toBe(1);
    });

    it("getOutstandingBalances_NoAppointmentsInDateRange_ReturnsEmpty", async () => {
      // 1. Setup: Create a client, but no appointments in the target range
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

      // Create an appointment OUTSIDE the query range to ensure it's not picked up
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

      // 2. Make API Call for a range with no appointments
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(0);
      expect(responseBody.pagination.total).toBe(0);
      expect(responseBody.pagination.totalPages).toBe(0); // Math.ceil(0 / anyRowsPerPage) = 0
      expect(responseBody.pagination.page).toBe(1); // Default page is 1
      expect(responseBody.pagination.rowsPerPage).toBe(20); // Default rowsPerPage
    });

    it("getOutstandingBalances_AppointmentsWithNullFinancialFields_TreatedAsZero", async () => {
      // 1. Setup
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

      // Appointment 1: All null financial fields
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
      // Expected: Service=0, Paid=0, Outstanding=0

      // Appointment 2: Fee present, others null
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
      // Expected: Service=100, Paid=100, Outstanding=0

      // Appointment 3: Fee and write_off present, adjustable_amount null
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
      // Expected: Service=150, Paid=130 (150-20), Outstanding=0

      // Appointment 4: Fee and adjustable_amount present, write_off null
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
      // Expected: Service=200, Paid=170 (200-30), Outstanding=30

      createdAppointmentIds.push(appt1.id, appt2.id, appt3.id, appt4.id);

      // 2. Make API Call
      const startDate = "2024-03-01";
      const endDate = "2024-03-31";
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data).toHaveLength(1);

      const clientData = responseBody.data[0];
      expect(clientData.clientId).toBe(client.id);

      // Total Service = 0 (appt1) + 100 (appt2) + 150 (appt3) + 200 (appt4) = 450
      // Total Paid = 0 (appt1) + 100 (appt2) + 130 (appt3) + 170 (appt4) = 400
      // Total Outstanding = 0 (appt1) + 0 (appt2) + 0 (appt3) + 30 (appt4) = 30

      expect(clientData.totalServiceAmount).toBeCloseTo(450.0);
      expect(clientData.totalPaidAmount).toBeCloseTo(400.0);
      expect(clientData.totalOutstandingBalance).toBeCloseTo(30.0);

      expect(responseBody.pagination.total).toBe(1);
    });
  });

  // TODO: Add integration tests as per the plan
});
