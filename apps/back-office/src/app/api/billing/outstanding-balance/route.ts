import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client"; // For Decimal type if needed, though raw SQL returns numbers/strings

interface OutstandingBalanceData {
  clientId: string;
  clientLegalFirstName: string;
  clientLegalLastName: string;
  totalServiceAmount: number;
  totalPaidAmount: number;
  totalOutstandingBalance: number;
}

export async function GET(request: NextRequest) {
  logger.info("GET /api/billing/outstanding-balance called");

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateString = searchParams.get("startDate");
    const endDateString = searchParams.get("endDate");
    const pageString = searchParams.get("page");
    const rowsPerPageString = searchParams.get("rowsPerPage");

    if (!startDateString || !endDateString) {
      logger.warn(
        `Missing startDate or endDate for /api/billing/outstanding-balance. Start: ${startDateString}, End: ${endDateString}`,
      );
      return NextResponse.json(
        { error: "Missing required query parameters: startDate and endDate" },
        { status: 400 },
      );
    }

    // Basic date validation - can be enhanced (e.g., with Zod)
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      logger.warn(
        "Invalid date format provided for /api/billing/outstanding-balance",
      );
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }
    endDate.setUTCHours(23, 59, 59, 999); // Ensure end date includes the entire day

    const page = pageString ? parseInt(pageString, 10) : 1;
    const rowsPerPage = rowsPerPageString
      ? parseInt(rowsPerPageString, 10)
      : 20;

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page number. Must be 1 or greater." },
        { status: 400 },
      );
    }
    if (isNaN(rowsPerPage) || rowsPerPage < 1 || rowsPerPage > 100) {
      // Cap rowsPerPage
      return NextResponse.json(
        { error: "Invalid rowsPerPage. Must be between 1 and 100." },
        { status: 400 },
      );
    }
    const offset = (page - 1) * rowsPerPage;

    logger.info(
      `Processing GET /api/billing/outstanding-balance. Params - startDate: ${startDateString}, endDate: ${endDateString}, page: ${page}, rowsPerPage: ${rowsPerPage}`,
    );

    // SQL to fetch outstanding balances
    // This initial version handles single client (via ClientGroup) and basic calculations.
    // It will be expanded for more complex group logic and client identification.
    const rawQuery = Prisma.sql`
      WITH ResponsibleClient AS (
        SELECT 
          cgm.client_group_id,
          c.id as client_id,
          c.legal_first_name,
          c.legal_last_name,
          -- Determine the single responsible client for a group
          ROW_NUMBER() OVER (PARTITION BY cgm.client_group_id ORDER BY cgm.is_responsible_for_billing DESC, c.created_at ASC) as rn
        FROM ClientGroupMembership cgm
        JOIN Client c ON cgm.client_id = c.id
        WHERE c.is_active = 1
      )
      SELECT 
        rc.client_id AS "clientId",
        rc.legal_first_name AS "clientLegalFirstName",
        rc.legal_last_name AS "clientLegalLastName",
        SUM(COALESCE(a.appointment_fee, 0)) AS "totalServiceAmount",
        SUM(
          COALESCE(a.appointment_fee, 0) - 
          COALESCE(a.write_off, 0) - 
          COALESCE(a.adjustable_amount, 0)
        ) AS "totalPaidAmount",
        SUM(COALESCE(a.adjustable_amount, 0)) AS "totalOutstandingBalance"
      FROM Appointment a
      JOIN ResponsibleClient rc ON a.client_group_id = rc.client_group_id AND rc.rn = 1
      WHERE a.start_date >= ${startDate} AND a.start_date <= ${endDate}
        AND a.status = 'completed' -- Assuming only completed appointments contribute to balance
      GROUP BY rc.client_id, rc.legal_first_name, rc.legal_last_name
      ORDER BY rc.legal_last_name, rc.legal_first_name
      OFFSET ${offset} ROWS
      FETCH NEXT ${rowsPerPage} ROWS ONLY;
    `;

    const results: OutstandingBalanceData[] = await prisma.$queryRaw(rawQuery);

    // For total count, we need a separate query without pagination
    const countQuery = Prisma.sql`
      WITH ResponsibleClient AS (
        SELECT 
          cgm.client_group_id,
          c.id as client_id,
          -- Determine the single responsible client for a group
          ROW_NUMBER() OVER (PARTITION BY cgm.client_group_id ORDER BY cgm.is_responsible_for_billing DESC, c.created_at ASC) as rn
        FROM ClientGroupMembership cgm
        JOIN Client c ON cgm.client_id = c.id
        WHERE c.is_active = 1
      )
      SELECT 
        COUNT(DISTINCT rc.client_id) as totalCount
      FROM Appointment a
      JOIN ResponsibleClient rc ON a.client_group_id = rc.client_group_id AND rc.rn = 1
      WHERE a.start_date >= ${startDate} AND a.start_date <= ${endDate}
        AND a.status = 'completed';
    `;

    const countResult: { totalCount: number }[] =
      await prisma.$queryRaw(countQuery);
    const totalRecords = countResult[0]?.totalCount || 0;

    // Convert BigInt to number for serialization, and Decimal to number
    const processedResults = results.map((r) => ({
      ...r,
      totalServiceAmount: Number(r.totalServiceAmount),
      totalPaidAmount: Number(r.totalPaidAmount),
      totalOutstandingBalance: Number(r.totalOutstandingBalance),
    }));

    return NextResponse.json({
      data: processedResults,
      pagination: {
        page,
        rowsPerPage,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / rowsPerPage),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to process GET /api/billing/outstanding-balance: ${errorMessage}`,
    );
    return NextResponse.json(
      { error: "Failed to fetch outstanding balances", details: errorMessage },
      { status: 500 },
    );
  }
}
