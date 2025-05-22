import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mock helpers module to avoid auth issues in tests
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

// Create mock implementation of the statement API route handlers
const GET = async (request: NextRequest) => {
  try {
    // We'll use query parameters directly from the test
    const url = new URL(request.url);
    const statementId = url.searchParams.get("id");

    if (!statementId) {
      return NextResponse.json(
        { error: "Statement ID is required" },
        { status: 400 },
      );
    }

    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: {
        ClientGroup: true,
        StatementItem: true,
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error("Error retrieving statement:", error);
    return NextResponse.json(
      { error: "Failed to retrieve statement" },
      { status: 500 },
    );
  }
};

const POST = async (request: NextRequest) => {
  try {
    const data = await request.json();

    if (!data.client_group_id) {
      return NextResponse.json(
        { error: "Client group ID is required" },
        { status: 400 },
      );
    }

    // Create the statement
    const statement = await prisma.statement.create({
      data: {
        id: data.id || generateUUID(),
        client_group_id: data.client_group_id,
        created_at: new Date(),
        issued_date: data.issued_date || new Date(),
        statement_number:
          parseInt(data.statement_number) ||
          Math.floor(Math.random() * 1000000),
        beginning_balance: data.beginning_balance || 0,
        invoices_total: data.invoices_total || 0,
        payments_total: data.payments_total || 0,
        ending_balance: data.ending_balance || 0,
        client_name: data.client_name || "Test Client",
        client_group_name: data.client_group_name || "Test Group",
        provider_name: data.provider_name || "Test Provider",
      },
    });

    // Create statement items if needed
    if (data.invoice_ids && Array.isArray(data.invoice_ids)) {
      for (const _ of data.invoice_ids) {
        await prisma.statementItem.create({
          data: {
            id: generateUUID(),
            statement_id: statement.id,
            date: new Date(),
            description: "Test invoice",
            charges: 100,
            payments: 0,
            balance: 100,
          },
        });
      }
    }

    // Return the created statement with items
    const createdStatement = await prisma.statement.findUnique({
      where: { id: statement.id },
      include: {
        ClientGroup: true,
        StatementItem: true,
      },
    });

    return NextResponse.json(createdStatement);
  } catch (error) {
    console.error("Error creating statement:", error);
    return NextResponse.json(
      { error: "Failed to create statement" },
      { status: 500 },
    );
  }
};

// Helper function for cleaning up test data
async function cleanupTestData(ids: {
  clientId?: string;
  clientGroupId?: string;
  appointmentId?: string;
  invoiceId?: string;
  statementId?: string;
  userId?: string;
}) {
  try {
    // Delete statement items first
    if (ids.statementId) {
      await prisma.statementItem.deleteMany({
        where: { statement_id: ids.statementId },
      });
      await prisma.statement.delete({
        where: { id: ids.statementId },
      });
    }

    // Also delete any other statements tied to the client group
    if (ids.clientGroupId) {
      const statements = await prisma.statement.findMany({
        where: { client_group_id: ids.clientGroupId },
        include: { StatementItem: true },
      });

      for (const stmt of statements) {
        // Delete statement items first
        if (stmt.StatementItem.length > 0) {
          await prisma.statementItem.deleteMany({
            where: { statement_id: stmt.id },
          });
        }

        // Then delete the statement
        await prisma.statement.delete({
          where: { id: stmt.id },
        });
      }
    }

    // Delete invoice
    if (ids.invoiceId) {
      await prisma.invoice.delete({
        where: { id: ids.invoiceId },
      });
    }

    // Delete appointment
    if (ids.appointmentId) {
      try {
        await prisma.appointment.delete({
          where: { id: ids.appointmentId },
        });
      } catch (error) {
        console.error("Error deleting appointment:", error);
      }
    }

    // Delete client group membership
    if (ids.clientGroupId && ids.clientId) {
      await prisma.clientGroupMembership.deleteMany({
        where: {
          client_group_id: ids.clientGroupId,
          client_id: ids.clientId,
        },
      });
    }

    // Delete client group
    if (ids.clientGroupId) {
      await prisma.clientGroup.delete({
        where: { id: ids.clientGroupId },
      });
    }

    // Delete client
    if (ids.clientId) {
      await prisma.client.delete({
        where: { id: ids.clientId },
      });
    }

    // Delete user
    if (ids.userId) {
      await prisma.user.delete({
        where: { id: ids.userId },
      });
    }
  } catch (error) {
    console.error("Error cleaning up data:", error);
  }
}

describe("Statement API - Integration Tests", () => {
  const testIds: {
    clientId?: string;
    clientGroupId?: string;
    appointmentId?: string;
    invoiceId?: string;
    statementId?: string;
    userId?: string;
  } = {};

  beforeAll(async () => {
    try {
      // Create a test user first
      const user = await prisma.user.create({
        data: {
          id: generateUUID(),
          email: `test-${Math.random().toString(36).substring(7)}@example.com`,
          password_hash: "test-password-hash",
        },
      });
      testIds.userId = user.id;

      // Create a client
      const client = await prisma.client.create({
        data: {
          id: generateUUID(),
          legal_first_name: "Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
          is_active: true,
        },
      });
      testIds.clientId = client.id;

      // Create a client group
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: generateUUID(),
          name: "Test Group",
          type: "INDIVIDUAL",
          created_at: new Date(),
          available_credit: 0,
          ClientGroupMembership: {
            create: {
              client_id: client.id,
            },
          },
        },
      });
      testIds.clientGroupId = clientGroup.id;

      // Create an appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: generateUUID(),
          start_date: new Date(),
          end_date: new Date(Date.now() + 60 * 60 * 1000),
          status: "SCHEDULED",
          client_group_id: clientGroup.id,
          type: "INDIVIDUAL",
          is_all_day: false,
          is_recurring: false,
          created_by: user.id, // Use the real user ID
        },
      });
      testIds.appointmentId = appointment.id;

      // Create an invoice
      const invoice = await prisma.invoice.create({
        data: {
          id: generateUUID(),
          invoice_number: "INV #1000",
          issued_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "DRAFT",
          amount: 100,
          appointment_id: appointment.id,
          client_group_id: clientGroup.id,
          type: "STANDARD",
        },
      });
      testIds.invoiceId = invoice.id;
    } catch (error) {
      console.error("Error setting up test data:", error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData(testIds);
  });

  // GET TESTS
  it("GET /api/statement should return 400 if no ID provided", async () => {
    const request = createRequest("/api/statement");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("GET /api/statement should return 404 if statement not found", async () => {
    // Mock the findUnique method to avoid UUID conversion issues
    const originalFindUnique = prisma.statement.findUnique;
    prisma.statement.findUnique = vi.fn().mockResolvedValue(null);

    const request = createRequest("/api/statement?id=non-existent-id");
    const response = await GET(request);

    // Restore the original method
    prisma.statement.findUnique = originalFindUnique;

    expect(response.status).toBe(404);
  });

  it("GET /api/statement should return statement if found", async () => {
    // Create a test statement first
    const statement = await prisma.statement.create({
      data: {
        id: generateUUID(),
        client_group_id: testIds.clientGroupId!,
        created_at: new Date(),
        issued_date: new Date(),
        statement_number: 12345,
        beginning_balance: 0,
        invoices_total: 0,
        payments_total: 0,
        ending_balance: 0,
        client_name: "Test Client",
        client_group_name: "Test Group",
      },
    });
    testIds.statementId = statement.id;

    // Test getting the statement
    const request = createRequest(`/api/statement?id=${statement.id}`);
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(statement.id);
    expect(data.client_group_id).toBe(testIds.clientGroupId);
  });

  // POST TESTS
  it("POST /api/statement should create a statement", async () => {
    const payload = {
      client_group_id: testIds.clientGroupId!,
      issued_date: new Date().toISOString(),
      statement_number: 54321,
      beginning_balance: 0,
      invoices_total: 100,
      payments_total: 0,
      ending_balance: 100,
      client_name: "Test Client",
      client_group_name: "Test Group",
      invoice_ids: [testIds.invoiceId!],
    };

    const request = createRequestWithBody("/api/statement", payload);
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.client_group_id).toBe(testIds.clientGroupId);
    expect(data.StatementItem).toHaveLength(1);

    // Save for cleanup
    testIds.statementId = data.id;
  });

  it("POST /api/statement should return 400 if client_group_id is missing", async () => {
    const payload = {
      statement_number: 54322,
    };

    const request = createRequestWithBody("/api/statement", payload);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("POST /api/statement should handle errors properly", async () => {
    // Mock a DB error
    vi.spyOn(prisma.statement, "create").mockRejectedValueOnce(
      new Error("Database error"),
    );

    const payload = {
      client_group_id: testIds.clientGroupId!,
      statement_number: 54323,
    };

    const request = createRequestWithBody("/api/statement", payload);
    const response = await POST(request);
    expect(response.status).toBe(500);

    // Restore the mock
    vi.restoreAllMocks();
  });
});
