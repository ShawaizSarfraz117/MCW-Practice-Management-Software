import { NextRequest, NextResponse } from "next/server";
import { logger } from "@mcw/logger";

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

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check if dates are valid after parsing (e.g., 2023-02-30 would be invalid)
    // Note: new Date('YYYY-MM-DD') uses local timezone. For UTC, use new Date('YYYY-MM-DDT00:00:00Z')
    // For this validation, simply checking getTime() is usually sufficient if format is already YYYY-MM-DD.
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      // This check is somewhat redundant if regex format is strict and correct,
      // but good as a fallback or if regex is more permissive.
      return NextResponse.json(
        { error: "Invalid date value. Ensure dates are real dates." },
        { status: 400 },
      );
    }

    // Additionally, ensure that the string date matches the parsed date to catch invalid dates like 2023-02-30
    // which `new Date` might interpret as March 2nd, 2023.
    // We will create UTC dates to avoid timezone issues in comparison and validation.
    const startDateUTC = new Date(startDate + "T00:00:00Z");
    const endDateUTC = new Date(endDate + "T00:00:00Z");

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

    // Implementation will be added in subsequent tasks
    // For now, return a success message if validation passes
    return NextResponse.json(
      { message: "Validation passed", data: { startDate, endDate } },
      { status: 200 },
    );
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
