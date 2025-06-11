/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";

// Mock NextRequest and NextResponse
class MockNextURL {
  constructor(public url: string) {}

  get searchParams() {
    const urlObj = new URL(this.url);
    return urlObj.searchParams;
  }
}

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

vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue("mock-uuid"),
  createRequest: vi.fn(),
  createRequestWithBody: vi.fn(),
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const statementFindUniqueMock = vi.fn();
  const statementFindManyMock = vi.fn();
  const statementCountMock = vi.fn();
  const statementCreateMock = vi.fn();
  const statementFindFirstMock = vi.fn();
  const clientGroupFindUniqueMock = vi.fn();
  const appointmentFindFirstMock = vi.fn();
  const invoiceFindManyMock = vi.fn();
  const paymentFindManyMock = vi.fn();
  const statementItemFindManyMock = vi.fn();
  const statementItemCreateMock = vi.fn();

  return {
    prisma: {
      statement: {
        findUnique: statementFindUniqueMock,
        findMany: statementFindManyMock,
        count: statementCountMock,
        create: statementCreateMock,
        findFirst: statementFindFirstMock,
      },
      clientGroup: {
        findUnique: clientGroupFindUniqueMock,
      },
      appointment: {
        findFirst: appointmentFindFirstMock,
      },
      invoice: {
        findMany: invoiceFindManyMock,
      },
      payment: {
        findMany: paymentFindManyMock,
      },
      statementItem: {
        findMany: statementItemFindManyMock,
        create: statementItemCreateMock,
      },
    },
    Prisma: {
      Decimal,
    },
    __esModule: true,
  };
});

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, options = {}) => {
      return {
        status: options.status || 200,
        json: async () => data,
      };
    }),
  },
  NextRequest: vi.fn(),
}));

// Import after mocks are defined
import { GET, POST } from "@/api/statement/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo, getBackOfficeSession } from "@/utils/helpers";

// Define helper functions here instead of importing from @mcw/utils since they're mocked
function createRequest(url: string, options = {}): NextRequest {
  const mockReq = {
    nextUrl: new MockNextURL(`http://localhost${url}`),
    ...options,
  } as unknown as NextRequest;
  return mockReq;
}

function createRequestWithBody(
  url: string,
  body: unknown,
  options = {},
): NextRequest {
  const mockReq = {
    nextUrl: new MockNextURL(`http://localhost${url}`),
    json: async () => body,
    method: "POST",
    headers: {
      get: () => "application/json",
    },
    ...options,
  } as unknown as NextRequest;
  return mockReq;
}

// Helper function to create mock statement data
const mockStatement = (overrides = {}) => {
  return {
    id: "statement-1",
    statement_number: 1001,
    client_group_id: "group-1",
    start_date: new Date("2023-01-01"),
    end_date: new Date("2023-01-31"),
    beginning_balance: new Decimal(200),
    invoices_total: new Decimal(150),
    payments_total: new Decimal(50),
    ending_balance: new Decimal(300),
    provider_name: "Test Provider",
    provider_email: "provider@example.com",
    client_group_name: "Test Group",
    client_name: "Test Client",
    client_email: "client@example.com",
    created_at: new Date("2023-02-01"),
    created_by: "clinician-1",
    ...overrides,
  };
};

// Helper function to create mock statement item data
const mockStatementItem = (overrides = {}) => {
  return {
    id: "statement-item-1",
    statement_id: "statement-1",
    date: new Date("2023-01-15"),
    description: "INV #123\n01/15/2023 Professional Services",
    charges: 150,
    payments: 0,
    balance: 150,
    ...overrides,
  };
};

// Helper function to create mock client group data
const mockClientGroup = (overrides = {}) => {
  return {
    id: "group-1",
    name: "Test Group",
    administrative_notes: null,
    created_at: new Date("2023-01-01"),
    ClientGroupMembership: [
      {
        Client: {
          legal_first_name: "Test",
          legal_last_name: "Client",
          ClientContact: [
            {
              value: "client@example.com",
            },
          ],
        },
      },
    ],
    ...overrides,
  };
};

