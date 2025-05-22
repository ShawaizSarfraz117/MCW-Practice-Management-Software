import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/api/analytics/appointmentStatus/route";
import { prisma } from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { v4 as uuidv4 } from "uuid";

describe("Appointment Status API Integration", () => {
  let testUser: { id: string };

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.surveyAnswers.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clientGroupMembership.deleteMany();
    await prisma.clientGroup.deleteMany();
    await prisma.clientContact.deleteMany();
    await prisma.clientReminderPreference.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.clientProfile.deleteMany();
    await prisma.clientAdress.deleteMany();
    await prisma.creditCard.deleteMany();
    await prisma.clinicianClient.deleteMany();
    await prisma.client.deleteMany();
    await prisma.surveyTemplate.deleteMany();
    await prisma.clinician.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user for the appointments
    testUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: `test-${uuidv4()}@example.com`,
        password_hash: "hashed_password_for_testing",
      },
    });
  });

  describe("GET /api/analytics/appointmentStatus", () => {
    it("should return appointments for the given date range", async () => {
      // Create test data
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(1); // First day of current month
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of current month

      // Create a client group
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: uuidv4(),
          name: "Test Group",
          type: "FAMILY",
          available_credit: 0,
        },
      });

      // Create a client
      const client = await prisma.client.create({
        data: {
          id: uuidv4(),
          legal_first_name: "Test",
          legal_last_name: "Client",
          is_active: true,
        },
      });

      // Create client group membership
      await prisma.clientGroupMembership.create({
        data: {
          client_group_id: clientGroup.id,
          client_id: client.id,
          role: "PRIMARY",
        },
      });

      // Create an appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: uuidv4(),
          type: "CONSULTATION",
          start_date: now,
          end_date: new Date(now.getTime() + 3600000),
          status: "SCHEDULED",
          client_group_id: clientGroup.id,
          created_by: testUser.id,
          appointment_fee: 100,
        },
      });

      // Create an invoice
      const invoice = await prisma.invoice.create({
        data: {
          id: uuidv4(),
          invoice_number: "INV-001",
          appointment_id: appointment.id,
          issued_date: now,
          due_date: new Date(now.getTime() + 7 * 24 * 3600000),
          amount: 100,
          status: "UNPAID",
          type: "STANDARD",
        },
      });

      // Create a payment
      await prisma.payment.create({
        data: {
          id: uuidv4(),
          invoice_id: invoice.id,
          amount: 50,
          status: "Completed",
          payment_date: now,
        },
      });

      // Create a survey template
      const surveyTemplate = await prisma.surveyTemplate.create({
        data: {
          id: uuidv4(),
          name: "Test Template",
          content: '{"fields": []}',
          updated_at: now,
          type: "PROGRESS_NOTE",
        },
      });

      // Create a survey answer
      await prisma.surveyAnswers.create({
        data: {
          id: uuidv4(),
          appointment_id: appointment.id,
          template_id: surveyTemplate.id,
          content: '{"answers": []}',
          status: "COMPLETED",
          assigned_at: now,
          completed_at: now,
          client_id: client.id,
        },
      });

      const request = createRequest(
        `/api/analytics/appointmentStatus?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toEqual({
        id: appointment.id,
        dateOfService: appointment.start_date.toISOString(),
        client: clientGroup.name,
        units: 1,
        totalFee: "$100",
        progressNoteStatus: "COMPLETED",
        status: "UNPAID",
        charge: "$100",
        uninvoiced: "--",
        paid: "$50",
        unpaid: "$50",
      });
    });

    it("should filter by client group", async () => {
      const now = new Date();
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: uuidv4(),
          name: "Test Group",
          type: "FAMILY",
          available_credit: 0,
        },
      });

      await prisma.appointment.create({
        data: {
          id: uuidv4(),
          type: "CONSULTATION",
          start_date: now,
          end_date: new Date(now.getTime() + 3600000),
          status: "SCHEDULED",
          client_group_id: clientGroup.id,
          created_by: testUser.id,
          appointment_fee: 100,
        },
      });

      const request = createRequest(
        `/api/analytics/appointmentStatus?startDate=${now.toISOString()}&endDate=${now.toISOString()}&clientId=${clientGroup.id}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].client).toBe(clientGroup.name);
    });

    it("should filter by note status", async () => {
      const now = new Date();
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: uuidv4(),
          name: "Test Group",
          type: "FAMILY",
          available_credit: 0,
        },
      });

      await prisma.appointment.create({
        data: {
          id: uuidv4(),
          type: "CONSULTATION",
          start_date: now,
          end_date: new Date(now.getTime() + 3600000),
          status: "SCHEDULED",
          client_group_id: clientGroup.id,
          created_by: testUser.id,
          appointment_fee: 100,
        },
      });

      const request = createRequest(
        `/api/analytics/appointmentStatus?startDate=${now.toISOString()}&endDate=${now.toISOString()}&noteStatus=no_note`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].progressNoteStatus).toBe("NO NOTE");
    });

    it("should handle missing date range", async () => {
      const request = createRequest("/api/analytics/appointmentStatus");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing date range");
    });

    it("should handle pagination", async () => {
      const now = new Date();
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: uuidv4(),
          name: "Test Group",
          type: "FAMILY",
          available_credit: 0,
        },
      });

      // Create 25 appointments without storing the results
      await Promise.all(
        Array.from({ length: 25 }).map(() =>
          prisma.appointment.create({
            data: {
              id: uuidv4(),
              type: "CONSULTATION",
              start_date: now,
              end_date: new Date(now.getTime() + 3600000),
              status: "SCHEDULED",
              client_group_id: clientGroup.id,
              created_by: testUser.id,
              appointment_fee: 100,
            },
          }),
        ),
      );

      const request = createRequest(
        `/api/analytics/appointmentStatus?startDate=${now.toISOString()}&endDate=${now.toISOString()}&page=2&pageSize=10`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(10);
      expect(data.pagination).toEqual({
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });
  });
});
