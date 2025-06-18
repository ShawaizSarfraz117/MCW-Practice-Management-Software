/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import * as XLSX from "xlsx";

interface AppointmentStatusItem {
  appointmentId: string;
  clientGroupId: string;
  dateOfService: string;
  client: string;
  billingCode: string;
  ratePerUnit: number;
  units: number;
  totalFee: number;
  status: string;
  charge: number;
  uninvoiced: number;
  paid: number;
  unpaid: number;
}

// GET - Export appointment status data as CSV or Excel
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const clientGroupId = searchParams.get("clientGroupId");
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
    // Get appointment status data using raw SQL
    const appointmentData = await prisma.$queryRawUnsafe<
      AppointmentStatusItem[]
    >(
      `
      WITH ClientNames AS (
        SELECT 
          cg.id as clientGroupId,
          STRING_AGG(
            CONCAT(c.legal_first_name, ' ', c.legal_last_name), 
            ' & '
          ) as clientName
        FROM ClientGroup cg
        INNER JOIN ClientGroupMembership cgm ON cg.id = cgm.client_group_id
        INNER JOIN Client c ON cgm.client_id = c.id
        WHERE cgm.is_contact_only = 0
        GROUP BY cg.id
      ),
      AppointmentDetails AS (
        SELECT 
          a.id as appointmentId,
          a.client_group_id as clientGroupId,
          FORMAT(a.start_date, 'MM/dd/yyyy') as dateOfService,
          cn.clientName as client,
          ISNULL(ps.code, 'N/A') as billingCode,
          ISNULL(ps.rate, 0) as ratePerUnit,
          CASE 
            WHEN ps.duration > 0 
            THEN CEILING(DATEDIFF(MINUTE, a.start_date, a.end_date) / CAST(ps.duration as FLOAT))
            ELSE 1
          END as units,
          ISNULL(a.appointment_fee, 0) as totalFee,
          CASE 
            WHEN i.id IS NULL THEN 'UNINVOICED'
            WHEN ISNULL(totalPaid.amount, 0) >= i.amount THEN 'PAID'
            WHEN ISNULL(totalPaid.amount, 0) > 0 THEN 'PARTIAL'
            ELSE 'UNPAID'
          END as status,
          ROUND(
            ISNULL(a.appointment_fee, 0) + 
            ISNULL(a.adjustable_amount, 0) - 
            ISNULL(a.write_off, 0), 2
          ) as charge,
          CASE 
            WHEN i.id IS NULL THEN ROUND(
              ISNULL(a.appointment_fee, 0) + 
              ISNULL(a.adjustable_amount, 0) - 
              ISNULL(a.write_off, 0), 2
            )
            ELSE 0
          END as uninvoiced,
          ISNULL(totalPaid.amount, 0) as paid,
          CASE 
            WHEN i.id IS NOT NULL 
            THEN ROUND(i.amount - ISNULL(totalPaid.amount, 0), 2)
            ELSE 0
          END as unpaid
        FROM Appointment a
        LEFT JOIN ClientNames cn ON a.client_group_id = cn.clientGroupId
        LEFT JOIN PracticeService ps ON a.service_id = ps.id
        LEFT JOIN Invoice i ON a.id = i.appointment_id
        LEFT JOIN (
          SELECT 
            p.invoice_id,
            SUM(p.amount + ISNULL(p.credit_applied, 0)) as amount
          FROM Payment p
          WHERE p.status = 'COMPLETED'
          GROUP BY p.invoice_id
        ) totalPaid ON i.id = totalPaid.invoice_id
        WHERE a.start_date >= @P1
          AND a.start_date <= @P2
          AND a.type = 'APPOINTMENT'
          ${clientGroupId ? "AND a.client_group_id = @P3" : ""}
      )
      SELECT 
        appointmentId,
        clientGroupId,
        dateOfService,
        ISNULL(client, 'Unknown Client') as client,
        billingCode,
        ratePerUnit,
        units,
        totalFee,
        status,
        charge,
        uninvoiced,
        paid,
        unpaid
      FROM AppointmentDetails
      ORDER BY dateOfService DESC, client
    `,
      start,
      end,
      ...(clientGroupId ? [clientGroupId] : []),
    );

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date of Service",
        "Client",
        "Billing Code",
        "Rate Per Unit",
        "Units",
        "Total Fee",
        "Status",
        "Charge",
        "Uninvoiced",
        "Paid",
        "Unpaid",
      ];
      const csvRows = [headers.join(",")];

      // Add data rows
      appointmentData.forEach((row) => {
        const values = [
          row.dateOfService,
          `"${row.client}"`, // Quote client name to handle commas
          row.billingCode,
          formatCurrency(row.ratePerUnit),
          row.units.toString(),
          formatCurrency(row.totalFee),
          row.status,
          formatCurrency(row.charge),
          formatCurrency(row.uninvoiced),
          formatCurrency(row.paid),
          formatCurrency(row.unpaid),
        ];
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="appointment-status-${startDate}-to-${endDate}.csv"`,
        },
      });
    } else if (format === "excel") {
      // Generate Excel
      const worksheetData = [
        ["Appointment Status Report", "", "", "", "", "", "", "", "", "", ""],
        [
          `Period: ${startDate} to ${endDate}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
        ["", "", "", "", "", "", "", "", "", "", ""],
        [
          "Date of Service",
          "Client",
          "Billing Code",
          "Rate Per Unit",
          "Units",
          "Total Fee",
          "Status",
          "Charge",
          "Uninvoiced",
          "Paid",
          "Unpaid",
        ],
      ];

      // Add data rows
      appointmentData.forEach((row) => {
        worksheetData.push([
          row.dateOfService,
          row.client,
          row.billingCode,
          row.ratePerUnit,
          row.units,
          row.totalFee,
          row.status,
          row.charge,
          row.uninvoiced,
          row.paid,
          row.unpaid,
        ]);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Date of Service
        { wch: 30 }, // Client
        { wch: 15 }, // Billing Code
        { wch: 15 }, // Rate Per Unit
        { wch: 10 }, // Units
        { wch: 15 }, // Total Fee
        { wch: 15 }, // Status
        { wch: 15 }, // Charge
        { wch: 15 }, // Uninvoiced
        { wch: 15 }, // Paid
        { wch: 15 }, // Unpaid
      ];
      ws["!cols"] = columnWidths;

      // Apply formatting to currency columns
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let row = 4; row <= range.e.r; row++) {
        // Currency columns: Rate Per Unit (3), Total Fee (5), Charge (7), Uninvoiced (8), Paid (9), Unpaid (10)
        [3, 5, 7, 8, 9, 10].forEach((col) => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
            ws[cellAddress].z = "$#,##0.00";
          }
        });
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Appointment Status");

      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="appointment-status-${startDate}-to-${endDate}.xlsx"`,
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
      message: "Error exporting appointment status",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to export appointment status" },
      { status: 500 },
    );
  }
});

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
