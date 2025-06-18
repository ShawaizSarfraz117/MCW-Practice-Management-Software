import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";

interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string;
  servicesProvided: number;
  uninvoiced: number;
  invoiced: number;
  clientPaid: number;
  clientBalance: number;
}

interface OutstandingBalanceResponse {
  data: OutstandingBalanceItem[];
  totals: {
    servicesProvided: number;
    uninvoiced: number;
    invoiced: number;
    clientPaid: number;
    clientBalance: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Calculate offset for pagination
  const skip = (page - 1) * limit;

  try {
    // Build the base query parts
    const appointmentFeesQuery = `
      WITH AppointmentFees AS (
        -- Calculate total appointment fees for each client group
        SELECT 
          cg.id as clientGroupId,
          cg.name as clientGroupName,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE 0
            END
          ), 2) as totalAppointmentFees
        FROM ClientGroup cg
        LEFT JOIN Appointment a ON cg.id = a.client_group_id
          AND a.start_date >= @P1
          AND a.start_date <= @P2
        GROUP BY cg.id, cg.name
      ),
      InvoiceData AS (
        -- Calculate invoiced amounts for each client group
        SELECT 
          cg.id as clientGroupId,
          ROUND(SUM(
            CASE 
              WHEN i.appointment_id IS NOT NULL 
              THEN i.amount
              ELSE 0
            END
          ), 2) as invoicedFromAppointments,
          ROUND(SUM(i.amount), 2) as totalInvoiced
        FROM ClientGroup cg
        LEFT JOIN Invoice i ON cg.id = i.client_group_id
          AND i.issued_date >= @P1
          AND i.issued_date <= @P2
          AND i.status NOT IN ('VOID', 'DRAFT')
        GROUP BY cg.id
      ),
      PaymentData AS (
        -- Calculate total payments for each client group
        SELECT 
          cg.id as clientGroupId,
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as totalPaid
        FROM ClientGroup cg
        LEFT JOIN Invoice i ON cg.id = i.client_group_id
        LEFT JOIN Payment p ON i.id = p.invoice_id
          AND p.payment_date >= @P1
          AND p.payment_date <= @P2
          AND p.status = 'COMPLETED'
        GROUP BY cg.id
      )`;

    // Get outstanding balances data using raw SQL
    const balanceData = await prisma.$queryRawUnsafe<OutstandingBalanceItem[]>(
      `
      ${appointmentFeesQuery}
      SELECT 
        af.clientGroupId,
        af.clientGroupName,
        ISNULL(af.totalAppointmentFees, 0) as servicesProvided,
        ROUND(ISNULL(af.totalAppointmentFees, 0) - ISNULL(id.invoicedFromAppointments, 0), 2) as uninvoiced,
        ISNULL(id.totalInvoiced, 0) as invoiced,
        ISNULL(pd.totalPaid, 0) as clientPaid,
        ROUND(ISNULL(id.totalInvoiced, 0) - ISNULL(pd.totalPaid, 0), 2) as clientBalance
      FROM AppointmentFees af
      LEFT JOIN InvoiceData id ON af.clientGroupId = id.clientGroupId
      LEFT JOIN PaymentData pd ON af.clientGroupId = pd.clientGroupId
      WHERE ISNULL(af.totalAppointmentFees, 0) > 0 
         OR ISNULL(id.totalInvoiced, 0) > 0 
         OR ISNULL(pd.totalPaid, 0) > 0
      ORDER BY af.clientGroupName
      OFFSET @P3 ROWS
      FETCH NEXT @P4 ROWS ONLY
    `,
      start,
      end,
      skip,
      limit,
    );

    // Get totals
    const totalsData = await prisma.$queryRawUnsafe<
      Array<{
        servicesProvided: number;
        uninvoiced: number;
        invoiced: number;
        clientPaid: number;
        clientBalance: number;
        totalGroups: number;
      }>
    >(
      `
      ${appointmentFeesQuery}
      SELECT 
        ROUND(SUM(ISNULL(af.totalAppointmentFees, 0)), 2) as servicesProvided,
        ROUND(SUM(ISNULL(af.totalAppointmentFees, 0) - ISNULL(id.invoicedFromAppointments, 0)), 2) as uninvoiced,
        ROUND(SUM(ISNULL(id.totalInvoiced, 0)), 2) as invoiced,
        ROUND(SUM(ISNULL(pd.totalPaid, 0)), 2) as clientPaid,
        ROUND(SUM(ISNULL(id.totalInvoiced, 0) - ISNULL(pd.totalPaid, 0)), 2) as clientBalance,
        COUNT(DISTINCT af.clientGroupId) as totalGroups
      FROM AppointmentFees af
      LEFT JOIN InvoiceData id ON af.clientGroupId = id.clientGroupId
      LEFT JOIN PaymentData pd ON af.clientGroupId = pd.clientGroupId
      WHERE ISNULL(af.totalAppointmentFees, 0) > 0 
         OR ISNULL(id.totalInvoiced, 0) > 0 
         OR ISNULL(pd.totalPaid, 0) > 0
    `,
      start,
      end,
    );

    const totals = totalsData[0] || {
      servicesProvided: 0,
      uninvoiced: 0,
      invoiced: 0,
      clientPaid: 0,
      clientBalance: 0,
      totalGroups: 0,
    };

    const totalPages = Math.ceil(totals.totalGroups / limit);

    const response: OutstandingBalanceResponse = {
      data: balanceData,
      totals: {
        servicesProvided: totals.servicesProvided,
        uninvoiced: totals.uninvoiced,
        invoiced: totals.invoiced,
        clientPaid: totals.clientPaid,
        clientBalance: totals.clientBalance,
      },
      pagination: {
        page,
        limit,
        total: totals.totalGroups,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching outstanding balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch outstanding balances" },
      { status: 500 },
    );
  }
});
