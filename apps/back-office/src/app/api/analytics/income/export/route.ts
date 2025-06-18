/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import * as XLSX from "xlsx";

interface IncomeReportItem {
  date: string;
  clientPayments: number;
  grossIncome: number;
  clinicianCut: number;
  netIncome: number;
}

interface IncomeTotals {
  clientPayments: number;
  grossIncome: number;
  clinicianCut: number;
  netIncome: number;
}

// GET - Export income data as CSV or PDF
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const clinicianId = searchParams.get("clinicianId");
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
  start.setHours(0, 0, 0, 0); // Set to start of day

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Set to end of day

  try {
    // Get aggregated income data using raw SQL
    let incomeData: IncomeReportItem[];
    let totalsData: IncomeTotals | undefined;

    if (clinicianId && clinicianId !== "all") {
      // Query with clinician filter
      incomeData = await prisma.$queryRaw<IncomeReportItem[]>`
        SELECT 
          FORMAT(p.payment_date, 'yyyy-MM') as date,
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
          AND i.clinician_id = ${clinicianId}
        GROUP BY FORMAT(p.payment_date, 'yyyy-MM')
        ORDER BY FORMAT(p.payment_date, 'yyyy-MM') DESC
      `;

      // Get totals
      const totals = await prisma.$queryRaw<IncomeTotals[]>`
        SELECT 
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
          AND i.clinician_id = ${clinicianId}
      `;
      totalsData = totals[0];
    } else {
      // Query without clinician filter
      incomeData = await prisma.$queryRaw<IncomeReportItem[]>`
        SELECT 
          FORMAT(p.payment_date, 'yyyy-MM') as date,
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
        GROUP BY FORMAT(p.payment_date, 'yyyy-MM')
        ORDER BY FORMAT(p.payment_date, 'yyyy-MM') DESC
      `;

      // Get totals
      const totals = await prisma.$queryRaw<IncomeTotals[]>`
        SELECT 
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
      `;
      totalsData = totals[0];
    }

    const totals = totalsData || {
      clientPayments: 0,
      grossIncome: 0,
      clinicianCut: 0,
      netIncome: 0,
    };

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Client Payments",
        "Gross Income",
        "Clinician Cut",
        "Net Income",
      ];
      const csvRows = [headers.join(",")];

      // Add totals row
      csvRows.push(
        [
          "Totals",
          formatCurrency(totals.clientPayments),
          formatCurrency(totals.grossIncome),
          formatCurrency(totals.clinicianCut),
          formatCurrency(totals.netIncome),
        ].join(","),
      );

      // Add data rows
      incomeData.forEach((row) => {
        const date = formatDate(row.date);
        const values = [
          date,
          formatCurrency(row.clientPayments),
          formatCurrency(row.grossIncome),
          formatCurrency(row.clinicianCut),
          formatCurrency(row.netIncome),
        ];
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="income-report-${startDate}-to-${endDate}.csv"`,
        },
      });
    } else if (format === "excel") {
      // Generate Excel
      const worksheetData = [
        ["Income Report", "", "", "", ""],
        [`Period: ${startDate} to ${endDate}`, "", "", "", ""],
        ["", "", "", "", ""],
        [
          "Date",
          "Client Payments",
          "Gross Income",
          "Clinician Cut",
          "Net Income",
        ],
      ];

      // Add totals row
      worksheetData.push([
        "Totals",
        totals.clientPayments.toString(),
        totals.grossIncome.toString(),
        totals.clinicianCut.toString(),
        totals.netIncome.toString(),
      ]);

      // Add empty row
      worksheetData.push(["", "", "", "", ""]);

      // Add data rows
      incomeData.forEach((row) => {
        worksheetData.push([
          formatDate(row.date),
          row.clientPayments.toString(),
          row.grossIncome.toString(),
          row.clinicianCut.toString(),
          row.netIncome.toString(),
        ]);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Date column
        { wch: 20 }, // Client Payments column
        { wch: 20 }, // Gross Income column
        { wch: 20 }, // Clinician Cut column
        { wch: 20 }, // Net Income column
      ];
      ws["!cols"] = columnWidths;

      // Apply formatting to currency columns
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let row = 4; row <= range.e.r; row++) {
        for (let col = 1; col <= 4; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
            ws[cellAddress].z = "$#,##0.00";
          }
        }
      }

      // Style the totals row
      const totalsRowIndex = 4;
      for (let col = 0; col <= 4; col++) {
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
      XLSX.utils.book_append_sheet(wb, ws, "Income Report");

      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="income-report-${startDate}-to-${endDate}.xlsx"`,
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
      message: "Error exporting income data",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to export income data" },
      { status: 500 },
    );
  }
});

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}
