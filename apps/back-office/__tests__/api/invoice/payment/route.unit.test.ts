/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";
import { createRequestWithBody } from "@mcw/utils";
import { POST } from "@/api/invoice/payment/route";
import { generateUUID } from "@mcw/utils";
// Mock database module
vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
}));

// Mock logger module
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Prisma client
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => prismaMock),
}));

// Import after mocks are defined

describe("Invoice Payment API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Generate valid UUID for testing

  it("POST /api/invoice/payment should create a new payment", async () => {
    // Arrange
    const invoiceId = generateUUID();
    const creditCardId = generateUUID();
    const paymentId = generateUUID();
    const clientGroupId = generateUUID();
    const clinicianId = generateUUID();

    const invoice = {
      id: invoiceId,
      invoice_number: "INV-123",
      client_group_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
      type: "INVOICE",
      client_info: null,
      provider_info: null,
      service_description: null,
      notes: null,
      Payment: [],
    };

    const creditCard = {
      id: creditCardId,
      client_id: generateUUID(),
      card_type: "visa",
      last_four: "4242",
      expiry_month: 12,
      expiry_year: 2030,
      cardholder_name: "Test User",
      is_default: true,
      billing_address: null,
      token: null,
      created_at: new Date(),
    };

    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoiceId,
          amount: 75,
        },
      ],
      client_group_id: clientGroupId,
      credit_card_id: creditCardId,
      transaction_id: "tx_123456",
      status: "COMPLETED",
      response: "Payment processed successfully",
    };

    const newPayment = {
      id: paymentId,
      invoice_id: invoiceId,
      amount: new Decimal(75),
      credit_card_id: creditCardId,
      transaction_id: "tx_123456",
      status: "COMPLETED",
      response: "Payment processed successfully",
      payment_date: new Date(),
      credit_applied: new Decimal(0),
    };

    // Mock behaviors
    prismaMock.$transaction.mockImplementation(async (callback) => {
      // Mock the transaction handling
      prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
      prismaMock.creditCard.findUnique.mockResolvedValueOnce(creditCard);
      prismaMock.payment.create.mockResolvedValueOnce(newPayment);

      const result = await callback(prismaMock);
      return result;
    });

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const responseData = await response.json();
    // Expect an array with one payment
    expect(Array.isArray(responseData)).toBe(true);
    const json = responseData[0];
    expect(json.invoice_id).toBe(invoice.id);
    expect(json.credit_card_id).toBe(creditCard.id);
    expect(json.transaction_id).toBe("tx_123456");
    expect(json.status).toBe("COMPLETED");

    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        invoice_id: invoice.id,
        amount: 75,
        credit_card_id: creditCardId,
        transaction_id: "tx_123456",
        status: "COMPLETED",
        response: "Payment processed successfully",
      }),
    });
  });

  it("POST /api/invoice/payment should return 404 if invoice not found", async () => {
    // Arrange
    const invoiceId = generateUUID();
    const creditCardId = generateUUID();
    const clientGroupId = generateUUID();

    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoiceId,
          amount: 75,
        },
      ],
      client_group_id: clientGroupId,
      credit_card_id: creditCardId,
      status: "COMPLETED",
    };

    // Mock behaviors - transaction throws error for invoice not found
    prismaMock.$transaction.mockImplementation(async () => {
      prismaMock.invoice.findUnique.mockResolvedValueOnce(null);
      // Simulate the transaction function throwing an error
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    });

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invoice not found");
  });

  it("POST /api/invoice/payment should return 404 if credit card not found", async () => {
    // Arrange
    const invoiceId = generateUUID();
    const creditCardId = generateUUID();
    const clientGroupId = generateUUID();
    const clinicianId = generateUUID();

    const invoice = {
      id: invoiceId,
      invoice_number: "INV-123",
      client_group_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
      Payment: [],
      type: "INVOICE",
      client_info: null,
      provider_info: null,
      service_description: null,
      notes: null,
    };

    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoiceId,
          amount: 75,
        },
      ],
      client_group_id: clientGroupId,
      credit_card_id: creditCardId,
      status: "COMPLETED",
    };

    // Mock behaviors - transaction throws error for credit card not found
    prismaMock.$transaction.mockImplementation(async () => {
      prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
      prismaMock.creditCard.findUnique.mockResolvedValueOnce(null);
      // Simulate the transaction function throwing an error
      throw new Error(`Credit card with ID ${creditCardId} not found`);
    });

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Credit card not found");
  });

  it("POST /api/invoice/payment should update invoice status when fully paid", async () => {
    // Arrange
    const invoiceId = generateUUID();
    const paymentId = generateUUID();
    const clientGroupId = generateUUID();
    const clinicianId = generateUUID();

    const invoice = {
      id: invoiceId,
      invoice_number: "INV-123",
      client_group_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
      Payment: [],
      type: "INVOICE",
      client_info: null,
      provider_info: null,
      service_description: null,
      notes: null,
    };

    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoiceId,
          amount: 100, // Full payment amount
        },
      ],
      client_group_id: clientGroupId,
      status: "COMPLETED",
    };

    const newPayment = {
      id: paymentId,
      invoice_id: invoiceId,
      amount: new Decimal(100),
      credit_card_id: null,
      transaction_id: null,
      status: "COMPLETED",
      response: null,
      payment_date: new Date(),
      credit_applied: new Decimal(0),
    };

    const updatedInvoice = {
      ...invoice,
      status: "PAID",
    };

    // Mock behaviors - simulate the transaction properly and update the invoice
    prismaMock.$transaction.mockImplementation(async (callback) => {
      // Setup mocks for the transaction execution
      prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
      prismaMock.payment.create.mockResolvedValueOnce(newPayment);
      prismaMock.invoice.update.mockResolvedValueOnce(updatedInvoice);

      // Execute the callback, which will use our mocks
      const result = await callback(prismaMock);
      return result;
    });

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const responseData = await response.json();
    expect(Array.isArray(responseData)).toBe(true);
    const json = responseData[0];
    expect(json.invoice_id).toBe(invoice.id);

    // Verify that the invoice.update was called
    expect(prismaMock.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invoiceId },
        data: { status: "PAID" },
      }),
    );
  });

  it("POST /api/invoice/payment should handle validation errors", async () => {
    // Arrange
    const invalidPaymentData = {
      // Missing required fields
      status: "COMPLETED",
    };

    // Act
    const req = createRequestWithBody(
      "/api/invoice/payment",
      invalidPaymentData,
    );
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid request data");
  });
});
