import { NextRequest, NextResponse } from "next/server";
import { logger } from "@mcw/logger";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";

// Helper function to construct the main data query
function getOutstandingBalancesQuery(
  startDate: Date | undefined,
  endDate: Date | undefined,
  limit: number,
  offset: number,
): Prisma.Sql {
  const queryParts: Prisma.Sql[] = [];

  queryParts.push(Prisma.sql`
    SELECT 
      cg.id AS "clientGroupId", cg.name AS "clientGroupName",
      rc.legal_first_name AS "responsibleClientFirstName", rc.legal_last_name AS "responsibleClientLastName",
      SUM(i.amount) AS "totalBilled",
      COALESCE(SUM(p.amount), 0) AS "totalPaid",
      (SUM(i.amount) - COALESCE(SUM(p.amount), 0)) AS "outstandingBalance"
    FROM "ClientGroup" cg
    LEFT JOIN "ClientGroupMembership" cgm_resp ON cgm_resp.client_group_id = cg.id AND cgm_resp.is_responsible_for_billing = TRUE
    LEFT JOIN "Client" rc ON rc.id = cgm_resp.client_id
    LEFT JOIN "Invoice" i ON i.client_group_id = cg.id
    LEFT JOIN "Payment" p ON p.invoice_id = i.id`);

  const dateFilterConditions: Prisma.Sql[] = [];
  if (startDate) {
    dateFilterConditions.push(Prisma.sql`i.created_at >= ${startDate}`);
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilterConditions.push(Prisma.sql`i.created_at <= ${endOfDay}`);
  }

  if (dateFilterConditions.length > 0) {
    queryParts.push(
      Prisma.sql`WHERE ${Prisma.join(dateFilterConditions, " AND ")}`,
    );
  }

  queryParts.push(Prisma.sql`
    GROUP BY cg.id, cg.name, rc.legal_first_name, rc.legal_last_name
    HAVING (SUM(i.amount) - COALESCE(SUM(p.amount), 0)) > 0
    ORDER BY "outstandingBalance" DESC, "clientGroupName" ASC
    LIMIT ${limit} OFFSET ${offset}`);

  return Prisma.join(queryParts, " ");
}

// Helper function to construct the count query
function getOutstandingBalancesCountQuery(
  startDate: Date | undefined,
  endDate: Date | undefined,
): Prisma.Sql {
  const subqueryParts: Prisma.Sql[] = [];

  subqueryParts.push(Prisma.sql`
      SELECT cg.id
      FROM "ClientGroup" cg
      LEFT JOIN "ClientGroupMembership" cgm_resp ON cgm_resp.client_group_id = cg.id AND cgm_resp.is_responsible_for_billing = TRUE
      LEFT JOIN "Client" rc ON rc.id = cgm_resp.client_id 
      LEFT JOIN "Invoice" i ON i.client_group_id = cg.id
      LEFT JOIN "Payment" p ON p.invoice_id = i.id`);

  const dateFilterConditionsForCount: Prisma.Sql[] = [];
  if (startDate) {
    dateFilterConditionsForCount.push(Prisma.sql`i.created_at >= ${startDate}`);
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilterConditionsForCount.push(Prisma.sql`i.created_at <= ${endOfDay}`);
  }

  if (dateFilterConditionsForCount.length > 0) {
    subqueryParts.push(
      Prisma.sql`WHERE ${Prisma.join(dateFilterConditionsForCount, " AND ")}`,
    );
  }

  subqueryParts.push(Prisma.sql`
      GROUP BY cg.id
      HAVING (SUM(i.amount) - COALESCE(SUM(p.amount), 0)) > 0`);

  const subqueryString = Prisma.join(subqueryParts, " ");

  return Prisma.sql`
    SELECT COUNT(*) as "totalCount"
    FROM (${subqueryString}) AS "filtered_groups"`;
}

// Define interfaces for query results
interface OutstandingBalanceItemFromDb {
  clientGroupId: string;
  clientGroupName: string;
  responsibleClientFirstName: string | null;
  responsibleClientLastName: string | null;
  totalBilled: string | number; // Raw query might return as string from SUM or already number depending on DB/driver
  totalPaid: string | number;
  outstandingBalance: string | number;
}

interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string;
  responsibleClientFirstName?: string;
  responsibleClientLastName?: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
}

interface CountQueryResult {
  totalCount: bigint | number; // Prisma count can return BigInt
}

export async function GET(request: NextRequest) {
  logger.info(
    { requestUrl: request.url },
    "GET /api/analytics/outstanding-balances called",
  );
  try {
    const searchParams = request.nextUrl.searchParams;

    const startDateString = searchParams.get("startDate");
    const endDateString = searchParams.get("endDate");
    const pageString = searchParams.get("page");
    const pageSizeString = searchParams.get("pageSize");

    let startDateDt: Date | undefined;
    let endDateDt: Date | undefined;

    if (startDateString) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(startDateString) ||
        isNaN(new Date(startDateString).getTime())
      ) {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: "startDate must be a valid YYYY-MM-DD date.",
          },
          { status: 400 },
        );
      }
      startDateDt = new Date(startDateString);
    }

    if (endDateString) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(endDateString) ||
        isNaN(new Date(endDateString).getTime())
      ) {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: "endDate must be a valid YYYY-MM-DD date.",
          },
          { status: 400 },
        );
      }
      endDateDt = new Date(endDateString);
    }

    if (startDateDt && endDateDt && endDateDt < startDateDt) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "endDate cannot be before startDate.",
        },
        { status: 400 },
      );
    }

    const page = parseInt(pageString || "1", 10);
    const pageSize = parseInt(pageSizeString || "10", 10);

    if (pageString !== null && (isNaN(page) || page < 1)) {
      return NextResponse.json(
        { error: "Invalid input", details: "page must be a positive integer." },
        { status: 400 },
      );
    }
    if (pageSizeString !== null && (isNaN(pageSize) || pageSize < 1)) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "pageSize must be a positive integer.",
        },
        { status: 400 },
      );
    }

    logger.info(
      {
        startDate: startDateDt?.toISOString().split("T")[0],
        endDate: endDateDt?.toISOString().split("T")[0],
        page,
        pageSize,
      },
      "Parsed query parameters",
    );

    const offset = (page - 1) * pageSize;
    const dataQuerySql = getOutstandingBalancesQuery(
      startDateDt,
      endDateDt,
      pageSize,
      offset,
    );
    const countQuerySql = getOutstandingBalancesCountQuery(
      startDateDt,
      endDateDt,
    );

    logger.info("Executing outstanding balances queries...");

    const [dataResultsRaw, countResultRaw] = await Promise.all([
      prisma.$queryRaw<OutstandingBalanceItemFromDb[]>(dataQuerySql),
      prisma.$queryRaw<CountQueryResult[]>(countQuerySql),
    ]);

    logger.info(
      countResultRaw,
      `Fetched ${dataResultsRaw.length} raw data items and count result:`,
    );

    const processedData: OutstandingBalanceItem[] = dataResultsRaw.map(
      (item) => ({
        clientGroupId: item.clientGroupId,
        clientGroupName: item.clientGroupName,
        responsibleClientFirstName:
          item.responsibleClientFirstName || undefined,
        responsibleClientLastName: item.responsibleClientLastName || undefined,
        totalBilled: parseFloat(String(item.totalBilled) || "0"),
        totalPaid: parseFloat(String(item.totalPaid) || "0"),
        outstandingBalance: parseFloat(String(item.outstandingBalance) || "0"),
      }),
    );

    const totalRecords = Number(countResultRaw[0]?.totalCount || 0);
    const totalPages = Math.ceil(totalRecords / pageSize);

    return NextResponse.json({
      data: processedData,
      pagination: {
        page,
        limit: pageSize,
        total: totalRecords,
        totalPages,
      },
    });
  } catch (error: unknown) {
    const baseMessage = "Failed to GET /api/analytics/outstanding-balances";
    let responseErrorMessage: string;

    if (error instanceof Error) {
      logger.error(error, `${baseMessage}: ${error.message}`);
      responseErrorMessage = error.message;
    } else {
      logger.error(
        { originalError: error },
        `${baseMessage}: ${String(error)}`,
      );
      responseErrorMessage = String(error);
    }
    return NextResponse.json(
      {
        error: "Failed to retrieve outstanding balances",
        details: responseErrorMessage,
      },
      { status: 500 },
    );
  }
}
