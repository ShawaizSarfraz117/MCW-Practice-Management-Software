/* eslint-disable max-lines-per-function */
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
  total: number;
  clientGroupName: string;
}

// Using mock factories from @mcw/database/mock-data
const mockInvoice = (overrides = {}) => {
  const invoice = dataInvoiceMock(overrides);
  // Add missing properties required by the schema
  return {
    ...invoice,
    type: "STANDARD",
    client_info: null,
    provider_info: null,
    service_description: null,
    notes: null,
  };
};

const mockSuperbill = (overrides = {}) => {
  return dataSuperbillMock(overrides);
};

const mockStatement = (overrides = {}) => {
  return dataStatementMock(overrides);
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

    prismaMock.invoice.findMany.mockResolvedValue(mockInvoices);
    prismaMock.superbill.findMany.mockResolvedValue(mockSuperbills);
    prismaMock.statement.findMany.mockResolvedValue(mockStatements);

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
    expect(statementDoc.total).toBe(275);
    expect(statementDoc.clientGroupName).toBe("Test Group");
  });

  it("GET /api/billing-documents?clientGroupId=<id> should filter by client group", async () => {
    // Arrange
    const clientGroupId = "test-group-id";
    const mockInvoices = [mockInvoice({ client_group_id: clientGroupId })];
    const mockSuperbills = [mockSuperbill({ client_group_id: clientGroupId })];
    const mockStatements = [mockStatement({ client_group_id: clientGroupId })];

    prismaMock.invoice.findMany.mockResolvedValue(mockInvoices);
    prismaMock.superbill.findMany.mockResolvedValue(mockSuperbills);
    prismaMock.statement.findMany.mockResolvedValue(mockStatements);

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
    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
    expect(prismaMock.superbill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
    expect(prismaMock.statement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client_group_id: clientGroupId }),
      }),
    );
  });

  it("GET /api/billing-documents?type=[...] should filter by document types", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];

    prismaMock.invoice.findMany.mockResolvedValue(mockInvoices);
    prismaMock.superbill.findMany.mockResolvedValue(mockSuperbills);
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
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
    expect(prismaMock.superbill.findMany).toHaveBeenCalled();
    expect(prismaMock.statement.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/billing-documents?type=invoice should filter by single document type", async () => {
    // Arrange
    const mockInvoices = [mockInvoice()];

    prismaMock.invoice.findMany.mockResolvedValue(mockInvoices);

    // Act - Request only invoices
    const req = createRequest(`/api/billing-documents?type=invoice`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(1); // Only invoices
    expect(json.data[0].documentType).toBe("invoice");

    // Verify only invoice findMany was called
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
    expect(prismaMock.superbill.findMany).not.toHaveBeenCalled();
    expect(prismaMock.statement.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/billing-documents with date range should filter by date", async () => {
    // Arrange
    const startDate = "2023-01-01";
    const endDate = "2023-01-31";
    const mockInvoices = [mockInvoice()];
    const mockSuperbills = [mockSuperbill()];
    const mockStatements = [mockStatement()];

    prismaMock.invoice.findMany.mockResolvedValue(mockInvoices);
    prismaMock.superbill.findMany.mockResolvedValue(mockSuperbills);
    prismaMock.statement.findMany.mockResolvedValue(mockStatements);

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
    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issued_date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
    expect(prismaMock.superbill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issued_date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
    expect(prismaMock.statement.findMany).toHaveBeenCalledWith(
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
    prismaMock.invoice.findMany.mockRejectedValue(new Error("Database error"));

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
