/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// Mock external dependencies first before importing anything else
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock getClinicianInfo properly
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  getBackOfficeSession: vi.fn(),
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const invoiceFindManyMock = vi.fn();
  const superbillFindManyMock = vi.fn();
  const statementFindManyMock = vi.fn();

  return {
    prisma: {
      invoice: {
        findMany: invoiceFindManyMock,
      },
      superbill: {
        findMany: superbillFindManyMock,
      },
      statement: {
        findMany: statementFindManyMock,
      },
    },
    Prisma: {
      Decimal: Decimal,
    },
    __esModule: true,
  };
});

// Import after mocks are defined
import { GET } from "@/api/billing-documents/route";
import { createRequest } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

// Define document interface for type safety
interface BillingDocument {
  id: string;
  documentType: string;
  date: string | Date;
  number: string;
  total: number;
  clientGroupName: string;
}

// Create mock data helper functions
const mockInvoice = (overrides = {}) => {
  const issuedDate = new Date("2023-01-15T12:00:00Z");
  return {
    id: "invoice-1",
    invoice_number: "INV-1234",
    client_group_id: "group-1",
    issued_date: issuedDate,
    amount: new Decimal(100),
    status: "PENDING",
    ClientGroup: {
      id: "group-1",
      name: "Test Group",
    },
    ...overrides,
  };
};

const mockSuperbill = (overrides = {}) => {
  const issuedDate = new Date("2023-01-20T12:00:00Z");
  return {
    id: "superbill-1",
    superbill_number: 5001,
    client_group_id: "group-1",
    issued_date: issuedDate,
    amount: new Decimal(150),
    status: "CREATED",
    ClientGroup: {
      id: "group-1",
      name: "Test Group",
    },
    ...overrides,
  };
};

const mockStatement = (overrides = {}) => {
  const createdAt = new Date("2023-01-25T12:00:00Z");
  return {
    id: "statement-1",
    statement_number: 2001,
    client_group_id: "group-1",
    created_at: createdAt,
    beginning_balance: new Decimal(250),
    invoices_total: new Decimal(100),
    payments_total: new Decimal(75),
    ending_balance: new Decimal(275),
    client_group_name: "Test Group",
    client_name: "John Doe",
    ClientGroup: {
      id: "group-1",
      name: "Test Group",
    },
    ...overrides,
  };
};

describe("Billing Documents API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock for getClinicianInfo in each test
    (getClinicianInfo as Mock).mockResolvedValue({
      clinicianId: "mocked-clinician-id",
      clinician: {
        id: "mocked-clinician-id",
        first_name: "Test",
        last_name: "Clinician",
      },
    });
  });

  it("GET /api/billing-documents should return all document types when no type specified", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];
    const mockStatements = [mockStatement()];

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );
    (prisma.superbill.findMany as unknown as Mock).mockResolvedValue(
      mockSuperbills,
    );
    (prisma.statement.findMany as unknown as Mock).mockResolvedValue(
      mockStatements,
    );

    // Act
    const req = createRequest("/api/billing-documents");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(3); // 1 of each type
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    });

    // Verify correct combined and sorted data
    expect(json.data[0].documentType).toBe("statement"); // Most recent date first
    expect(json.data[1].documentType).toBe("superbill");
    expect(json.data[2].documentType).toBe("invoice");

    // Verify correct document transformation
    expect(json.data[0].number).toBe("2001");
    expect(json.data[0].total).toBe(275);
    expect(json.data[0].clientGroupName).toBe("Test Group");
  });

  it("GET /api/billing-documents?clientGroupId=<id> should filter by client group", async () => {
    // Arrange
    const clientGroupId = "group-1";
    const mockInvoices = [mockInvoice({ client_group_id: clientGroupId })];
    const mockSuperbills = [mockSuperbill({ client_group_id: clientGroupId })];
    const mockStatements = [mockStatement({ client_group_id: clientGroupId })];

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );
    (prisma.superbill.findMany as unknown as Mock).mockResolvedValue(
      mockSuperbills,
    );
    (prisma.statement.findMany as unknown as Mock).mockResolvedValue(
      mockStatements,
    );

    // Act
    const req = createRequest(
      `/api/billing-documents?clientGroupId=${clientGroupId}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(3);

    // Verify all documents have the correct client group
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
    expect(prisma.superbill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
    expect(prisma.statement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
  });

  it("GET /api/billing-documents?type=[...] should filter by document types", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );
    (prisma.superbill.findMany as unknown as Mock).mockResolvedValue(
      mockSuperbills,
    );
    // Statement findMany shouldn't be called

    // Act - Request only invoices and superbills
    const req = createRequest(
      `/api/billing-documents?type=${encodeURIComponent(JSON.stringify(["invoice", "superbill"]))}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(2); // Only invoices and superbills
    expect(
      json.data.some((doc: BillingDocument) => doc.documentType === "invoice"),
    ).toBe(true);
    expect(
      json.data.some(
        (doc: BillingDocument) => doc.documentType === "superbill",
      ),
    ).toBe(true);
    expect(
      json.data.some(
        (doc: BillingDocument) => doc.documentType === "statement",
      ),
    ).toBe(false);

    // Verify statement findMany wasn't called
    expect(prisma.invoice.findMany).toHaveBeenCalled();
    expect(prisma.superbill.findMany).toHaveBeenCalled();
    expect(prisma.statement.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/billing-documents?type=invoice should filter by single document type", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );

    // Act - Request only invoices
    const req = createRequest(`/api/billing-documents?type=invoice`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(1); // Only invoices
    expect(json.data[0].documentType).toBe("invoice");

    // Verify only invoice findMany was called
    expect(prisma.invoice.findMany).toHaveBeenCalled();
    expect(prisma.superbill.findMany).not.toHaveBeenCalled();
    expect(prisma.statement.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/billing-documents with date range should filter by date", async () => {
    // Arrange
    const startDate = "2023-01-01";
    const endDate = "2023-01-31";
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];
    const mockStatements = [mockStatement()];

    (prisma.invoice.findMany as unknown as Mock).mockResolvedValue(
      mockInvoices,
    );
    (prisma.superbill.findMany as unknown as Mock).mockResolvedValue(
      mockSuperbills,
    );
    (prisma.statement.findMany as unknown as Mock).mockResolvedValue(
      mockStatements,
    );

    // Act
    const req = createRequest(
      `/api/billing-documents?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    // We're not checking json content in this test, just the API calls
    await response.json(); // Just to consume the response

    // Verify date filters were applied correctly
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issued_date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
    expect(prisma.superbill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issued_date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
    expect(prisma.statement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it("GET /api/billing-documents should handle errors gracefully", async () => {
    // Arrange
    (prisma.invoice.findMany as unknown as Mock).mockRejectedValue(
      new Error("Database error"),
    );

    // Act
    const req = createRequest("/api/billing-documents");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(500);
    const errorResponse = await response.json();

    expect(errorResponse).toHaveProperty(
      "error",
      "Failed to fetch billing documents",
    );
    expect(errorResponse).toHaveProperty("message", "Database error");
  });
});
