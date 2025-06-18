/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import * as XLSX from "xlsx";

interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string;
  servicesProvided: number;
  uninvoiced: number;
  invoiced: number;
  clientPaid: number;
  clientBalance: number;
}

interface OutstandingBalanceTotals {
  servicesProvided: number;
  uninvoiced: number;
  invoiced: number;
  clientPaid: number;
  clientBalance: number;
}

// GET - Export outstanding balances data as CSV or Excel
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format") || "csv";

  // Validate required parameters
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  if (!["csv", "excel"].includes(format)) {
    return NextResponse.json(
      { error: "Format must be either 'csv' or 'excel'" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

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
    `,
      start,
      end,
    );

    // Get totals
    const totalsData = await prisma.$queryRawUnsafe<OutstandingBalanceTotals[]>(
      `
      ${appointmentFeesQuery}
      SELECT 
        ROUND(SUM(ISNULL(af.totalAppointmentFees, 0)), 2) as servicesProvided,
        ROUND(SUM(ISNULL(af.totalAppointmentFees, 0) - ISNULL(id.invoicedFromAppointments, 0)), 2) as uninvoiced,
        ROUND(SUM(ISNULL(id.totalInvoiced, 0)), 2) as invoiced,
        ROUND(SUM(ISNULL(pd.totalPaid, 0)), 2) as clientPaid,
        ROUND(SUM(ISNULL(id.totalInvoiced, 0) - ISNULL(pd.totalPaid, 0)), 2) as clientBalance
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
    };

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Client",
        "Services Provided",
        "Uninvoiced",
        "Invoiced",
        "Client Paid",
        "Client Balance",
      ];
      const csvRows = [headers.join(",")];

      // Add totals row
      csvRows.push(
        [
          "Totals",
          formatCurrency(totals.servicesProvided),
          formatCurrency(totals.uninvoiced),
          formatCurrency(totals.invoiced),
          formatCurrency(totals.clientPaid),
          formatCurrency(totals.clientBalance),
        ].join(","),
      );

      // Add empty row
      csvRows.push("");

      // Add data rows
      balanceData.forEach((row) => {
        const values = [
          `"${row.clientGroupName}"`, // Quote client name to handle commas
          formatCurrency(row.servicesProvided),
          formatCurrency(row.uninvoiced),
          formatCurrency(row.invoiced),
          formatCurrency(row.clientPaid),
          formatCurrency(row.clientBalance),
        ];
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="outstanding-balances-${startDate}-to-${endDate}.csv"`,
        },
      });
    } else if (format === "excel") {
      // Generate Excel
      const worksheetData = [
        ["Outstanding Balances Report", "", "", "", "", ""],
        [`Period: ${startDate} to ${endDate}`, "", "", "", "", ""],
        ["", "", "", "", "", ""],
        [
          "Client",
          "Services Provided",
          "Uninvoiced",
          "Invoiced",
          "Client Paid",
          "Client Balance",
        ],
      ];

      // Add totals row
      worksheetData.push([
        "Totals",
        totals.servicesProvided.toString(),
        totals.uninvoiced.toString(),
        totals.invoiced.toString(),
        totals.clientPaid.toString(),
        totals.clientBalance.toString(),
      ]);

      // Add empty row
      worksheetData.push(["", "", "", "", "", ""]);

      // Add data rows
      balanceData.forEach((row) => {
        worksheetData.push([
          row.clientGroupName,
          row.servicesProvided.toString(),
          row.uninvoiced.toString(),
          row.invoiced.toString(),
          row.clientPaid.toString(),
          row.clientBalance.toString(),
        ]);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 30 }, // Client column
        { wch: 20 }, // Services Provided column
        { wch: 20 }, // Uninvoiced column
        { wch: 20 }, // Invoiced column
        { wch: 20 }, // Client Paid column
        { wch: 20 }, // Client Balance column
      ];
      ws["!cols"] = columnWidths;

      // Apply formatting to currency columns
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let row = 4; row <= range.e.r; row++) {
        for (let col = 1; col <= 5; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
            ws[cellAddress].z = "$#,##0.00";
          }
        }
      }

      // Style the totals row
      const totalsRowIndex = 4;
      for (let col = 0; col <= 5; col++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: totalsRowIndex,
          c: col,
        });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "F0F0F0" } },
          };
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Outstanding Balances");

      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="outstanding-balances-${startDate}-to-${endDate}.xlsx"`,
        },
      });
    }

    // Should never reach here, but TypeScript needs a return
    return NextResponse.json(
      { error: "Invalid format specified" },
      { status: 400 },
    );
  } catch (error) {
    logger.error({
      message: "Error exporting outstanding balances",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to export outstanding balances" },
      { status: 500 },
    );
  }
});

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
