import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";
import { getBackOfficeSession } from "@/utils/helpers";

// GET - Retrieve attendance data with filters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const clientGroupId = searchParams.get("clientGroupId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  // Validate required parameters
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  try {
    // Build where clause for appointments
    const appointmentWhere: Prisma.AppointmentWhereInput = {
      start_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      type: "APPOINTMENT", // Only show client appointments, not internal events
    };

    // Add status filter if provided
    if (status && status !== "all") {
      appointmentWhere.status = status.toUpperCase();
    }

    // Add client group filter if provided
    if (clientGroupId && clientGroupId !== "all") {
      appointmentWhere.client_group_id = clientGroupId;
    }

    // Fetch appointments with client group data
    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        ClientGroup: {
          include: {
            ClientGroupMembership: {
              include: {
                Client: {
                  select: {
                    legal_first_name: true,
                    legal_last_name: true,
                    preferred_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        start_date: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.appointment.count({
      where: appointmentWhere,
    });

    // Get unique client groups count for summary
    const uniqueClientGroups = await prisma.appointment.findMany({
      where: appointmentWhere,
      select: {
        client_group_id: true,
      },
      distinct: ["client_group_id"],
    });

    // Get unique statuses count for summary
    const uniqueStatuses = await prisma.appointment.findMany({
      where: appointmentWhere,
      select: {
        status: true,
      },
      distinct: ["status"],
    });

    const summary = {
      totalClients: uniqueClientGroups.length,
      totalAppointments: totalCount,
      totalStatuses: uniqueStatuses.length,
    };

    return NextResponse.json({
      data: appointments,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error({
      message: "Error fetching attendance data",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 },
    );
  }
});
