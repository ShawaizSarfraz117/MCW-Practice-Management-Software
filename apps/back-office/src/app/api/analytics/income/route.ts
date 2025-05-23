// Income Analytics API Route
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import {
  validateDateRange,
  createErrorResponse,
} from "@/app/api/analytics/utils/validation";

export interface DailyIncomeMetric {
  date: string; // YYYY-MM-DD
  clientPayments: number;
  grossIncome: number;
  netIncome: number;
}

export async function GET(request: NextRequest) {
  logger.info("Processing GET request for /api/analytics/income");

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const dateValidation = validateDateRange(startDate, endDate);
  if (!dateValidation.isValid) {
    logger.warn({ message: "Invalid date range provided", startDate, endDate });
    return dateValidation.response;
  }

  const { startDateObj, endDateObj } = dateValidation;

  // Format dates to YYYY-MM-DD string for SQL query
  const startDateString = startDateObj.toISOString().split("T")[0];
  const endDateString = endDateObj.toISOString().split("T")[0];

  const query = Prisma.sql`
    WITH DateSeries AS (
      SELECT CAST(${startDateString} AS DATE) AS date
      UNION ALL
      SELECT DATEADD(day, 1, date)
      FROM DateSeries
      WHERE date < CAST(${endDateString} AS DATE)
    )
    SELECT
      CONVERT(varchar, d.date, 23) AS date, -- Format date as YYYY-MM-DD
      COALESCE(SUM(p.amount), 0) AS clientPayments,
      COALESCE(SUM(a.service_fee), 0) AS grossIncome,
      COALESCE(SUM(COALESCE(a.service_fee, 0) - COALESCE(a.discount_amount, 0)), 0) AS netIncome
    FROM DateSeries d
    LEFT JOIN Payment p ON CAST(p.payment_date AS DATE) = d.date
    LEFT JOIN Appointment a ON CAST(a.start_date AS DATE) = d.date
    GROUP BY d.date
    ORDER BY d.date
    OPTION (MAXRECURSION 0);
  `;

  try {
    const startTime = Date.now();
    logger.info({
      message: "Executing income analytics query",
      startDateString,
      endDateString,
    });

    const result = await prisma.$queryRaw<DailyIncomeMetric[]>(query);

    const endTime = Date.now();
    logger.info({
      message:
        "Income analytics query executed in " + (endTime - startTime) + "ms",
      recordCount: result.length,
    });

    // Ensure all dates in the range are present, even if no financial data
    // This is handled by the DateSeries CTE and LEFT JOINs

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      message: "Failed to fetch income analytics data: " + errorMessage,
      query: query.strings.join("?"), // Log query structure (template)
      params: { startDateString, endDateString },
    });
    return createErrorResponse(
      "Failed to retrieve income data. " + errorMessage,
      500,
    );
  }
}

// // Placeholder for POST, PUT, DELETE if ever needed, adhering to guidelines
// export async function POST(request: NextRequest) {
//   return createErrorResponse("Method Not Allowed", 405);
// }
// export async function PUT(request: NextRequest) {
//   return createErrorResponse("Method Not Allowed", 405);
// }
// export async function DELETE(request: NextRequest) {
//   return createErrorResponse("Method Not Allowed", 405);
// }
