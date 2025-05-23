import { NextRequest, NextResponse } from "next/server";
import { logger } from "@mcw/logger";
import { prisma } from "@mcw/database"; // Uncommented
import { Prisma } from "@prisma/client"; // Uncommented

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = searchParams.get("page") || "1"; // Default to page 1
    const pageSize = searchParams.get("pageSize") || "10"; // Default to 10 items per page

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Both startDate and endDate are required" },
        { status: 400 },
      );
    }

    // Validate date formats (YYYY-MM-DD)
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Use UTC dates for consistency
    const startDateUTC = new Date(startDate + "T00:00:00Z");
    const endDateUTC = new Date(endDate + "T00:00:00Z");

    if (
      isNaN(startDateUTC.getTime()) ||
      isNaN(endDateUTC.getTime()) ||
      startDateUTC.toISOString().slice(0, 10) !== startDate ||
      endDateUTC.toISOString().slice(0, 10) !== endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid date value. Ensure dates like YYYY-MM-DD are correct (e.g., no 2023-02-30).",
        },
        { status: 400 },
      );
    }

    // Validate date range
    if (endDateUTC < startDateUTC) {
      return NextResponse.json(
        { error: "endDate must be on or after startDate" },
        { status: 400 },
      );
    }

    // Validate pagination parameters
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        { error: "page must be a positive integer" },
        { status: 400 },
      );
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1) {
      return NextResponse.json(
        { error: "pageSize must be a positive integer" },
        { status: 400 },
      );
    }

    logger.info(
      { startDate, endDate, page: pageNum, pageSize: pageSizeNum },
      "Outstanding balances analytics request",
    );

    const offset = (pageNum - 1) * pageSizeNum;

    // Main data query
    const data = await prisma.$queryRaw<
      Array<{
        client_group_id: string;
        client_group_name: string;
        responsible_client_first_name: string | null;
        responsible_client_last_name: string | null;
        total_services_provided: string; // Assuming numeric/decimal from SQL, cast to string
        total_amount_invoiced: string;
        total_amount_paid: string;
        total_amount_unpaid: string;
      }>
    >(Prisma.sql`
      WITH client_financials AS (
        SELECT
          cg.id as client_group_id,
          cg.name as client_group_name,
          SUM(appt.service_fee) as total_services_provided,
          SUM(inv.total_amount) as total_amount_invoiced, -- Assuming Invoice has total_amount
          COALESCE(SUM(pay.amount), 0) as total_amount_paid
        FROM "ClientGroup" cg
        LEFT JOIN "ClientGroupMembership" cgm ON cg.id = cgm.client_group_id
        LEFT JOIN "Client" c ON cgm.client_id = c.id
        LEFT JOIN "Appointment" appt ON c.id = appt.client_id
          AND DATE(appt.start_time) BETWEEN ${startDate}::date AND ${endDate}::date
          AND appt.status NOT IN ('Cancelled', 'Rescheduled')
        LEFT JOIN "Invoice" inv ON appt.id = inv.appointment_id -- Ensure correct linkage
          AND inv.status != 'VOID' AND inv.status != 'DRAFT' -- Consider relevant invoice statuses
        LEFT JOIN "Payment" pay ON inv.id = pay.invoice_id
          AND pay.status = 'Completed' -- Or 'Succeeded', 'Paid'
        GROUP BY cg.id, cg.name
      ),
      responsible_clients AS (
        SELECT DISTINCT ON (cgm.client_group_id)
          cgm.client_group_id,
          c.first_name as responsible_client_first_name,
          c.last_name as responsible_client_last_name
        FROM "ClientGroupMembership" cgm
        JOIN "Client" c ON cgm.client_id = c.id
        WHERE cgm.is_responsible_for_billing = true
        ORDER BY cgm.client_group_id, c.created_at DESC -- Get the most recently created responsible client if multiple
      )
      SELECT
        cf.client_group_id,
        cf.client_group_name,
        rc.responsible_client_first_name,
        rc.responsible_client_last_name,
        COALESCE(cf.total_services_provided::text, '0') as total_services_provided,
        COALESCE(cf.total_amount_invoiced::text, '0') as total_amount_invoiced,
        COALESCE(cf.total_amount_paid::text, '0') as total_amount_paid,
        COALESCE((cf.total_amount_invoiced - cf.total_amount_paid)::text, '0') as total_amount_unpaid
      FROM client_financials cf
      LEFT JOIN responsible_clients rc ON cf.client_group_id = rc.client_group_id
      WHERE COALESCE(cf.total_amount_invoiced - cf.total_amount_paid, 0) > 0
      ORDER BY cf.client_group_name
      LIMIT ${pageSizeNum}
      OFFSET ${offset}
    `);

    // Count query for pagination
    const countResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >(Prisma.sql`
      WITH client_financials AS (
        SELECT
          cg.id as client_group_id,
          SUM(inv.total_amount) as total_amount_invoiced,
          COALESCE(SUM(pay.amount), 0) as total_amount_paid
        FROM "ClientGroup" cg
        LEFT JOIN "ClientGroupMembership" cgm ON cg.id = cgm.client_group_id
        LEFT JOIN "Client" c ON cgm.client_id = c.id
        LEFT JOIN "Appointment" appt ON c.id = appt.client_id
          AND DATE(appt.start_time) BETWEEN ${startDate}::date AND ${endDate}::date
          AND appt.status NOT IN ('Cancelled', 'Rescheduled')
        LEFT JOIN "Invoice" inv ON appt.id = inv.appointment_id
          AND inv.status != 'VOID' AND inv.status != 'DRAFT'
        LEFT JOIN "Payment" pay ON inv.id = pay.invoice_id
          AND pay.status = 'Completed'
        GROUP BY cg.id
      )
      SELECT COUNT(*) as count
      FROM client_financials cf
      WHERE COALESCE(cf.total_amount_invoiced - cf.total_amount_paid, 0) > 0
    `);

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / pageSizeNum);

    return NextResponse.json(
      {
        data,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          totalItems,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error, "Error in outstanding balances analytics route");
    } else {
      logger.error(
        { details: String(error) },
        "An unknown error occurred in outstanding balances analytics route",
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