describe("Statement API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock for getClinicianInfo and getBackOfficeSession in each test
    (getClinicianInfo as Mock).mockResolvedValue({
      clinicianId: "clinician-1",
      clinician: {
        id: "clinician-1",
        first_name: "Test",
        last_name: "Provider",
      },
    });

    (getBackOfficeSession as Mock).mockResolvedValue({
      user: {
        id: "user-1",
        email: "provider@example.com",
      },
    });
  });

  describe("GET /api/statement", () => {
    it("should get a statement by ID with details", async () => {
      // Arrange
      const statementId = "statement-1";
      const mockStatementData = mockStatement({ id: statementId });
      const mockStatementItems = [
        mockStatementItem({
          id: "statement-item-1",
          statement_id: statementId,
          description: "INV #54\n01/15/2023 Therapy Session",
          charges: 150,
          payments: 0,
          balance: 150,
        }),
        mockStatementItem({
          id: "statement-item-2",
          statement_id: statementId,
          description: "Credit Card Payment",
          charges: 0,
          payments: 50,
          balance: 100,
        }),
      ];

      (prisma.statement.findUnique as Mock).mockResolvedValue(
        mockStatementData,
      );
      (prisma.statementItem.findMany as Mock).mockResolvedValue(
        mockStatementItems,
      );

      // Act
      const req = createRequest(`/api/statement?id=${statementId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toHaveProperty("summary");
      expect(json).toHaveProperty("details");
      expect(json).toHaveProperty("statement");
      expect(json.summary.beginningBalance).toBe(
        Number(mockStatementData.beginning_balance),
      );
      expect(json.summary.invoicesTotal).toBe(
        Number(mockStatementData.invoices_total),
      );
      expect(json.summary.paymentsTotal).toBe(
        Number(mockStatementData.payments_total),
      );
      expect(json.summary.endingBalance).toBe(
        Number(mockStatementData.ending_balance),
      );

      // Verify correct functions were called
      expect(prisma.statement.findUnique).toHaveBeenCalledWith({
        where: { id: statementId },
      });
      expect(prisma.statementItem.findMany).toHaveBeenCalledWith({
        where: { statement_id: statementId },
        orderBy: { date: "asc" },
      });

      // Verify details format
      expect(json.details).toHaveLength(2);
      expect(json.details[0].description).toBe("INV #54");
      expect(json.details[0].serviceDescription).toBe(
        "01/15/2023 Therapy Session",
      );
      expect(json.details[0].charges).toBe("150.00");
      expect(json.details[0].payments).toBe("--");
      expect(json.details[1].description).toBe("Credit Card Payment");
      expect(json.details[1].serviceDescription).toBe("");
      expect(json.details[1].charges).toBe("--");
      expect(json.details[1].payments).toBe("50.00");
    });

    it("should return 404 when statement ID not found", async () => {
      // Arrange
      const statementId = "non-existent-id";
      (prisma.statement.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequest(`/api/statement?id=${statementId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Statement not found");
    });

    it("should get statements for a client group", async () => {
      // Arrange
      const clientGroupId = "group-1";
      const mockStatements = [
        mockStatement({ client_group_id: clientGroupId, id: "statement-1" }),
        mockStatement({ client_group_id: clientGroupId, id: "statement-2" }),
      ];

      (prisma.statement.findMany as Mock).mockResolvedValue(mockStatements);

      // Act
      const req = createRequest(
        `/api/statement?clientGroupId=${clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(2);
      expect(json[0].client_group_id).toBe(clientGroupId);
      expect(json[1].client_group_id).toBe(clientGroupId);

      // Verify correct functions were called
      expect(prisma.statement.findMany).toHaveBeenCalledWith({
        where: { client_group_id: clientGroupId },
        orderBy: { created_at: "desc" },
      });
    });

    it("should get all statements with pagination", async () => {
      // Arrange
      const mockStatements = [
        mockStatement({ id: "statement-1" }),
        mockStatement({ id: "statement-2" }),
      ];

      (prisma.statement.findMany as Mock).mockResolvedValue(mockStatements);
      (prisma.statement.count as Mock).mockResolvedValue(2);

      // Act
      const req = createRequest(`/api/statement?page=1&limit=10`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("pagination");
      expect(json.data).toHaveLength(2);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });

      // Verify correct functions were called
      expect(prisma.statement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: "desc" },
          skip: 0,
          take: 10,
          include: {
            ClientGroup: true,
          },
        }),
      );
      expect(prisma.statement.count).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const errorMessage =
        "Cannot read properties of undefined (reading 'nextUrl')";
      (prisma.statement.findMany as Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      // Act
      const req = createRequest(`/api/statement`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to fetch statements");
      expect(json).toHaveProperty("message", errorMessage);
    });
  });

  describe("POST /api/statement", () => {
    it("should handle errors gracefully", async () => {
      // Arrange
      const requestData = {
        client_group_id: "group-1",
        start_date: "2023-01-01",
        end_date: "2023-01-31",
      };

      const errorMessage =
        "Cannot read properties of undefined (reading 'json')";
      (prisma.appointment.findFirst as Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to create statement");
      expect(json).toHaveProperty("message", errorMessage);
    });

    it("should create a new statement successfully", async () => {
      // Arrange
      const requestData = {
        client_group_id: "group-1",
        start_date: "2023-01-01",
        end_date: "2023-01-31",
      };

      const mockAppointment = {
        id: "appointment-1",
        client_group_id: "group-1",
        Invoice: [{ id: "invoice-1" }],
        PracticeService: {
          id: "service-1",
          description: "Therapy Session",
        },
      };

      const mockClientGroupData = mockClientGroup();
      const createdStatement = mockStatement();

      (prisma.appointment.findFirst as Mock).mockResolvedValue(mockAppointment);
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue(
        mockClientGroupData,
      );

      // Mock statement findFirst for getting max statement number
      (prisma.statement.findFirst as Mock).mockResolvedValue({
        statement_number: 1000,
      });

      // Mock all invoice.findMany calls
      (prisma.invoice.findMany as Mock).mockResolvedValue([]);

      // Mock all payment.findMany calls
      (prisma.payment.findMany as Mock).mockResolvedValue([]);

      // Mock statement create
      (prisma.statement.create as Mock).mockResolvedValue(createdStatement);

      // Mock statementItem create
      (prisma.statementItem.create as Mock).mockResolvedValue({});

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      if (response.status !== 201) {
        const errorJson = await response.json();
        console.error("Create statement error response:", errorJson);
      }
      expect(response.status).toBe(201);
      const json = await response.json();

      // Check basic properties of the created statement
      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("statement_number");
      expect(json).toHaveProperty(
        "client_group_id",
        requestData.client_group_id,
      );

      // Verify that key functions were called
      expect(prisma.appointment.findFirst).toHaveBeenCalled();
      expect(prisma.clientGroup.findUnique).toHaveBeenCalled();
      expect(prisma.statement.create).toHaveBeenCalled();
    });

    it("should return 400 when required parameters are missing", async () => {
      // Arrange
      const incompleteData = {
        // Missing client_group_id
      };

      // Act
      const req = createRequestWithBody(`/api/statement`, incompleteData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Missing required parameters: client_group_id",
      );
    });

    it("should use default dates when start_date and end_date are not provided", async () => {
      // Arrange
      const requestData = {
        client_group_id: "group-1",
        // No start_date or end_date provided
      };

      const mockAppointment = {
        id: "appointment-1",
        client_group_id: "group-1",
        Invoice: [{ id: "invoice-1" }],
        PracticeService: {
          id: "service-1",
          description: "Therapy Session",
        },
      };

      const mockClientGroupData = mockClientGroup({
        created_at: new Date("2023-01-01"),
      });
      const createdStatement = mockStatement();

      (prisma.appointment.findFirst as Mock).mockResolvedValue(mockAppointment);
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue(
        mockClientGroupData,
      );

      // Mock statement findFirst for getting max statement number
      (prisma.statement.findFirst as Mock).mockResolvedValue({
        statement_number: 1000,
      });

      // Mock all invoice.findMany calls
      (prisma.invoice.findMany as Mock).mockResolvedValue([]);

      // Mock all payment.findMany calls
      (prisma.payment.findMany as Mock).mockResolvedValue([]);

      // Mock statement create
      (prisma.statement.create as Mock).mockResolvedValue(createdStatement);

      // Mock statementItem create
      (prisma.statementItem.create as Mock).mockResolvedValue({});

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      if (response.status !== 201) {
        const errorJson = await response.json();
        console.error("Default dates error response:", errorJson);
      }
      expect(response.status).toBe(201);

      // Verify that statement.create was called with dates from clientGroup.created_at and current date
      expect(prisma.statement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            start_date: mockClientGroupData.created_at,
            end_date: expect.any(Date),
          }),
        }),
      );
    });

    it("should return 400 when no appointment with invoice is found", async () => {
      // Arrange
      const requestData = {
        client_group_id: "group-1",
        start_date: "2023-01-01",
        end_date: "2023-01-31",
      };

      // Return null for appointment.findFirst
      (prisma.appointment.findFirst as Mock).mockResolvedValue(null);

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "No appointment or invoice found for the client group",
      );
    });

    it("should return 400 when date format is invalid", async () => {
      // Arrange
      const requestData = {
        client_group_id: "group-1",
        start_date: "invalid-date",
        end_date: "2023-01-31",
      };

      const mockAppointment = {
        id: "appointment-1",
        client_group_id: "group-1",
        Invoice: [{ id: "invoice-1" }],
      };

      const mockClientGroupData = mockClientGroup();

      (prisma.appointment.findFirst as Mock).mockResolvedValue(mockAppointment);
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue(
        mockClientGroupData,
      );

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid date format");
    });

    it("should return 404 when client group is not found", async () => {
      // Arrange
      const requestData = {
        client_group_id: "non-existent-group",
        start_date: "2023-01-01",
        end_date: "2023-01-31",
      };

      const mockAppointment = {
        id: "appointment-1",
        client_group_id: "non-existent-group",
        Invoice: [{ id: "invoice-1" }],
      };

      (prisma.appointment.findFirst as Mock).mockResolvedValue(mockAppointment);
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequestWithBody(`/api/statement`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Client group not found");
    });
  });
});
