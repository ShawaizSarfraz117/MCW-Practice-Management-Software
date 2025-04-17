import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";

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
import { createRequestWithBody } from "@mcw/utils";
import { POST } from "../../../../src/app/api/invoice/payment/route";

describe("Invoice Payment API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Generate valid UUID for testing
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

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
      client_group_membership_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
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
      invoice_id: invoiceId,
      amount: 75,
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
    };

    // Mock behaviors
    prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
    prismaMock.creditCard.findUnique.mockResolvedValueOnce(creditCard);
    prismaMock.payment.create.mockResolvedValueOnce(newPayment);

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.invoice_id).toBe(invoice.id);
    expect(json.credit_card_id).toBe(creditCard.id);
    expect(json.transaction_id).toBe("tx_123456");
    expect(json.status).toBe("COMPLETED");

    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        invoice_id: invoice.id,
        amount: 75,
        credit_card_id: creditCard.id,
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

    const paymentData = {
      invoice_id: invoiceId,
      amount: 75,
      credit_card_id: creditCardId,
      status: "COMPLETED",
    };

    // Mock behaviors
    prismaMock.invoice.findUnique.mockResolvedValueOnce(null);

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
      client_group_membership_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
      Payment: [],
    };

    const paymentData = {
      invoice_id: invoiceId,
      amount: 75,
      credit_card_id: creditCardId,
      status: "COMPLETED",
    };

    // Mock behaviors
    prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
    prismaMock.creditCard.findUnique.mockResolvedValueOnce(null);

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
      client_group_membership_id: clientGroupId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(100),
      status: "PENDING",
      Payment: [],
    };

    const paymentData = {
      invoice_id: invoiceId,
      amount: 100, // Full payment amount
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
    };

    // Mock behaviors
    prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);
    prismaMock.payment.create.mockResolvedValueOnce(newPayment);
    prismaMock.invoice.update.mockResolvedValueOnce({
      ...invoice,
      status: "PAID",
    });

    // Act
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.invoice_id).toBe(invoice.id);

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: invoice.id },
      data: { status: "PAID" },
    });
  });

  it("POST /api/invoice/payment should handle validation errors", async () => {
    // Arrange
    const invalidPaymentData = {
      invoice_id: "invalid-uuid-format", // Invalid UUID format
      amount: -50, // Invalid negative amount
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
    expect(json).toHaveProperty("details");
  });
});
