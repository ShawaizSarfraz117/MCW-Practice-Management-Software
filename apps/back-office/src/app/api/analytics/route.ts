import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isValid,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "thisMonth";
    let startDate: Date;
    let endDate: Date;

    switch (range) {
      case "lastMonth": {
        const lastMonth = subMonths(new Date(), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      }
      case "custom": {
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        if (!start || !end) {
          return NextResponse.json(
            { error: "Missing custom date range" },
            { status: 400 },
          );
        }
        const parsedStart = parseISO(start);
        const parsedEnd = parseISO(end);
        if (!isValid(parsedStart) || !isValid(parsedEnd)) {
          return NextResponse.json(
            { error: "Invalid custom date(s)" },
            { status: 400 },
          );
        }
        startDate = parsedStart;
        endDate = parsedEnd;
        break;
      }
      case "thisMonth":
      default: {
        const now = new Date();
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      }
    }

    // Income: sum of payments for invoices issued in range
    const incomeResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        payment_date: { gte: startDate, lte: endDate },
        status: "Completed",
      },
    });
    const income = incomeResult._sum.amount || 0;

    // Outstanding balances: sum of unpaid invoice amounts
    const outstandingResult = await prisma.invoice.aggregate({
      where: {
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      _sum: {
        amount: true,
      },
    });

    const totalPaidResult = await prisma.payment.aggregate({
      where: {
        Invoice: {
          status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const uninvoicedResult = await prisma.invoice.aggregate({
      where: {
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        Payment: {
          none: {},
        },
      },
      _sum: {
        amount: true,
      },
    });

    const outstanding =
      Number(outstandingResult._sum?.amount || 0) -
      Number(totalPaidResult._sum?.amount || 0);
    const uninvoiced = Number(uninvoicedResult._sum?.amount || 0);

    // Appointments: count for range
    const appointmentsCount = await prisma.appointment.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
      },
    });

    // Notes: count for range (assuming SurveyAnswers as notes)
    const notesCount = await prisma.surveyAnswers.count({
      where: {
        assigned_at: { gte: startDate, lte: endDate },
      },
    });

    return NextResponse.json({
      income,
      outstanding,
      uninvoiced,
      appointments: appointmentsCount,
      notes: notesCount,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch analytics");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
