import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@mcw/database";
import { safeCleanupDatabase } from "@mcw/database/test-utils";
import { generateUUID } from "@mcw/utils";
import { createRequest } from "@mcw/utils";
import { GET } from "@/api/billing-documents/route";

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

// Define type for billing document
interface BillingDocument {
  id: string;
  documentType: string;
  clientGroupId: string;
  date: Date | string;
  number: string;
  is_exported: boolean;
  clientGroupName: string;
}

describe("Billing Documents API - Integration Tests", () => {
  // Test data IDs
  const testIds = {
    clientGroupId: "",
    invoiceId: "",
    superbillId: "",
    statementId: "",
    appointmentId: "", // New field to track appointment ID
    userId: "", // Track user ID for cleanup
    clinicianId: "", // Track clinician ID for cleanup
  };

  // Setup test data
  beforeEach(async () => {
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
          address: "123 Test St", // Add required address field
        },
      });
      testIds.clinicianId = clinician.id;

      // Create a client group for testing
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: generateUUID(),
          name: "Test Billing Group",
          type: "INDIVIDUAL",
          available_credit: 0,
          clinician_id: clinician.id, // Associate with clinician
        },
      });
      testIds.clientGroupId = clientGroup.id;

      // Create a practice service for appointment
      const practiceService = await prisma.practiceService.create({
        data: {
          id: generateUUID(),
          code: "90837",
          description: "Therapy Session",
          rate: 150, // Use rate instead of fee
          duration: 60, // Required duration field in minutes
          is_default: true,
          type: "THERAPY", // Required type field
          bill_in_units: false,
          available_online: false,
          allow_new_clients: false,
          require_call: false,
          block_before: 0,
          block_after: 0,
          color: "#FFFFFF",
        },
      });

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
          issued_date: new Date("2023-01-15"),
          due_date: new Date("2023-02-15"),
          amount: 100,
          status: "PENDING",
          type: "INVOICE",
          is_exported: false,
        },
      });
      testIds.invoiceId = invoice.id;

      // Create a superbill
      const superbill = await prisma.superbill.create({
        data: {
          id: generateUUID(),
          superbill_number: 1001,
          client_group_id: clientGroup.id,
          Appointment: {
            connect: { id: appointment.id },
          },
          issued_date: new Date("2023-01-20"),
          created_at: new Date("2023-01-20"),
          status: "CREATED",
          client_name: "Test Client",
          provider_name: `${clinician.first_name} ${clinician.last_name}`,
          provider_email: user.email,
          created_by: user.id,
          is_exported: false,
        },
      });
      testIds.superbillId = superbill.id;

      // Create a statement
      const statement = await prisma.statement.create({
        data: {
          id: generateUUID(),
          statement_number: 501,
          client_group_id: clientGroup.id,
          beginning_balance: 0,
          invoices_total: 100,
          payments_total: 0,
          ending_balance: 100,
          client_group_name: clientGroup.name,
          client_name: "Test Client",
          created_at: new Date("2023-01-25"),
          is_exported: false,
        },
      });
      testIds.statementId = statement.id;
    } catch (error) {
      console.error("Error setting up test data:", error);
      throw error;
    }
  });

  afterEach(async () => {
    await safeCleanupDatabase(prisma, { verbose: false });
  });

  it("GET /api/billing-documents should return all billing documents", async () => {
    // Act
    const req = createRequest("/api/billing-documents");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    // Check pagination
    expect(result).toHaveProperty("pagination");
    expect(result.pagination).toHaveProperty("page", 1);
    expect(result.pagination).toHaveProperty("limit", 20);
    expect(result.pagination.total).toBeGreaterThanOrEqual(3); // At least our 3 created documents

    // Check data
    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);

    // Find our created documents in the results
    const ourInvoice = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.invoiceId,
    );
    const ourSuperbill = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.superbillId,
    );
    const ourStatement = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.statementId,
    );

    expect(ourInvoice).toBeDefined();
    expect(ourSuperbill).toBeDefined();
    expect(ourStatement).toBeDefined();

    // Check document type and transformation
    expect(ourInvoice.documentType).toBe("invoice");
    expect(ourInvoice.number).toBe("INV-TEST-1");
    expect(ourInvoice.is_exported).toBe(false);

    expect(ourSuperbill.documentType).toBe("superbill");
    expect(ourSuperbill.number).toBe("1001");
    expect(ourSuperbill.is_exported).toBe(false);

    expect(ourStatement.documentType).toBe("statement");
    expect(ourStatement.number).toBe("501");
    expect(ourStatement.is_exported).toBe(false);
  });

  it("GET /api/billing-documents?clientGroupId=<id> should filter by client group", async () => {
    // Act
    const req = createRequest(
      `/api/billing-documents?clientGroupId=${testIds.clientGroupId}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    // Check that all returned documents belong to our client group
    result.data.forEach((doc: BillingDocument) => {
      expect(doc.clientGroupId).toBe(testIds.clientGroupId);
    });

    // Verify all our test documents are found
    const documentIds = result.data.map((doc: BillingDocument) => doc.id);
    expect(documentIds).toContain(testIds.invoiceId);
    expect(documentIds).toContain(testIds.superbillId);
    expect(documentIds).toContain(testIds.statementId);
  });

  it("GET /api/billing-documents?type=invoice should filter by document type", async () => {
    // Act
    const req = createRequest(`/api/billing-documents?type=invoice`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    // Check that all returned documents are invoices
    result.data.forEach((doc: BillingDocument) => {
      expect(doc.documentType).toBe("invoice");
    });

    // Find our created invoice
    const ourInvoice = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.invoiceId,
    );
    expect(ourInvoice).toBeDefined();

    // Make sure other document types are not included
    const superbillFound = result.data.some(
      (doc: BillingDocument) => doc.id === testIds.superbillId,
    );
    const statementFound = result.data.some(
      (doc: BillingDocument) => doc.id === testIds.statementId,
    );
    expect(superbillFound).toBe(false);
    expect(statementFound).toBe(false);
  });

  it("GET /api/billing-documents?type=[...] should filter by multiple document types", async () => {
    // Act - Request only invoices and statements
    const types = JSON.stringify(["invoice", "statement"]);
    const req = createRequest(
      `/api/billing-documents?type=${encodeURIComponent(types)}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    // Check that all returned documents are either invoices or statements
    result.data.forEach((doc: BillingDocument) => {
      expect(["invoice", "statement"]).toContain(doc.documentType);
    });

    // Find our created invoice and statement
    const ourInvoice = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.invoiceId,
    );
    const ourStatement = result.data.find(
      (doc: BillingDocument) => doc.id === testIds.statementId,
    );
    expect(ourInvoice).toBeDefined();
    expect(ourStatement).toBeDefined();

    // Make sure superbills are not included
    const superbillFound = result.data.some(
      (doc: BillingDocument) => doc.id === testIds.superbillId,
    );
    expect(superbillFound).toBe(false);
  });

  it("GET /api/billing-documents with date range should filter by date", async () => {
    // Act - Use a date range that includes all our test documents
    const startDate = "2023-01-01";
    const endDate = "2023-01-31";
    const req = createRequest(
      `/api/billing-documents?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    // Verify all our test documents are found (they all fall within the date range)
    const documentIds = result.data.map((doc: BillingDocument) => doc.id);
    expect(documentIds).toContain(testIds.invoiceId);
    expect(documentIds).toContain(testIds.superbillId);
    expect(documentIds).toContain(testIds.statementId);

    // Act - Use a date range that excludes all our test documents
    const futureStartDate = "2023-03-01";
    const futureEndDate = "2023-03-31";
    const reqFuture = createRequest(
      `/api/billing-documents?startDate=${futureStartDate}&endDate=${futureEndDate}`,
    );
    const responseFuture = await GET(reqFuture);

    // Assert
    expect(responseFuture.status).toBe(200);
    const resultFuture = await responseFuture.json();

    // Verify none of our test documents are found
    const futureDocs = resultFuture.data;
    const hasTestDocs = futureDocs.some(
      (doc: BillingDocument) =>
        doc.id === testIds.invoiceId ||
        doc.id === testIds.superbillId ||
        doc.id === testIds.statementId,
    );
    expect(hasTestDocs).toBe(false);
  });
});
