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
  });

  // TODO: Add integration tests as per the plan
});
