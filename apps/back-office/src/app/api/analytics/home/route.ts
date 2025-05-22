import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// Define the schema for input validation
const AnalyticsHomeQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Invalid date format. Expected YYYY-MM-DD.",
      ),
    endDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Invalid date format. Expected YYYY-MM-DD.",
      ),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "endDate cannot be before startDate.",
    path: ["endDate"], // Point error to endDate
  });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    // Validate query parameters
    const validationResult = AnalyticsHomeQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      logger.error({
        message: "Invalid query parameters for /api/analytics/home",
        details: validationResult.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { startDate, endDate } = validationResult.data;

    // Adjust endDate to include the entire day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    logger.info({
      message: `Fetching home analytics data for date range: ${startDate} to ${endDate}`,
      startDate,
      endDate,
    });

    // --- Database Query Logic ---
    // Parameters for the raw query
    // startDate is already YYYY-MM-DD string
    // adjustedEndDate is a Date object

    const result: Array<{
      totalClientPayments: unknown;
      grossIncome: unknown;
    }> = await prisma.$queryRaw`
      SELECT
        SUM(CAST(COALESCE(appointment_fee, 0) - COALESCE(write_off, 0) - COALESCE(adjustable_amount, 0) AS DECIMAL(18,2))) AS totalClientPayments,
        SUM(CAST(COALESCE(appointment_fee, 0) AS DECIMAL(18,2))) AS grossIncome
      FROM Appointment
      WHERE
        start_date >= ${startDate} AND start_date <= ${adjustedEndDate}
        AND status = 'completed'
    `;

    let finalTotalClientPayments = 0;
    let finalGrossIncome = 0;

    if (result.length > 0 && result[0]) {
      // raw query results for aggregate functions might be strings, Decimals, or numbers.
      // Explicitly convert to Number and handle nulls (if SUM results in NULL for no rows).
      finalTotalClientPayments =
        result[0].totalClientPayments !== null
          ? Number(result[0].totalClientPayments)
          : 0;
      finalGrossIncome =
        result[0].grossIncome !== null ? Number(result[0].grossIncome) : 0;
    }

    // Net Income is Gross Income for now
    const finalNetIncome = finalGrossIncome;

    return NextResponse.json({
      totalClientPayments: finalTotalClientPayments,
      grossIncome: finalGrossIncome,
      netIncome: finalNetIncome,
      startDate, // Echo back the validated start date
      endDate, // Echo back the validated end date
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      message: "Error in /api/analytics/home GET handler",
      errorDetails: errorMessage, // Renamed from 'error' to avoid conflict if logger has a special 'error' field
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to fetch analytics data.", details: errorMessage },
      { status: 500 },
    );
  }
}
