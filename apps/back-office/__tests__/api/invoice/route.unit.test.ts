// Mock modules before importing the module that depends on them
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Mock modules before importing the module that depends on them
vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the logger module
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => prismaMock),
}));

// Import the module under test after all mocks are defined
import { GET, POST } from "../../../src/app/api/invoice/route";

describe("Invoice API Unit Tests", () => {
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

  // Helper to create a valid invoice object with proper UUID formats
  const mockInvoice = (overrides = {}) => {
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    return {
      id: generateUUID(),
      invoice_number: "INV-1234",
      client_group_membership_id: generateUUID(),
      appointment_id: null, // Set to null to avoid foreign key constraint
      clinician_id: generateUUID(),
      issued_date: issuedDate,
      due_date: dueDate,
      amount: new Decimal(100),
      status: "PENDING",
      ClientGroupMembership: null,
      Appointment: null,
      Clinician: null,
      Payment: [],
      ...overrides,
    };
  };

  it("GET /api/invoice should return all invoices", async () => {
    // Arrange
    const invoice1 = mockInvoice();
    const invoice2 = mockInvoice();
    const invoices = [invoice1, invoice2];

    prismaMock.invoice.findMany.mockResolvedValueOnce(invoices);

    // Act
    const req = createRequest("/api/invoice");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(invoices.length);

    // Check for properties with date serialization handling
    expect(json[0].id).toBe(invoice1.id);
    expect(json[0].invoice_number).toBe(invoice1.invoice_number);
    expect(json[0].issued_date).toBe(invoice1.issued_date.toISOString());
    expect(json[0].due_date).toBe(invoice1.due_date.toISOString());

    expect(json[1].id).toBe(invoice2.id);
    expect(json[1].invoice_number).toBe(invoice2.invoice_number);
    expect(json[1].issued_date).toBe(invoice2.issued_date.toISOString());
    expect(json[1].due_date).toBe(invoice2.due_date.toISOString());

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        ClientGroupMembership: true,
        Appointment: true,
        Clinician: true,
        Payment: true,
      },
    });
  });

  it("GET /api/invoice should filter by client_group_membership_id and status", async () => {
    // Arrange
    const membershipId = generateUUID();
    const invoice = mockInvoice({ client_group_membership_id: membershipId });

    prismaMock.invoice.findMany.mockResolvedValueOnce([invoice]);

    // Act
    const req = createRequest(
      `/api/invoice?client_group_membership_id=${membershipId}&status=PENDING`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(invoice.id);
    expect(json[0].issued_date).toBe(invoice.issued_date.toISOString());
    expect(json[0].due_date).toBe(invoice.due_date.toISOString());

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith({
      where: {
        client_group_membership_id: membershipId,
        status: "PENDING",
      },
      include: {
        ClientGroupMembership: true,
        Appointment: true,
        Clinician: true,
        Payment: true,
      },
    });
  });

  it("GET /api/invoice?id=<id> should return a specific invoice", async () => {
    // Arrange
    const invoice = mockInvoice();

    prismaMock.invoice.findUnique.mockResolvedValueOnce(invoice);

    // Act
    const req = createRequest(`/api/invoice?id=${invoice.id}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.id).toBe(invoice.id);
    expect(json.invoice_number).toBe(invoice.invoice_number);
    expect(json.status).toBe(invoice.status);
    expect(json.issued_date).toBe(invoice.issued_date.toISOString());
    expect(json.due_date).toBe(invoice.due_date.toISOString());

    expect(prismaMock.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: invoice.id },
      include: {
        ClientGroupMembership: true,
        Appointment: true,
        Clinician: true,
        Payment: true,
      },
    });
  });

  it("GET /api/invoice?id=<id> should return 404 if invoice not found", async () => {
    // Arrange
    const invoiceId = generateUUID();

    prismaMock.invoice.findUnique.mockResolvedValueOnce(null);

    // Act
    const req = createRequest(`/api/invoice?id=${invoiceId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invoice not found");
  });

  it("POST /api/invoice should create a new invoice", async () => {
    // Arrange
    const clinicianId = generateUUID();
    const membershipId = generateUUID();
    const dueDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
    const issuedDate = new Date();

    const newInvoiceData = {
      clinician_id: clinicianId,
      client_group_membership_id: membershipId,
      appointment_id: null, // Set to null to avoid foreign key constraint
      amount: 150,
      due_date: dueDate.toISOString(),
      status: "PENDING",
    };

    const createdInvoice = {
      id: generateUUID(),
      invoice_number: "INV-1234567890",
      client_group_membership_id: membershipId,
      appointment_id: null,
      clinician_id: clinicianId,
      issued_date: issuedDate,
      due_date: dueDate,
      amount: new Decimal(newInvoiceData.amount),
      status: "PENDING",
      ClientGroupMembership: null,
      Appointment: null,
      Clinician: null,
      Payment: [],
    };

    prismaMock.invoice.create.mockResolvedValueOnce(createdInvoice);

    // Act
    const req = createRequestWithBody("/api/invoice", newInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json.id).toBe(createdInvoice.id);
    expect(json.invoice_number).toBe(createdInvoice.invoice_number);
    expect(json.amount.toString()).toBe(createdInvoice.amount.toString());
    expect(json.status).toBe(newInvoiceData.status);
    expect(json.clinician_id).toBe(newInvoiceData.clinician_id);
    expect(json.issued_date).toBe(createdInvoice.issued_date.toISOString());
    expect(json.due_date).toBe(createdInvoice.due_date.toISOString());

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clinician_id: newInvoiceData.clinician_id,
          amount: newInvoiceData.amount,
          status: newInvoiceData.status,
        }),
      }),
    );
  });

  it("POST /api/invoice should return 400 if required fields are missing", async () => {
    // Arrange
    const invalidInvoiceData = {
      // Missing required fields: clinician_id, amount, due_date
      client_group_membership_id: generateUUID(),
    };

    // Act
    const req = createRequestWithBody("/api/invoice", invalidInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error");
    expect(json.error).toContain("Missing required fields");
  });
});
