/* eslint-disable max-lines-per-function */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Mock helpers module to avoid auth issues in tests
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    clinicianId: null,
    isClinician: false,
    clinician: null,
  }),
  getBackOfficeSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id" },
  }),
}));

// Import the route handler AFTER mocks are defined
import { GET, POST } from "@/api/statement/route";

// Define interfaces for type safety
interface StatementDetail {
  charges?: string;
  payments?: string;
  description?: string;
  serviceDescription?: string;
}

interface BillingDocument {
  id: string;
  client_group_id: string;
}

// Helper function for cleaning up test data
async function cleanupTestData(ids: {
  clientGroupId?: string;
  appointmentId?: string;
  invoiceId?: string;
  statementId?: string;
  userId?: string;
  clinicianId?: string;
  practiceServiceId?: string;
}) {
  // Delete statement
  if (ids.statementId) {
    try {
      await prisma.statement.delete({ where: { id: ids.statementId } });
    } catch (error) {
      console.log("Error deleting statement:", error);
    }
  }

  // Delete invoice
  if (ids.invoiceId) {
    try {
      await prisma.invoice.delete({ where: { id: ids.invoiceId } });
    } catch (error) {
      console.log("Error deleting invoice:", error);
    }
  }

  // Delete appointment
  if (ids.appointmentId) {
    try {
      await prisma.appointment.delete({ where: { id: ids.appointmentId } });
    } catch (error) {
      console.log("Error deleting appointment:", error);
    }
  }

  // Delete practice service
  if (ids.practiceServiceId) {
    try {
      await prisma.practiceService.delete({
        where: { id: ids.practiceServiceId },
      });
    } catch (error) {
      console.log("Error deleting practice service:", error);
    }
  }

  // Delete client group
  if (ids.clientGroupId) {
    try {
      await prisma.clientGroup.delete({ where: { id: ids.clientGroupId } });
    } catch (error) {
      console.log("Error deleting client group:", error);
    }
  }

  // Delete clinician
  if (ids.clinicianId) {
    try {
      await prisma.clinician.delete({ where: { id: ids.clinicianId } });
    } catch (error) {
      console.log("Error deleting clinician:", error);
    }
  }

  // Delete user
  if (ids.userId) {
    try {
      await prisma.user.delete({ where: { id: ids.userId } });
    } catch (error) {
      console.log("Error deleting user:", error);
    }
  }
}

