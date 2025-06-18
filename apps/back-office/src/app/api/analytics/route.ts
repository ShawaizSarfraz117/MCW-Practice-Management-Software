import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { withErrorHandling } from "@mcw/utils";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  startOfYear,
  endOfYear,
  parseISO,
  isValid,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";

export const GET = withErrorHandling(async (request: NextRequest) => {
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
    case "last30days": {
      endDate = endOfDay(new Date());
      startDate = startOfDay(subDays(endDate, 30));
      break;
    }
    case "thisYear": {
      const now = new Date();
      startDate = startOfYear(now);
      endDate = endOfYear(now);
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

      // Handle MM/DD/YYYY format
      let parsedStart: Date;
      let parsedEnd: Date;

      // Try parsing as ISO format first
      parsedStart = parseISO(start);
      parsedEnd = parseISO(end);

      // If ISO parsing fails, try MM/DD/YYYY format
      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        const startParts = start.split("/");
        const endParts = end.split("/");

        if (startParts.length === 3 && endParts.length === 3) {
          // Convert MM/DD/YYYY to Date
          parsedStart = new Date(
            parseInt(startParts[2]), // year
            parseInt(startParts[0]) - 1, // month (0-indexed)
            parseInt(startParts[1]), // day
          );
          parsedEnd = new Date(
            parseInt(endParts[2]), // year
            parseInt(endParts[0]) - 1, // month (0-indexed)
            parseInt(endParts[1]), // day
          );
        }
      }

      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        return NextResponse.json(
          { error: "Invalid custom date(s)" },
          { status: 400 },
        );
      }

      startDate = startOfDay(parsedStart);
      endDate = endOfDay(parsedEnd);
      break;
    }
    default: {
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    }
  }

  // Determine if we should group by day or month
  const isYearRange = range === "thisYear";
  const intervals = isYearRange
    ? eachMonthOfInterval({ start: startDate, end: endDate })
    : eachDayOfInterval({ start: startDate, end: endDate });

  // Get income data grouped by time period
  const incomeData = await Promise.all(
    intervals.map(async (intervalDate) => {
      const intervalStart = startOfDay(intervalDate);
      const intervalEnd = isYearRange
        ? endOfMonth(intervalDate)
        : endOfDay(intervalDate);

      const result = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          payment_date: {
            gte: intervalStart,
            lte: intervalEnd,
          },
          status: "Completed",
        },
      });

      return {
        date: isYearRange
          ? format(intervalDate, "MMM")
          : format(intervalDate, "MMM dd"),
        value: Number(result._sum.amount || 0),
      };
    }),
  );

  // Calculate total income
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);

  // Get appointment status breakdown
  const appointmentStatusCounts = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      start_date: { gte: startDate, lte: endDate },
    },
    _count: {
      status: true,
    },
  });

  // Format appointment data for charts
  const appointmentData = [
    {
      name: "Show",
      value:
        appointmentStatusCounts.find((s) => s.status === "SHOW")?._count
          .status || 0,
    },
    {
      name: "No Show",
      value:
        appointmentStatusCounts.find((s) => s.status === "NO_SHOW")?._count
          .status || 0,
    },
    {
      name: "Canceled",
      value:
        appointmentStatusCounts.find((s) => s.status === "CANCELLED")?._count
          .status || 0,
    },
    {
      name: "Late Canceled",
      value:
        appointmentStatusCounts.find((s) => s.status === "LATE_CANCELLED")
          ?._count.status || 0,
    },
    {
      name: "Clinician Canceled",
      value:
        appointmentStatusCounts.find((s) => s.status === "CLINICIAN_CANCELLED")
          ?._count.status || 0,
    },
  ];

  const totalAppointments = appointmentData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // Get notes breakdown by status
  const notesStatusCounts = await prisma.surveyAnswers.groupBy({
    by: ["status"],
    where: {
      assigned_at: { gte: startDate, lte: endDate },
    },
    _count: {
      status: true,
    },
  });

  // Format notes data for charts
  const notesData = [
    {
      name: "Assigned",
      value:
        notesStatusCounts.find((s) => s.status === "ASSIGNED")?._count.status ||
        0,
    },
    {
      name: "In Progress",
      value:
        notesStatusCounts.find((s) => s.status === "IN_PROGRESS")?._count
          .status || 0,
    },
    {
      name: "Completed",
      value:
        notesStatusCounts.find((s) => s.status === "COMPLETED")?._count
          .status || 0,
    },
    {
      name: "Submitted",
      value:
        notesStatusCounts.find((s) => s.status === "SUBMITTED")?._count
          .status || 0,
    },
  ];

  const totalNotes = notesData.reduce((sum, item) => sum + item.value, 0);

  // Outstanding balances calculation
  const outstandingResult = await prisma.invoice.aggregate({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
    },
    _sum: {
      amount: true,
    },
  });

  const totalPaidResult = await prisma.payment.aggregate({
    where: {
      Invoice: {
        status: { in: ["SENT", "OVERDUE"] },
      },
    },
    _sum: {
      amount: true,
    },
  });

  const uninvoicedResult = await prisma.invoice.aggregate({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
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

  return NextResponse.json({
    income: totalIncome,
    incomeChart: incomeData,
    outstanding,
    uninvoiced,
    appointments: totalAppointments,
    appointmentsChart: appointmentData,
    notes: totalNotes,
    notesChart: notesData,
  });
});
