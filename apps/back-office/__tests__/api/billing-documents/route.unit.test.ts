/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { createRequest } from "@mcw/utils";
import prismaMock from "@mcw/database/mock";

// Mock getClinicianInfo properly
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  getBackOfficeSession: vi.fn(),
  __esModule: true,
}));

// Import after mocks are defined
import { GET } from "@/api/billing-documents/route";
import { getClinicianInfo } from "@/utils/helpers";
import {
  mockInvoice as dataInvoiceMock,
  mockSuperbill as dataSuperbillMock,
  mockStatement as dataStatementMock,
} from "@mcw/database/mock-data";

// Define document interface for type safety
interface BillingDocument {
  id: string;
  documentType: string;
  date: string | Date;
  number: string;
  is_exported: boolean;
  clientGroupName: string;
  clientGroupId: string;
}

// Add is_exported to each mock
const mockInvoice = (overrides = {}) => {
  const invoice = dataInvoiceMock(overrides);
  return {
    ...invoice,
    is_exported: false,
  };
};

const mockSuperbill = (overrides = {}) => {
  const superbill = dataSuperbillMock(overrides);
  return {
    ...superbill,
    is_exported: false,
  };
};

const mockStatement = (overrides = {}) => {
  const statement = dataStatementMock(overrides);
  return {
    ...statement,
    is_exported: false,
    issued_date: new Date(),
  };
};

// Helper to prepare mock data for the API response
const prepareMockDocuments = (
  invoices: ReturnType<typeof mockInvoice>[] = [],
  superbills: ReturnType<typeof mockSuperbill>[] = [],
  statements: ReturnType<typeof mockStatement>[] = [],
): BillingDocument[] => {
  const docs = [
    ...invoices.map((invoice) => ({
      id: invoice.id,
      documentType: "invoice",
      date: invoice.issued_date,
      number: invoice.invoice_number,
      is_exported: invoice.is_exported,
      clientGroupId: invoice.client_group_id,
      clientGroupName: (invoice as any).ClientGroup?.name || "",
    })),
    ...superbills.map((superbill) => ({
      id: superbill.id,
      documentType: "superbill",
      date: superbill.issued_date,
      number: superbill.superbill_number.toString(),
      is_exported: superbill.is_exported,
      clientGroupId: superbill.client_group_id,
      clientGroupName: (superbill as any).ClientGroup?.name || "",
    })),
    ...statements.map((statement) => ({
      id: statement.id,
      documentType: "statement",
      date: statement.created_at,
      number: statement.statement_number.toString(),
      is_exported: statement.is_exported,
      clientGroupId: statement.client_group_id,
      clientGroupName: statement.client_group_name || "",
    })),
  ];
  return docs;
};

describe("Billing Documents API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock $queryRawUnsafe which is used in the new implementation
    prismaMock.$queryRawUnsafe = vi.fn() as any;

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

    const mockDocuments = prepareMockDocuments(
      mockInvoices,
      mockSuperbills,
      mockStatements,
    );

    // Mock the count query to return total count
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { total: mockDocuments.length },
    ]);
    // Mock the main query to return the documents
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockDocuments);

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

    // Verify documents are present (without strict ordering)
    expect(
      json.data.map((doc: BillingDocument) => doc.documentType).sort(),
    ).toEqual(["invoice", "statement", "superbill"]);

    // Verify correct document transformation for one item
    const statementDoc = json.data.find(
      (doc: BillingDocument) => doc.documentType === "statement",
    );
    expect(statementDoc.number).toBe("2001");
    expect(statementDoc.is_exported).toBe(false);
    expect(statementDoc.clientGroupName).toBe("Test Group");
  });

  it("GET /api/billing-documents?clientGroupId=<id> should filter by client group", async () => {
    // Arrange
    const clientGroupId = "test-group-id";
    const mockInvoices = [mockInvoice({ client_group_id: clientGroupId })];
    const mockSuperbills = [mockSuperbill({ client_group_id: clientGroupId })];
    const mockStatements = [mockStatement({ client_group_id: clientGroupId })];

    const mockDocuments = prepareMockDocuments(
      mockInvoices,
      mockSuperbills,
      mockStatements,
    );

    // Mock the count query to return total count
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { total: mockDocuments.length },
    ]);
    // Mock the main query to return the documents
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockDocuments);

    // Act
    const req = createRequest(
      `/api/billing-documents?clientGroupId=${clientGroupId}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(3);

    // Verify clientGroupId is properly used in the query
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining(`clientGroupId = '${clientGroupId}'`),
    );

    // Verify all documents have the correct client group
    json.data.forEach((doc: BillingDocument) => {
      expect(doc.clientGroupId).toBe(clientGroupId);
    });
  });

  it("GET /api/billing-documents?type=[...] should filter by document types", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];

    const mockDocuments = prepareMockDocuments(
      mockInvoices,
      mockSuperbills,
      [],
    );

    // Mock the count query to return total count
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { total: mockDocuments.length },
    ]);
    // Mock the main query to return the documents
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockDocuments);

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

    // Verify type filter is applied in the query
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining(`documentType IN ('invoice', 'superbill')`),
    );
  });

  it("GET /api/billing-documents?type=invoice should filter by single document type", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];

    const mockDocuments = prepareMockDocuments(mockInvoices, [], []);

    // Mock the count query to return total count
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { total: mockDocuments.length },
    ]);
    // Mock the main query to return the documents
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockDocuments);

    // Act - Request only invoices
    const req = createRequest(`/api/billing-documents?type=invoice`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(1); // Only invoices
    expect(json.data[0].documentType).toBe("invoice");

    // Verify type filter is applied in the query
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining(`documentType IN ('invoice')`),
    );
  });

  it("GET /api/billing-documents with date range should filter by date", async () => {
    // Arrange
    const startDate = "2023-01-01";
    const endDate = "2023-01-31";
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];
    const mockStatements = [mockStatement()];

    const mockDocuments = prepareMockDocuments(
      mockInvoices,
      mockSuperbills,
      mockStatements,
    );

    // Mock the count query to return total count
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { total: mockDocuments.length },
    ]);
    // Mock the main query to return the documents
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockDocuments);

    // Act
    const req = createRequest(
      `/api/billing-documents?startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);

    // Verify date filters are applied in the query
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining(`date >= '`),
    );
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining(`date <= '`),
    );
  });

  it("GET /api/billing-documents should handle errors gracefully", async () => {
    // Arrange - Make the first queryRawUnsafe call throw an error
    prismaMock.$queryRawUnsafe.mockRejectedValueOnce(
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
