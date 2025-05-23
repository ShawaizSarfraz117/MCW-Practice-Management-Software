import { NextRequest, NextResponse } from "next/server";
import { logger } from "@mcw/logger";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Both startDate and endDate are required" },
        { status: 400 },
      );
    }

    // Validate date formats (YYYY-MM-DD)
    // A simple regex for YYYY-MM-DD format
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Use UTC dates for consistency in database queries
    const startDateUTC = new Date(startDate + "T00:00:00Z");
    const endDateUTC = new Date(endDate + "T00:00:00Z");

    // Check if dates are valid after parsing (e.g., 2023-02-30 would be invalid)
    // Note: new Date('YYYY-MM-DD') uses local timezone. For UTC, use new Date('YYYY-MM-DDT00:00:00Z')
    // For this validation, simply checking getTime() is usually sufficient if format is already YYYY-MM-DD.
    if (isNaN(startDateUTC.getTime()) || isNaN(endDateUTC.getTime())) {
      // This check is somewhat redundant if regex format is strict and correct,
      // but good as a fallback or if regex is more permissive.
      return NextResponse.json(
        {
          error:
            "Invalid date value. Ensure dates are correct (e.g., no 2023-02-30).",
        },
        { status: 400 },
      );
    }

    // Additionally, ensure that the string date matches the parsed date to catch invalid dates like 2023-02-30
    // which `new Date` might interpret as March 2nd, 2023.
    // We will create UTC dates to avoid timezone issues in comparison and validation.
    if (
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

    // Log request parameters
    logger.info({ startDate, endDate }, "Income analytics request");

    // Convert to Date objects (though SQL uses string dates, task details mentioned them)
    // const startDateObj = new Date(startDate + "T00:00:00Z"); // Removed as unused
    // const endDateObj = new Date(endDate + "T00:00:00Z"); // Removed as unused

    // SQL Query Implementation
    const queryStartTime = Date.now();
    const result = await prisma.$queryRaw<
      Array<{
        metric_date: Date; // Prisma will map SQL date to JS Date
        total_client_payments: string; // Assuming numeric/decimal from SQL, cast to string by COALESCE or SUM
        total_gross_income: string;
        total_net_income: string;
      }>
    >(Prisma.sql`
      WITH date_series AS (
        SELECT date::date as metric_date
        FROM generate_series(
          ${startDate}::date, -- Use original string for SQL casting
          ${endDate}::date,
          '1 day'::interval
        ) as date
      ),
      appointment_metrics AS (
        SELECT
          DATE(start_time) as appt_date, -- Assuming start_time, adjust if your column is start_date
          SUM(service_fee) as total_gross_income,
          SUM(service_fee - COALESCE(discount_amount, 0)) as total_net_income
        FROM "Appointment"
        WHERE 
          DATE(start_time) BETWEEN ${startDate}::date AND ${endDate}::date
          AND status NOT IN ('Cancelled', 'Rescheduled') -- Add other non-billable statuses if any
        GROUP BY DATE(start_time)
      ),
      payment_metrics AS (
        SELECT
          DATE(payment_date) as payment_date,
          SUM(amount) as total_client_payments
        FROM "Payment"
        WHERE 
          DATE(payment_date) BETWEEN ${startDate}::date AND ${endDate}::date
          AND status = 'Completed' -- Or 'Succeeded', 'Paid', etc.
        GROUP BY DATE(payment_date)
      )
      SELECT
        ds.metric_date,
        COALESCE(pm.total_client_payments::text, '0') as total_client_payments, -- Ensure text output for consistency
        COALESCE(am.total_gross_income::text, '0') as total_gross_income,
        COALESCE(am.total_net_income::text, '0') as total_net_income
      FROM date_series ds
      LEFT JOIN appointment_metrics am ON ds.metric_date = am.appt_date
      LEFT JOIN payment_metrics pm ON ds.metric_date = pm.payment_date
      ORDER BY ds.metric_date ASC
    `);
    const queryTime = Date.now() - queryStartTime;
    logger.info({ queryTime }, "Income analytics query executed");

    // Transform the data
    const formattedResult = result.map((item) => ({
      date: item.metric_date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      clientPayments: parseFloat(item.total_client_payments),
      grossIncome: parseFloat(item.total_gross_income),
      netIncome: parseFloat(item.total_net_income),
    }));

    return NextResponse.json(formattedResult, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error, "Error in analytics income route");
    } else {
      logger.error(
        { details: String(error) },
        "An unknown error occurred in analytics income route",
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
