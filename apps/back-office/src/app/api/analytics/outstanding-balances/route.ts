// Outstanding Balances API Route
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import {
  validateDateRange,
  validatePagination,
  createErrorResponse,
} from "@/app/api/analytics/utils/validation";

export interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string | null;
  responsibleClientFirstName: string | null;
  responsibleClientLastName: string | null;
  totalServicesProvided: number;
  totalAmountInvoiced: number;
  totalAmountPaid: number;
  totalAmountUnpaid: number;
}

export interface PaginatedOutstandingBalancesResponse {
  data: OutstandingBalanceItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function GET(request: NextRequest) {
  logger.info("Processing GET request for /api/analytics/outstanding-balances");

  const searchParams = request.nextUrl.searchParams;
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const dateValidation = validateDateRange(startDateParam, endDateParam);
  if (!dateValidation.isValid) {
    logger.warn({
      message: "Invalid date range provided",
      startDate: startDateParam,
      endDate: endDateParam,
    });
    return dateValidation.response;
  }
  const { startDateObj, endDateObj } = dateValidation;
  const startDateString = startDateObj.toISOString().split("T")[0];
  const endDateString = endDateObj.toISOString().split("T")[0];

  const paginationValidation = validatePagination(pageParam, pageSizeParam);
  if (!paginationValidation.isValid) {
    logger.warn({
      message: "Invalid pagination parameters",
      page: pageParam,
      pageSize: pageSizeParam,
    });
    return paginationValidation.response;
  }
  const { page, pageSize } = paginationValidation;
  const offset = (page - 1) * pageSize;

  const mainQuery = Prisma.sql`
    SELECT
      cg.id AS clientGroupId,
      cg.name AS clientGroupName,
      COALESCE(rc_billing.legal_first_name, rc_fallback.legal_first_name) AS responsibleClientFirstName,
      COALESCE(rc_billing.legal_last_name, rc_fallback.legal_last_name) AS responsibleClientLastName,
      COALESCE(SUM(a.service_fee), 0) AS totalServicesProvided,
      COALESCE(SUM(i.amount), 0) AS totalAmountInvoiced,
      COALESCE(SUM(p.amount), 0) AS totalAmountPaid,
      (COALESCE(SUM(i.amount), 0) - COALESCE(SUM(p.amount), 0)) AS totalAmountUnpaid
    FROM ClientGroup cg
    OUTER APPLY (
      SELECT TOP 1 cl_resp.legal_first_name, cl_resp.legal_last_name
      FROM ClientGroupMembership cgm_resp
      JOIN Client cl_resp ON cgm_resp.client_id = cl_resp.id
      WHERE cgm_resp.client_group_id = cg.id AND cgm_resp.is_responsible_for_billing = 1
      ORDER BY cl_resp.created_at ASC
    ) rc_billing
    OUTER APPLY (
      SELECT TOP 1 cl_resp.legal_first_name, cl_resp.legal_last_name
      FROM ClientGroupMembership cgm_resp
      JOIN Client cl_resp ON cgm_resp.client_id = cl_resp.id
      WHERE cgm_resp.client_group_id = cg.id AND rc_billing.legal_first_name IS NULL
      ORDER BY cl_resp.created_at ASC
    ) rc_fallback
    LEFT JOIN Appointment a ON cg.id = a.client_group_id AND a.start_date BETWEEN ${startDateString} AND ${endDateString}
    LEFT JOIN Invoice i ON a.id = i.appointment_id
    LEFT JOIN Payment p ON i.id = p.invoice_id
    GROUP BY cg.id, cg.name, 
             COALESCE(rc_billing.legal_first_name, rc_fallback.legal_first_name), 
             COALESCE(rc_billing.legal_last_name, rc_fallback.legal_last_name)
    ORDER BY ISNULL(cg.name, '''') ASC
    OFFSET ${offset} ROWS
    FETCH NEXT ${pageSize} ROWS ONLY;
  `;

  const countQuery = Prisma.sql`
    SELECT COUNT(DISTINCT cg.id) AS totalCount
    FROM ClientGroup cg
    LEFT JOIN Appointment a ON cg.id = a.client_group_id AND a.start_date BETWEEN ${startDateString} AND ${endDateString};
  `;

  try {
    const mainQueryStartTime = Date.now();
    logger.info({
      message: "Executing outstanding balances main query",
      startDateString,
      endDateString,
      page,
      pageSize,
    });
    const result = await prisma.$queryRaw<OutstandingBalanceItem[]>(mainQuery);
    const mainQueryEndTime = Date.now();
    const mainQueryExecutionTime = mainQueryEndTime - mainQueryStartTime;
    logger.info({
      message:
        "Outstanding balances main query executed in " +
        mainQueryExecutionTime +
        "ms",
      recordCount: result.length,
    });

    if (mainQueryExecutionTime > 1000) {
      logger.warn({
        message: "Outstanding balances main query took longer than 1 second.",
        executionTimeMs: mainQueryExecutionTime,
        startDate: startDateString,
        endDate: endDateString,
        page,
        pageSize,
        recordCount: result.length,
      });
    }

    const countQueryStartTime = Date.now();
    logger.info({
      message: "Executing outstanding balances count query",
      startDateString,
      endDateString,
    });
    const countResult =
      await prisma.$queryRaw<[{ totalCount: number }]>(countQuery);
    const countQueryEndTime = Date.now();
    const countQueryExecutionTime = countQueryEndTime - countQueryStartTime;
    logger.info({
      message:
        "Outstanding balances count query executed in " +
        countQueryExecutionTime +
        "ms",
    });

    if (countQueryExecutionTime > 1000) {
      logger.warn({
        message: "Outstanding balances count query took longer than 1 second.",
        executionTimeMs: countQueryExecutionTime,
        startDate: startDateString,
        endDate: endDateString,
      });
    }

    const totalCount = countResult[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const responsePayload: PaginatedOutstandingBalancesResponse = {
      data: result,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      message: "Failed to fetch outstanding balances data: " + errorMessage,
      params: { startDateString, endDateString, page, pageSize },
    });
    return createErrorResponse(
      "Failed to retrieve outstanding balances data. " + errorMessage,
      500,
    );
  }
}
