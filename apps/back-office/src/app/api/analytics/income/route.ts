import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const incomeRequestSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

// Interface for the raw query result
interface DailyIncomeMetricRaw {
  metric_date: Date;
  total_gross_income: string; // Prisma returns Decimal as string from raw queries
  total_net_income: string; // Prisma returns Decimal as string from raw queries
  total_client_payments: string; // Prisma returns Decimal as string from raw queries
}

// Interface for the processed API response item
interface DailyIncomeMetricProcessed {
  metric_date: string; // YYYY-MM-DD
  total_gross_income: number;
  total_net_income: number;
  total_client_payments: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const validatedParams = incomeRequestSchema.parse({ startDate, endDate });

    const rawQuery = Prisma.sql`
      WITH DateSeries AS (
          SELECT CAST(${validatedParams.startDate} AS DATE) AS metric_date
          UNION ALL
          SELECT DATEADD(day, 1, metric_date)
          FROM DateSeries
          WHERE metric_date < CAST(${validatedParams.endDate} AS DATE)
      ),
      AggregatedAppointments AS (
          SELECT
              CAST(ap.appointment_date_time AS DATE) AS metric_date,
              SUM(ISNULL(ap.service_fee, 0)) AS total_gross_income,
              SUM(ISNULL(ap.service_fee, 0) - ISNULL(ap.discount_amount, 0)) AS total_net_income
          FROM Appointment ap
          WHERE ap.status NOT IN ('Cancelled', 'Rescheduled')
            AND CAST(ap.appointment_date_time AS DATE) >= CAST(${validatedParams.startDate} AS DATE)
            AND CAST(ap.appointment_date_time AS DATE) <= CAST(${validatedParams.endDate} AS DATE)
          GROUP BY CAST(ap.appointment_date_time AS DATE)
      ),
      AggregatedPayments AS (
          SELECT
              CAST(p.payment_date AS DATE) AS metric_date,
              SUM(ISNULL(p.amount, 0)) AS total_client_payments
          FROM Payment p
          WHERE p.status = 'Completed'
            AND CAST(p.payment_date AS DATE) >= CAST(${validatedParams.startDate} AS DATE)
            AND CAST(p.payment_date AS DATE) <= CAST(${validatedParams.endDate} AS DATE)
          GROUP BY CAST(p.payment_date AS DATE)
      )
      SELECT
          ds.metric_date,
          ISNULL(aa.total_gross_income, 0) AS total_gross_income,
          ISNULL(aa.total_net_income, 0) AS total_net_income,
          ISNULL(apg.total_client_payments, 0) AS total_client_payments
      FROM DateSeries ds
      LEFT JOIN AggregatedAppointments aa ON ds.metric_date = aa.metric_date
      LEFT JOIN AggregatedPayments apg ON ds.metric_date = apg.metric_date
      ORDER BY ds.metric_date ASC
      OPTION (MAXRECURSION 366);`;

    logger.info(
      `Fetching income analytics from ${validatedParams.startDate} to ${validatedParams.endDate}`,
    );

    const result = await prisma.$queryRaw<DailyIncomeMetricRaw[]>(rawQuery);

    const processedResult: DailyIncomeMetricProcessed[] = result.map(
      (item) => ({
        metric_date: item.metric_date.toISOString().split("T")[0], // Format to YYYY-MM-DD
        total_gross_income: parseFloat(item.total_gross_income),
        total_net_income: parseFloat(item.total_net_income),
        total_client_payments: parseFloat(item.total_client_payments),
      }),
    );

    return NextResponse.json({ data: processedResult });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.error({
        message: "Input validation failed",
        validationErrors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    // Ensure error is an instance of Error before accessing .message
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      message: "Failed to fetch income analytics",
      error: errorMessage,
    });
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 },
    );
  }
}
