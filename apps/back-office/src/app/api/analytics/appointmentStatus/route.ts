import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma, Payment } from "@prisma/client";

// Types for query parameters
type QueryParams = {
  startDate: string;
  endDate: string;
  clientId?: string;
  noteStatus?: "all" | "with_note" | "no_note";
  status?: string;
  page?: number;
  pageSize?: number;
};

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clientId = searchParams.get("clientId");
    const noteStatus = (searchParams.get("noteStatus") ||
      "all") as QueryParams["noteStatus"];
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 },
      );
    }

    // Build where clause for appointments
    const where: Prisma.AppointmentWhereInput = {
      start_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (clientId && clientId !== "all") {
      where.ClientGroup = {
        id: clientId,
      };
    }

    if (status !== "all") {
      where.status = status.toUpperCase();
    }

    // Fetch appointments with related data
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        ClientGroup: {
          select: {
            name: true,
          },
        },
        Invoice: {
          include: {
            Payment: true,
          },
        },
        SurveyAnswers: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        start_date: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get total count for pagination
    const total = await prisma.appointment.count({ where });

    // Map appointments to response format
    const data = appointments
      .map((appt) => {
        const invoice = appt.Invoice?.[0];
        const payments = invoice?.Payment || [];
        const totalPaid = payments.reduce(
          (sum: number, payment: Payment) =>
            sum + (payment.status === "Completed" ? Number(payment.amount) : 0),
          0,
        );

        const hasNote = appt.SurveyAnswers.length > 0;
        const progressNoteStatus = hasNote ? "COMPLETED" : "NO NOTE";

        // Apply note status filter
        if (
          (noteStatus === "with_note" && !hasNote) ||
          (noteStatus === "no_note" && hasNote)
        ) {
          return null;
        }

        const totalFee = Number(invoice?.amount || 0);
        const unpaidAmount = totalFee - totalPaid;

        return {
          id: appt.id,
          dateOfService: appt.start_date,
          client: appt.ClientGroup?.name || "",
          units: 1,
          totalFee: `$${totalFee}`,
          progressNoteStatus,
          status: appt.status || "SHOW",
          invoiceStatus: invoice?.status || "UNPAID",
          charge: `$${totalFee}`,
          uninvoiced: invoice ? "--" : `$${totalFee}`,
          paid: totalPaid > 0 ? `$${totalPaid}` : "--",
          unpaid: unpaidAmount > 0 ? `$${unpaidAmount}` : "--",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch appointment status analytics");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
