/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET, POST } from "@/api/invoice/route";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";

// Set up mock values that won't be affected by hoisting
const MOCK_UUID = "mocked-uuid-123";

// Mock external dependencies
vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue(MOCK_UUID),
  __esModule: true,
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const findUniqueMock = vi.fn();
  const findManyMock = vi.fn();
  const createMock = vi.fn();
  const findFirstMock = vi.fn();
  const appointmentFindUniqueMock = vi.fn();
  const appointmentUpdateMock = vi.fn();
  const clientGroupUpdateMock = vi.fn();

  return {
    prisma: {
      invoice: {
        findUnique: findUniqueMock,
        findMany: findManyMock,
        create: createMock,
        findFirst: findFirstMock,
      },
      appointment: {
        findUnique: appointmentFindUniqueMock,
        update: appointmentUpdateMock,
      },
      clientGroup: {
        update: clientGroupUpdateMock,
      },
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";

// Create a mock invoice helper function
const mockInvoice = (overrides = {}) => {
  const issuedDate = new Date();
  const dueDate = new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    id: MOCK_UUID,
    invoice_number: "1234",
    client_group_id: MOCK_UUID,
    appointment_id: null,
    clinician_id: MOCK_UUID,
    issued_date: issuedDate,
    due_date: dueDate,
    amount: new Decimal(100),
    status: "PENDING",
    ClientGroup: null,
    Appointment: null,
    Clinician: null,
    Payment: [],
    ...overrides,
  };
};

// Helper functions
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

function createRequestWithBody(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Invoice API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/invoice should return all invoices", async () => {
    // Arrange
    const mockInvoices = [mockInvoice(), mockInvoice()];
    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );

    // Act
    const req = createRequest("/api/invoice");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveLength(2);
    expect(json[0].id).toBe(mockInvoices[0].id);
    expect(json[1].id).toBe(mockInvoices[1].id);

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        ClientGroup: true,
        Appointment: true,
        Payment: true,
      },
    });
  });

  it("GET /api/invoice should filter by clientGroupId and status", async () => {
    // Setup filter parameters
    const membershipId = "client-group-123";
    const status = "PENDING";

    // Setup expected query parameters
    const req = createRequest(
      `/api/invoice?clientGroupId=${membershipId}&status=${status}`,
    );

    // Arrange
    const invoice = mockInvoice({ client_group_id: membershipId });

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue([invoice]);

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(invoice.id);
    expect(json[0].issued_date).toBe(invoice.issued_date.toISOString());
    expect(json[0].due_date).toBe(invoice.due_date.toISOString());

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: {
        client_group_id: membershipId,
        status: "PENDING",
      },
      include: {
        ClientGroup: true,
        Appointment: true,
        Payment: true,
      },
    });
  });

  it("GET /api/invoice?id=<id> should return a specific invoice", async () => {
    // Arrange
    const invoiceId = MOCK_UUID;
    const invoice = mockInvoice({ id: invoiceId });

    (prisma.invoice.findUnique as unknown as Mock).mockResolvedValue(invoice);

    // Act
    const req = createRequest(`/api/invoice?id=${invoiceId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.id).toBe(invoice.id);
    expect(json.invoice_number).toBe(invoice.invoice_number);
    expect(json.status).toBe(invoice.status);
    expect(json.issued_date).toBe(invoice.issued_date.toISOString());
    expect(json.due_date).toBe(invoice.due_date.toISOString());

    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: invoiceId },
      include: {
        ClientGroup: {
          include: {
            ClientGroupMembership: {
              include: {
                Client: {
                  include: {
                    ClientContact: true,
                  },
                },
              },
            },
          },
        },
        Appointment: true,
        Clinician: {
          include: {
            User: true,
          },
        },
        Payment: true,
      },
    });
  });

  it("GET /api/invoice?id=<id> should return 404 if invoice not found", async () => {
    // Arrange
    const invoiceId = MOCK_UUID;

    (prisma.invoice.findUnique as unknown as Mock).mockResolvedValue(null);

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
    const clinicianId = MOCK_UUID;
    const membershipId = MOCK_UUID;
    const appointmentId = MOCK_UUID;
    const issuedDate = new Date();

    // Mock the appointment lookup
    const mockAppointment = {
      id: appointmentId,
      client_group_id: membershipId,
      clinician_id: clinicianId,
      appointment_fee: new Decimal(150),
      adjustable_amount: new Decimal(0),
      write_off: new Decimal(0),
    };
    (prisma.appointment.findUnique as unknown as Mock).mockResolvedValue(
      mockAppointment,
    );

    // Mock the findFirst to return the max invoice with numeric invoice number
    const maxInvoice = mockInvoice({ invoice_number: "999" });
    (prisma.invoice.findFirst as unknown as Mock).mockResolvedValue(maxInvoice);

    const newInvoiceData = {
      client_group_id: membershipId,
      appointment_id: appointmentId,
      amount: 150,
      status: "UNPAID",
      type: "INVOICE",
    };

    const createdInvoice = {
      id: MOCK_UUID,
      invoice_number: "1000",
      client_group_id: membershipId,
      appointment_id: appointmentId,
      clinician_id: clinicianId, // Now comes from appointment
      issued_date: issuedDate,
      due_date: issuedDate, // In the implementation, issued_date and due_date are set to new Date()
      amount: new Decimal(newInvoiceData.amount),
      status: "UNPAID",
      type: "INVOICE",
      ClientGroup: null,
      Appointment: null,
      Clinician: null,
      Payment: [],
    };

    (prisma.invoice.create as unknown as Mock).mockResolvedValue(
      createdInvoice,
    );

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
    expect(json.clinician_id).toBe(clinicianId); // clinician_id from appointment
    expect(json.issued_date).toBe(createdInvoice.issued_date.toISOString());
    expect(json.due_date).toBe(createdInvoice.due_date.toISOString());

    // Verify that appointment was looked up
    expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
      where: { id: appointmentId },
    });

    // Verify that findFirst was called to get the max invoice number
    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
      orderBy: { invoice_number: "desc" },
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        invoice_number: expect.any(String),
        amount: Number(newInvoiceData.amount),
        status: newInvoiceData.status,
        client_group_id: newInvoiceData.client_group_id,
        appointment_id: newInvoiceData.appointment_id,
        clinician_id: clinicianId, // Now from appointment
        type: newInvoiceData.type,
        issued_date: expect.any(Date),
        due_date: expect.any(Date),
      }),
    });
  });

  it("POST /api/invoice should create an adjustment invoice", async () => {
    // Arrange
    const clinicianId = MOCK_UUID;
    const membershipId = MOCK_UUID;
    const appointmentId = MOCK_UUID;
    const adjustableAmount = -50; // Credit adjustment

    // Mock the appointment lookup with adjustable amount
    const mockAppointment = {
      id: appointmentId,
      client_group_id: membershipId,
      clinician_id: clinicianId,
      appointment_fee: new Decimal(150),
      adjustable_amount: new Decimal(adjustableAmount),
      write_off: new Decimal(0),
    };
    (prisma.appointment.findUnique as unknown as Mock).mockResolvedValue(
      mockAppointment,
    );

    // Mock the findFirst to return the max invoice with numeric invoice number
    const maxInvoice = mockInvoice({ invoice_number: "999" });
    (prisma.invoice.findFirst as unknown as Mock).mockResolvedValue(maxInvoice);

    const adjustmentInvoiceData = {
      appointment_id: appointmentId,
      invoice_type: "adjustment",
    };

    const createdInvoice = {
      id: MOCK_UUID,
      invoice_number: "1000",
      client_group_id: membershipId,
      appointment_id: appointmentId,
      clinician_id: clinicianId,
      issued_date: new Date(),
      due_date: new Date(),
      amount: new Decimal(adjustableAmount),
      status: "CREDIT", // Because adjustableAmount is negative
      type: "ADJUSTMENT",
    };

    (prisma.invoice.create as unknown as Mock).mockResolvedValue(
      createdInvoice,
    );
    (prisma.appointment.update as unknown as Mock).mockResolvedValue({});
    (prisma.clientGroup.update as unknown as Mock).mockResolvedValue({});

    // Act
    const req = createRequestWithBody("/api/invoice", adjustmentInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json.id).toBe(createdInvoice.id);
    expect(json.invoice_number).toBe(createdInvoice.invoice_number);
    expect(json.type).toBe("ADJUSTMENT");
    expect(json.status).toBe("CREDIT");

    // Verify appointment update to reset adjustable amount
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: appointmentId },
      data: { adjustable_amount: 0 },
    });

    // Verify client group credit update (since adjustableAmount was negative)
    expect(prisma.clientGroup.update).toHaveBeenCalledWith({
      where: { id: membershipId },
      data: {
        available_credit: {
          increment: Math.abs(adjustableAmount),
        },
      },
    });
  });

  it("POST /api/invoice should return 404 if appointment not found", async () => {
    // Arrange
    const appointmentId = MOCK_UUID;

    // Mock appointment not found
    (prisma.appointment.findUnique as unknown as Mock).mockResolvedValue(null);

    const invoiceData = {
      client_group_id: MOCK_UUID,
      appointment_id: appointmentId,
      amount: 150,
      status: "UNPAID",
      type: "INVOICE",
    };

    // Act
    const req = createRequestWithBody("/api/invoice", invoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Appointment not found");
  });

  it("POST /api/invoice should return 404 if appointment_id is missing", async () => {
    // Arrange
    const invalidInvoiceData = {
      // Missing appointment_id
      client_group_id: MOCK_UUID,
      amount: 150,
    };

    // Mock appointment lookup with undefined/null appointment_id
    (prisma.appointment.findUnique as unknown as Mock).mockResolvedValue(null);

    // Act
    const req = createRequestWithBody("/api/invoice", invalidInvoiceData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Appointment not found");
  });
});
