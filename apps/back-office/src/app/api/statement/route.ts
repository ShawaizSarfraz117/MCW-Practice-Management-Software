/* eslint-disable max-lines */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo, getBackOfficeSession } from "@/utils/helpers";
import { logger } from "@mcw/logger";
import { generateUUID } from "@mcw/utils";

// Type for statement detail item
interface StatementDetailItem {
  id: string;
  date: Date;
  type: string;
  description: string;
  serviceDescription: string;
  amount: number;
  isCredit: boolean;
  balance?: number; // Optional balance property that gets added later
}

// GET - Retrieve a statement by ID or statements for a client group
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clientGroupId = searchParams.get("clientGroupId");

    if (id) {
      // Get a specific statement by ID
      const statement = await prisma.statement.findUnique({
        where: { id },
      });

      if (!statement) {
        return NextResponse.json(
          { error: "Statement not found" },
          { status: 404 },
        );
      }

      // Get the statement items from the database
      const statementItems = await prisma.statementItem.findMany({
        where: { statement_id: id },
        orderBy: { date: "asc" },
      });

      // Format the response to match the desired structure
      return NextResponse.json({
        summary: {
          beginningBalance: Number(statement.beginning_balance),
          beginningDate: statement.start_date,
          invoicesTotal: Number(statement.invoices_total),
          paymentsTotal: Number(statement.payments_total),
          endingBalance: Number(statement.ending_balance),
          endingDate: statement.end_date,
        },
        details: statementItems.map((item) => {
          // Split description into main description and service description if it contains a newline
          const descriptionParts = item.description.split("\n");
          const mainDescription = descriptionParts[0];
          const serviceDescription =
            descriptionParts.length > 1 ? descriptionParts[1] : "";

          return {
            date: item.date,
            description: mainDescription,
            serviceDescription: serviceDescription,
            charges: item.charges > 0 ? `${item.charges.toFixed(2)}` : "--",
            payments: item.payments > 0 ? `${item.payments.toFixed(2)}` : "--",
            balance: item.balance.toFixed(2),
          };
        }),
        statement: statement,
      });
    } else if (clientGroupId) {
      // Get all statements for a client group
      const statements = await prisma.statement.findMany({
        where: { client_group_id: clientGroupId },
        orderBy: { created_at: "desc" },
      });

      return NextResponse.json(statements);
    } else {
      // Get all statements (with possible pagination)
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const skip = (page - 1) * limit;

      const statements = await prisma.statement.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          ClientGroup: true,
        },
      });

      const totalStatements = await prisma.statement.count();

      return NextResponse.json({
        data: statements,
        pagination: {
          page,
          limit,
          total: totalStatements,
          totalPages: Math.ceil(totalStatements / limit),
        },
      });
    }
  } catch (error) {
    logger.error({
      message: "Error fetching statements",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to fetch statements",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Generate a new statement
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { client_group_id } = data;
    let { start_date, end_date } = data;

    // Validate required parameters
    if (!client_group_id) {
      return NextResponse.json(
        {
          error: "Missing required parameters: client_group_id",
        },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        client_group_id: client_group_id,
        Invoice: {
          some: {},
        },
      },
      include: {
        Invoice: true,
        PracticeService: {
          select: {
            id: true,
            description: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "No appointment or invoice found for the client group" },
        { status: 400 },
      );
    }

    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: client_group_id },
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
    });
    if (!clientGroup) {
      return NextResponse.json(
        { error: "Client group not found" },
        { status: 404 },
      );
    }

    if (!start_date || !end_date) {
      start_date = clientGroup.created_at;
      end_date = new Date();
    }

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Check if client group exists

    // Get current user info
    const { clinicianId, clinician } = await getClinicianInfo();
    const session = await getBackOfficeSession();

    // Calculate statement values
    const statementData = await calculateStatementData(
      client_group_id,
      startDate,
      endDate,
    );

    // Get the current max statement number
    const maxStatement = await prisma.statement.findFirst({
      orderBy: { statement_number: "desc" },
    });
    const nextStatementNumber = maxStatement
      ? maxStatement.statement_number + 1
      : 1;

    // Create the statement using Prisma's create method
    const createdStatement = await prisma.statement.create({
      data: {
        statement_number: nextStatementNumber,
        client_group_id,
        start_date: startDate,
        end_date: endDate,
        beginning_balance: statementData.beginningBalance,
        invoices_total: statementData.invoicesTotal,
        payments_total: statementData.paymentsTotal,
        ending_balance: statementData.endingBalance,
        provider_name: clinician
          ? `${clinician?.first_name} ${clinician?.last_name}`
          : null,
        provider_email: session?.user?.email || null,
        client_group_name: clientGroup.name,
        client_name:
          clientGroup.ClientGroupMembership[0].Client.legal_first_name +
          " " +
          clientGroup.ClientGroupMembership[0].Client.legal_last_name,
        client_email:
          clientGroup.ClientGroupMembership[0].Client.ClientContact[0]?.value ||
          null,
        created_by: clinicianId || null,
      },
    });

    // Get the details for this statement (invoice and payment data)
    const details = await getStatementDetails(
      client_group_id,
      startDate,
      endDate,
    );

    // Store the statement items in the database
    const statementItems = await Promise.all(
      details.map(async (item) => {
        return prisma.statementItem.create({
          data: {
            id: generateUUID(), // Generate UUID for the statement item
            statement_id: createdStatement.id,
            date: item.date,
            description:
              item.type === "invoice"
                ? `${item.description}\n${item.serviceDescription}` // Format: "INV #XX\nMM/DD/YYYY Service Description"
                : item.description || "Payment",
            charges: item.isCredit ? 0 : item.amount,
            payments: item.isCredit ? item.amount : 0,
            balance: item.balance || 0,
          },
        });
      }),
    );

    return NextResponse.json(
      {
        ...createdStatement,
        details: statementItems.map((item) => {
          // Split description into main description and service description if it contains a newline
          const descriptionParts = item.description.split("\n");
          const mainDescription = descriptionParts[0];
          const serviceDescription =
            descriptionParts.length > 1 ? descriptionParts[1] : "";

          return {
            date: item.date,
            description: mainDescription,
            serviceDescription: serviceDescription,
            charges: item.charges > 0 ? `${item.charges.toFixed(2)}` : "--",
            payments: item.payments > 0 ? `${item.payments.toFixed(2)}` : "--",
            balance: item.balance.toFixed(2),
          };
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({
      message: "Error creating statement",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to create statement",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper function to calculate statement data
async function calculateStatementData(
  clientGroupId: string,
  startDate: Date,
  endDate: Date,
) {
  // Calculate beginning balance (total of all invoices minus payments before start date)
  const previousInvoices = await prisma.invoice.findMany({
    where: {
      client_group_id: clientGroupId,
      issued_date: {
        lt: startDate,
      },
    },
  });

  const previousPayments = await prisma.payment.findMany({
    where: {
      Invoice: {
        client_group_id: clientGroupId,
      },
      payment_date: {
        lt: startDate,
      },
    },
  });

  const previousInvoicesTotal = previousInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const previousPaymentsTotal = previousPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const beginningBalance = previousInvoicesTotal - previousPaymentsTotal;

  // Calculate invoices total for the statement period
  const invoices = await prisma.invoice.findMany({
    where: {
      client_group_id: clientGroupId,
      issued_date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const invoicesTotal = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  // Calculate payments total for the statement period
  const payments = await prisma.payment.findMany({
    where: {
      Invoice: {
        client_group_id: clientGroupId,
      },
      payment_date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const paymentsTotal = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  // Calculate ending balance
  const endingBalance = beginningBalance + invoicesTotal - paymentsTotal;

  return {
    beginningBalance,
    invoicesTotal,
    paymentsTotal,
    endingBalance,
  };
}

// Helper function to get statement details
async function getStatementDetails(
  clientGroupId: string,
  startDate: Date,
  endDate: Date,
): Promise<StatementDetailItem[]> {
  // Get all invoices in the date range
  const invoices = await prisma.invoice.findMany({
    where: {
      client_group_id: clientGroupId,
      issued_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      issued_date: "asc",
    },
    include: {
      Appointment: {
        include: {
          PracticeService: {
            select: {
              description: true,
            },
          },
        },
      },
    },
  });

  // Get all payments in the date range
  const payments = await prisma.payment.findMany({
    where: {
      Invoice: {
        client_group_id: clientGroupId,
      },
      payment_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      payment_date: "asc",
    },
    include: {
      Invoice: true,
      CreditCard: true,
    },
  });

  // Combine invoices and payments into one sorted array with type
  const details: StatementDetailItem[] = [
    ...invoices.map((invoice) => {
      // Format date as MM/DD/YYYY
      const dateStr = invoice.issued_date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      // Get service description either from invoice or from appointment's practice service
      const serviceDescription =
        invoice.service_description ||
        invoice.Appointment?.PracticeService?.description ||
        "Professional Services";

      return {
        id: invoice.id,
        date: invoice.issued_date,
        type: "invoice",
        description: invoice.invoice_number,
        serviceDescription: `${dateStr} ${serviceDescription}`,
        amount: Number(invoice.amount),
        isCredit: false,
      };
    }),
    ...payments.map((payment) => ({
      id: payment.id,
      date: payment.payment_date,
      type: "payment",
      description: payment.CreditCard ? "Credit Card" : "Cash",
      serviceDescription: "",
      amount: Number(payment.amount),
      isCredit: true,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate running balance
  let runningBalance = 0;

  // Get previous balance as starting point
  const previousInvoices = await prisma.invoice.findMany({
    where: {
      client_group_id: clientGroupId,
      issued_date: {
        lt: startDate,
      },
    },
  });

  const previousPayments = await prisma.payment.findMany({
    where: {
      Invoice: {
        client_group_id: clientGroupId,
      },
      payment_date: {
        lt: startDate,
      },
    },
  });

  const previousInvoicesTotal = previousInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const previousPaymentsTotal = previousPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  runningBalance = previousInvoicesTotal - previousPaymentsTotal;

  // Calculate running balance for each item
  details.forEach((item) => {
    if (item.isCredit) {
      runningBalance -= item.amount;
    } else {
      runningBalance += item.amount;
    }
    item.balance = runningBalance;
  });

  return details;
}