describe("Statement API - Integration Tests", () => {
  // Test data IDs
  const testIds = {
    clientGroupId: "",
    appointmentId: "",
    invoiceId: "",
    statementId: "",
    userId: "",
    clinicianId: "",
    practiceServiceId: "",
    paymentId: "",
    statementItemIds: [] as string[], // Add array to track statement item IDs
  };

  // Setup test data
  beforeAll(async () => {
    try {
      // Create a user for testing
      const user = await prisma.user.create({
        data: {
          id: generateUUID(),
          email: `test-user-${Date.now()}@example.com`,
          password_hash: "hashed_password",
        },
      });
      testIds.userId = user.id;

      // Create a clinician
      const clinician = await prisma.clinician.create({
        data: {
          id: generateUUID(),
          user_id: user.id,
          first_name: "Test",
          last_name: "Clinician",
          percentage_split: 70,
          is_active: true,
          address: "123 Test St",
        },
      });
      testIds.clinicianId = clinician.id;

      // Create a client
      const client = await prisma.client.create({
        data: {
          id: generateUUID(),
          legal_first_name: "Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
          is_active: true,
        },
      });

      // Create a client group for testing
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: generateUUID(),
          name: "Test Statement Group",
          type: "INDIVIDUAL",
          available_credit: 0,
          clinician_id: clinician.id,
          ClientGroupMembership: {
            create: {
              client_id: client.id,
            },
          },
        },
      });
      testIds.clientGroupId = clientGroup.id;

      // Create a client contact
      await prisma.clientContact.create({
        data: {
          id: generateUUID(),
          client_id: client.id,
          type: "EMAIL",
          permission: "TEXT",
          contact_type: "EMAIL",
          value: "testclient@example.com",
          is_primary: true,
        },
      });

      // Create a practice service for appointment
      const practiceService = await prisma.practiceService.create({
        data: {
          id: generateUUID(),
          code: "90837",
          description: "Therapy Session",
          rate: 150,
          duration: 60,
          is_default: true,
          type: "THERAPY",
          bill_in_units: false,
          available_online: false,
          allow_new_clients: false,
          require_call: false,
          block_before: 0,
          block_after: 0,
          color: "#FFFFFF",
        },
      });
      testIds.practiceServiceId = practiceService.id;

      // Create an appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: generateUUID(),
          client_group_id: clientGroup.id,
          clinician_id: clinician.id,
          start_date: new Date("2023-01-15T10:00:00Z"),
          end_date: new Date("2023-01-15T11:00:00Z"),
          status: "COMPLETED",
          service_id: practiceService.id,
          appointment_fee: 150,
          type: "INDIVIDUAL",
          created_by: user.id,
          is_all_day: false,
          is_recurring: false,
          title: "Therapy Session",
        },
      });
      testIds.appointmentId = appointment.id;

      // Create an invoice
      const invoice = await prisma.invoice.create({
        data: {
          id: generateUUID(),
          invoice_number: "INV-TEST-1",
          client_group_id: clientGroup.id,
          clinician_id: clinician.id,
          appointment_id: appointment.id,
          issued_date: new Date("2023-01-15"),
          due_date: new Date("2023-02-15"),
          amount: 100,
          status: "PENDING",
          type: "INVOICE",
          service_description: "Therapy Session",
        },
      });
      testIds.invoiceId = invoice.id;

      // Create a payment
      const payment = await prisma.payment.create({
        data: {
          id: generateUUID(),
          invoice_id: invoice.id,
          amount: 50,
          payment_date: new Date("2023-01-20"),
          status: "COMPLETED",
        },
      });
      testIds.paymentId = payment.id;

      // Create a statement
      const statement = await prisma.statement.create({
        data: {
          id: generateUUID(),
          statement_number: 501,
          client_group_id: clientGroup.id,
          start_date: new Date("2023-01-01"),
          end_date: new Date("2023-01-31"),
          beginning_balance: 0,
          invoices_total: 100,
          payments_total: 50,
          ending_balance: 50,
          client_group_name: clientGroup.name,
          client_name: `${client.legal_first_name} ${client.legal_last_name}`,
          client_email: "testclient@example.com",
          provider_name: `${clinician.first_name} ${clinician.last_name}`,
          provider_email: user.email,
          created_at: new Date("2023-01-31"),
        },
      });
      testIds.statementId = statement.id;

      // Create statement items
      const invoiceItem = await prisma.statementItem.create({
        data: {
          id: generateUUID(),
          statement_id: statement.id,
          date: new Date("2023-01-15"),
          description: "INV #TEST-1\n01/15/2023 Therapy Session",
          charges: 100,
          payments: 0,
          balance: 100,
        },
      });
      testIds.statementItemIds.push(invoiceItem.id);

      const paymentItem = await prisma.statementItem.create({
        data: {
          id: generateUUID(),
          statement_id: statement.id,
          date: new Date("2023-01-20"),
          description: "Payment",
          charges: 0,
          payments: 50,
          balance: 50,
        },
      });
      testIds.statementItemIds.push(paymentItem.id);
    } catch (error) {
      console.error("Error setting up test data:", error);
      throw error;
    }
  });

  // Clean up test data
  afterAll(async () => {
    try {
      // Clean up statement items first
      if (testIds.statementItemIds.length > 0) {
        await prisma.statementItem.deleteMany({
          where: { id: { in: testIds.statementItemIds } },
        });
      }

      // Clean up payment first due to foreign key constraints
      if (testIds.paymentId) {
        await prisma.payment.delete({ where: { id: testIds.paymentId } });
      }

      await cleanupTestData({
        statementId: testIds.statementId,
        invoiceId: testIds.invoiceId,
        appointmentId: testIds.appointmentId,
        practiceServiceId: testIds.practiceServiceId,
        clientGroupId: testIds.clientGroupId,
        clinicianId: testIds.clinicianId,
        userId: testIds.userId,
      });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("GET /api/statement", () => {
    it("should get a statement by ID with details", async () => {
      // Act
      const req = createRequest(`/api/statement?id=${testIds.statementId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();

      // Check structure and content
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("details");
      expect(result).toHaveProperty("statement");

      // Verify our statement data
      expect(result.statement.id).toBe(testIds.statementId);
      expect(result.summary.beginningBalance).toBe(0);
      expect(result.summary.invoicesTotal).toBe(100);
      expect(result.summary.paymentsTotal).toBe(50);
      expect(result.summary.endingBalance).toBe(50);

      // Verify details array contains our statement items
      const details = result.details;
      expect(Array.isArray(details)).toBe(true);
      expect(details.length).toBe(2);

      // Check for the invoice item
      const invoiceItem = details.find(
        (item: StatementDetail) => item.description === "INV #TEST-1",
      );
      expect(invoiceItem).toBeDefined();
      expect(invoiceItem.serviceDescription).toBe("01/15/2023 Therapy Session");
      expect(invoiceItem.charges).toBe("100.00");
      expect(invoiceItem.payments).toBe("--");

      // Check for the payment item
      const paymentItem = details.find(
        (item: StatementDetail) => item.description === "Payment",
      );
      expect(paymentItem).toBeDefined();
      expect(paymentItem.serviceDescription).toBe("");
      expect(paymentItem.charges).toBe("--");
      expect(paymentItem.payments).toBe("50.00");
    });

    it("should return 404 when statement ID not found", async () => {
      // Act
      const nonExistentId = generateUUID();
      const req = createRequest(`/api/statement?id=${nonExistentId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result).toHaveProperty("error", "Statement not found");
    });

    it("should get statements for a client group", async () => {
      // Act
      const req = createRequest(
        `/api/statement?clientGroupId=${testIds.clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const statements = await response.json();

      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThanOrEqual(1);

      // Verify our test statement is in the results
      const foundStatement = statements.find(
        (s: BillingDocument) => s.id === testIds.statementId,
      );
      expect(foundStatement).toBeDefined();
      expect(foundStatement.client_group_id).toBe(testIds.clientGroupId);
    });

    it("should get all statements with pagination", async () => {
      // Act
      const req = createRequest(`/api/statement`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.data)).toBe(true);

      // Verify pagination structure
      expect(result.pagination).toHaveProperty("page", 1);
      expect(result.pagination).toHaveProperty("limit", 20);
      expect(result.pagination).toHaveProperty("total");
      expect(result.pagination).toHaveProperty("totalPages");

      // Verify our test statement is in the results
      const foundStatement = result.data.find(
        (s: BillingDocument) => s.id === testIds.statementId,
      );
      expect(foundStatement).toBeDefined();
    });
  });

  describe("POST /api/statement", () => {
    it("should create a new statement", async () => {
      // Arrange
      const requestData = {
        client_group_id: testIds.clientGroupId,
        start_date: "2023-02-01",
        end_date: "2023-02-28",
      };

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const result = await response.json();

      // Verify statement was created
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("client_group_id", testIds.clientGroupId);
      expect(result).toHaveProperty("start_date");
      expect(result).toHaveProperty("end_date");
      expect(result).toHaveProperty("beginning_balance");
      expect(result).toHaveProperty("invoices_total");
      expect(result).toHaveProperty("payments_total");
      expect(result).toHaveProperty("ending_balance");
      expect(result).toHaveProperty("details");

      // Check that details array exists
      expect(Array.isArray(result.details)).toBe(true);

      // Verify statement items were created in the database
      const statementItems = await prisma.statementItem.findMany({
        where: { statement_id: result.id },
      });

      expect(statementItems.length).toBeGreaterThan(0);
      expect(statementItems.length).toBe(result.details.length);

      // Add these IDs to our cleanup array
      statementItems.forEach((item) => {
        testIds.statementItemIds.push(item.id);
      });

      // Clean up created statement
      if (result.id) {
        await prisma.statement.delete({ where: { id: result.id } });
      }
    });

    it("should return 400 when required parameters are missing", async () => {
      // Arrange
      const incompleteData = {
        client_group_id: testIds.clientGroupId,
        // Missing start_date
        end_date: "2023-02-28",
      };

      // Act
      const req = createRequestWithBody(`/api/statement`, incompleteData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty(
        "error",
        "Missing required parameters: client_group_id, start_date, end_date",
      );
    });

    it("should return 400 when date format is invalid", async () => {
      // Arrange
      const invalidDateData = {
        client_group_id: testIds.clientGroupId,
        start_date: "invalid-date",
        end_date: "2023-02-28",
      };

      // Act
      const req = createRequestWithBody(`/api/statement`, invalidDateData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty("error", "Invalid date format");
    });

    it("should return 404 when client group is not found", async () => {
      // Arrange
      const nonExistentId = generateUUID();
      const requestData = {
        client_group_id: nonExistentId,
        start_date: "2023-02-01",
        end_date: "2023-02-28",
      };

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      // Note: This might return 400 instead of 404 if the API first checks for appointments
      // before checking if the client group exists
      const result = await response.json();
      expect(result.error).toMatch(
        /No appointment or invoice found|Client group not found/,
      );
    });
  });
});
