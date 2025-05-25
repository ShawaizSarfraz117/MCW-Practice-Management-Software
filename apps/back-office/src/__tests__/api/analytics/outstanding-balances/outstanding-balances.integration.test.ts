import { describe, it, expect, beforeEach, vi } from "vitest"; // Removed afterEach as it's not used in the current plan
import { prisma } from "@mcw/database";
// Import factories - paths might need adjustment based on actual export structure from @mcw/database/mock-data
// For now, assuming they are directly available. Actual test implementation in 2.18 will verify/adjust.
// import {
//   ClientGroupPrismaFactory,
//   ClientPrismaFactory,
//   InvoicePrismaFactory,
//   PaymentPrismaFactory
// } from '@mcw/database/mock-data';
import { GET } from "@/app/api/analytics/outstanding-balances/route";
import { createRequest } from "@mcw/utils";
import { Prisma } from "@prisma/client"; // For Prisma.Decimal

// Assuming these factories are available and correctly structured
// If not, this import path or factory names will need adjustment.
import {
  ClientGroupPrismaFactory,
  ClientPrismaFactory,
  InvoicePrismaFactory,
  PaymentPrismaFactory,
  ClientGroupMembershipPrismaFactory, // Added for linking client to group with billing responsibility
} from "@mcw/database/mock-data";

// Define the expected shape of items in jsonResponse.data for typing
interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string;
  responsibleClientFirstName?: string;
  responsibleClientLastName?: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
}

