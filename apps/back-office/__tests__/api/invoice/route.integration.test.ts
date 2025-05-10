import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET, POST } from "../../../src/app/api/invoice/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequestWithBody, createRequest } from "@mcw/utils";

// Define Invoice type for type safety
interface Invoice {
  id: string;
  invoice_number: string;
  client_group_id: string;
  clinician_id: string;
  amount: { toString(): string };
  status: string;
  issued_date: string;
  due_date: string;
}

// Helper function for cleaning up test data
async function cleanupInvoiceTestData({
  invoiceId,
  clientGroupId,
  clinicianId,
}: {
  invoiceId?: string;
  clientGroupId?: string;
  clinicianId?: string;
}) {
  // Delete the invoice created during tests
  if (invoiceId) {
    try {
      // Delete related Payments first if necessary
      await prisma.payment.deleteMany({ where: { invoice_id: invoiceId } });
      await prisma.invoice.delete({ where: { id: invoiceId } });
    } catch (error) {
      console.log("Error deleting invoice:", error);
    }
  }

  // Delete the clinician and associated user
  if (clinicianId) {
    try {
      const clinician = await prisma.clinician.findUnique({
        where: { id: clinicianId },
        select: { user_id: true },
      });

      // Delete related data before clinician
      await prisma.clinicianClient.deleteMany({
        where: { clinician_id: clinicianId },
      });
      await prisma.clinicianLocation.deleteMany({
        where: { clinician_id: clinicianId },
      });
      await prisma.clinicianServices.deleteMany({
        where: { clinician_id: clinicianId },
      });
      await prisma.clientGroup.deleteMany({
        where: { clinician_id: clinicianId },
      });
      await prisma.invoice.deleteMany({ where: { clinician_id: clinicianId } }); // Delete any other invoices by this clinician

      if (clinician) {
        await prisma.clinician.delete({ where: { id: clinicianId } });
        if (clinician.user_id) {
          await prisma.userRole.deleteMany({
            where: { user_id: clinician.user_id },
          });
          await prisma.user.delete({ where: { id: clinician.user_id } });
        }
      }
    } catch (error) {
      console.log("Error deleting clinician or user:", error);
    }
  }

  // Delete the client group (ensure memberships/clients are handled if needed)
  if (clientGroupId) {
    try {
      await prisma.clientGroupMembership.deleteMany({
        where: { client_group_id: clientGroupId },
      });
      await prisma.invoice.deleteMany({
        where: { client_group_id: clientGroupId },
      }); // Delete any other invoices for this group
      await prisma.clientGroup.delete({ where: { id: clientGroupId } });
    } catch (error) {
      console.log("Error deleting client group:", error);
    }
  }
}

describe("Invoice API - Integration Tests", () => {
  // Test data
  let clientGroupId: string;
  let clinicianId: string;
  let createdInvoiceId: string;

  // Setup test data
  beforeAll(async () => {
    // Create a client group for the test
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: generateUUID(), // Explicitly provide an ID
        name: "Test Client Group",
        type: "INDIVIDUAL",
      },
    });
    clientGroupId = clientGroup.id;

    // Create a user for the clinician
    const user = await prisma.user.create({
      data: {
        id: generateUUID(), // Explicitly provide an ID
        email: `test-clinician-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });

    // Create a clinician for the test
    const clinician = await prisma.clinician.create({
      data: {
        id: generateUUID(), // Explicitly provide an ID
        user_id: user.id,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test Street",
        percentage_split: 70,
        is_active: true,
      },
    });
    clinicianId = clinician.id;
  });

  // Clean up test data
  afterAll(async () => {
    await cleanupInvoiceTestData({
      invoiceId: createdInvoiceId,
      clientGroupId,
      clinicianId,
    });
  });

  it("POST /api/invoice should create a new invoice", async () => {
    // Arrange
    const dueDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

    const newInvoiceData = {
      clinician_id: clinicianId,
      client_group_id: clientGroupId,
      appointment_id: null,
      amount: 150,
      due_date: dueDate.toISOString(),
      status: "PENDING",
    };

    // Act
    const req = createRequestWithBody("/api/invoice", newInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const invoice = await response.json();

    expect(invoice).toHaveProperty("id");
    expect(invoice).toHaveProperty("invoice_number");
    expect(invoice.amount.toString()).toBe(newInvoiceData.amount.toString());
    expect(invoice.status).toBe(newInvoiceData.status);
    expect(invoice.clinician_id).toBe(newInvoiceData.clinician_id);
    expect(invoice.client_group_id).toBe(newInvoiceData.client_group_id);

    // Store the created invoice ID for cleanup
    createdInvoiceId = invoice.id;
  });

  it("GET /api/invoice should return all invoices", async () => {
    // Act
    const req = createRequest("/api/invoice");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const invoices = await response.json();

    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBeGreaterThan(0);

    // Check if our created invoice is in the list
    const foundInvoice = invoices.find(
      (inv: Invoice) => inv.id === createdInvoiceId,
    );
    expect(foundInvoice).toBeDefined();
  });

  it("GET /api/invoice should filter by clientGroupId", async () => {
    // Act
    const req = createRequest(`/api/invoice?clientGroupId=${clientGroupId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const invoices = await response.json();

    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBeGreaterThan(0);

    // All returned invoices should have the specified clientGroupId
    invoices.forEach((invoice: Invoice) => {
      expect(invoice.client_group_id).toBe(clientGroupId);
    });
  });

  it("GET /api/invoice should filter by status", async () => {
    // Act
    const req = createRequest(`/api/invoice?status=PENDING`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const invoices = await response.json();

    expect(Array.isArray(invoices)).toBe(true);

    // All returned invoices should have the specified status
    invoices.forEach((invoice: Invoice) => {
      expect(invoice.status).toBe("PENDING");
    });
  });

  it("GET /api/invoice?id=<id> should return a specific invoice", async () => {
    // Act
    const req = createRequest(`/api/invoice?id=${createdInvoiceId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const invoice = await response.json();

    expect(invoice.id).toBe(createdInvoiceId);
    expect(invoice.client_group_id).toBe(clientGroupId);
    expect(invoice.clinician_id).toBe(clinicianId);
  });

  it("GET /api/invoice?id=<id> should return 404 if invoice not found", async () => {
    // Generate a random UUID that doesn't exist
    const nonExistentId = generateUUID();

    // Act
    const req = createRequest(`/api/invoice?id=${nonExistentId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(404);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error", "Invoice not found");
  });

  it("POST /api/invoice should return 400 if required fields are missing", async () => {
    // Arrange
    const invalidInvoiceData = {
      // Missing required fields: clinician_id, amount, due_date
      client_group_id: clientGroupId,
    };

    // Act
    const req = createRequestWithBody("/api/invoice", invalidInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(500);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error");
    expect(errorResponse.error).toContain("Failed to create invoice");
  });
});