describe("GET /api/analytics/outstanding-balances Integration Tests", () => {
  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean relevant tables before each test to ensure isolation.
    // Order of deletion matters due to foreign key constraints.
    // These are common tables; actual dependencies might require more/different tables.
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    // Assuming Client has a relation to ClientGroup, and Invoice/Payment might relate to Client indirectly or directly.
    // If other tables like Service, ClinicianService, etc., are involved in creating invoice data, they'd need cleanup too.
    await prisma.client.deleteMany({});
    await prisma.clientGroup.deleteMany({});
  });

  it("should be a placeholder to confirm integration test setup", () => {
    expect(true).toBe(true);
  });

  it("should return 200 with correctly paginated data from DB for page 1, default pageSize", async () => {
    // Arrange: Seed Data
    // Group 1: Alpha - Outstanding Balance 80
    const groupAlpha = await ClientGroupPrismaFactory.create({
      name: "Alpha Outstanding Group",
    });
    const clientAlpha = await ClientPrismaFactory.create({
      legal_first_name: "Resp",
      legal_last_name: "Alpha",
    });
    await ClientGroupMembershipPrismaFactory.create({
      ClientGroup: { connect: { id: groupAlpha.id } },
      Client: { connect: { id: clientAlpha.id } },
      is_responsible_for_billing: true,
    });
    const invoiceAlphaData = {
      ClientGroup: { connect: { id: groupAlpha.id } },
      amount: new Prisma.Decimal("100.00"),
      created_at: new Date("2023-05-01T10:00:00Z"),
      due_date: new Date("2023-06-01T10:00:00Z"),
      status: "OPEN",
      invoice_number: "INV-ALPHA-001", // Assuming invoice_number is required
    };
    const invoiceAlpha = await InvoicePrismaFactory.create(invoiceAlphaData);
    await PaymentPrismaFactory.create({
      Invoice: { connect: { id: invoiceAlpha.id } },
      amount: new Prisma.Decimal("20.00"),
      payment_date: new Date("2023-05-10T10:00:00Z"),
      status: "COMPLETED",
    });

    // Group 2: Beta - Outstanding Balance 150
    const groupBeta = await ClientGroupPrismaFactory.create({
      name: "Beta Positive Balance",
    });
    const clientBeta = await ClientPrismaFactory.create({
      legal_first_name: "Responsible",
      legal_last_name: "Beta",
    });
    await ClientGroupMembershipPrismaFactory.create({
      ClientGroup: { connect: { id: groupBeta.id } },
      Client: { connect: { id: clientBeta.id } },
      is_responsible_for_billing: true,
    });
    const invoiceBetaData = {
      ClientGroup: { connect: { id: groupBeta.id } },
      amount: new Prisma.Decimal("150.00"),
      created_at: new Date("2023-05-02T10:00:00Z"),
      due_date: new Date("2023-06-02T10:00:00Z"),
      status: "OPEN",
      invoice_number: "INV-BETA-001",
    };
    await InvoicePrismaFactory.create(invoiceBetaData);

    // Group 3: Gamma - Zero Balance (should not appear)
    const groupGamma = await ClientGroupPrismaFactory.create({
      name: "Gamma Zero Balance",
    });
    const clientGamma = await ClientPrismaFactory.create({
      legal_first_name: "Account",
      legal_last_name: "Holder",
    });
    await ClientGroupMembershipPrismaFactory.create({
      ClientGroup: { connect: { id: groupGamma.id } },
      Client: { connect: { id: clientGamma.id } },
      is_responsible_for_billing: true,
    });
    const invoiceGammaData = {
      ClientGroup: { connect: { id: groupGamma.id } },
      amount: new Prisma.Decimal("50.00"),
      created_at: new Date("2023-05-03T10:00:00Z"),
      due_date: new Date("2023-06-03T10:00:00Z"),
      status: "OPEN",
      invoice_number: "INV-GAMMA-001",
    };
    const invoiceGamma = await InvoicePrismaFactory.create(invoiceGammaData);
    await PaymentPrismaFactory.create({
      Invoice: { connect: { id: invoiceGamma.id } },
      amount: new Prisma.Decimal("50.00"),
      payment_date: new Date("2023-05-12T10:00:00Z"),
      status: "COMPLETED",
    });

    const req = createRequest("/api/analytics/outstanding-balances"); // Defaults page=1, pageSize=10

    // Act
    const response = await GET(req);
    const jsonResponse = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(jsonResponse.data).toHaveLength(2); // Only Alpha and Beta groups

    // Data should be ordered by outstandingBalance DESC, then clientGroupName ASC.
    // Beta (150) then Alpha (80)
    const dataBeta = jsonResponse.data.find(
      (d: OutstandingBalanceItem) => d.clientGroupId === groupBeta.id,
    );
    const dataAlpha = jsonResponse.data.find(
      (d: OutstandingBalanceItem) => d.clientGroupId === groupAlpha.id,
    );

    expect(jsonResponse.data[0].clientGroupId).toBe(groupBeta.id);
    expect(jsonResponse.data[1].clientGroupId).toBe(groupAlpha.id);

    // Assert Beta Group Data
    expect(dataBeta).toBeDefined();
    if (dataBeta) {
      expect(dataBeta.clientGroupName).toBe("Beta Positive Balance");
      expect(dataBeta.responsibleClientFirstName).toBe("Responsible");
      expect(dataBeta.responsibleClientLastName).toBe("Beta");
      expect(dataBeta.totalBilled).toBeCloseTo(150.0, 2);
      expect(dataBeta.totalPaid).toBeCloseTo(0.0, 2);
      expect(dataBeta.outstandingBalance).toBeCloseTo(150.0, 2);
    }

    // Assert Alpha Group Data
    expect(dataAlpha).toBeDefined();
    if (dataAlpha) {
      expect(dataAlpha.clientGroupName).toBe("Alpha Outstanding Group");
      expect(dataAlpha.responsibleClientFirstName).toBe("Resp");
      expect(dataAlpha.responsibleClientLastName).toBe("Alpha");
      expect(dataAlpha.totalBilled).toBeCloseTo(100.0, 2);
      expect(dataAlpha.totalPaid).toBeCloseTo(20.0, 2);
      expect(dataAlpha.outstandingBalance).toBeCloseTo(80.0, 2);
    }

    expect(jsonResponse.pagination).toEqual({
      page: 1,
      limit: 10, // Default pageSize
      total: 2, // Total groups with outstanding balances
      totalPages: 1, // Math.ceil(2 / 10)
    });
  });

  // Actual integration test cases (e.g., seeding data and verifying API response)
  // will be added in subsequent subtasks like 2.18.
});
