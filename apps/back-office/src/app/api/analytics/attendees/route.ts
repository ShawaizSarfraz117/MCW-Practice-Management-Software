import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";
import { getClinicianInfo } from "@/utils/helpers";

// GET - Retrieve attendance data with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clientGroupId = searchParams.get("clientGroupId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 },
      );
    }

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    // Build where clause for appointments
    const appointmentWhere: Prisma.AppointmentWhereInput = {
      start_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    // Add status filter if provided (single status as string)
    if (status && status !== "all") {
      appointmentWhere.status = status.toUpperCase();
    }

    // Add client group filter if provided
    if (clientGroupId && clientGroupId !== "all") {
      appointmentWhere.client_group_id = clientGroupId;
    }

    // Add clinician filter if available
    if (clinicianId) {
      appointmentWhere.clinician_id = clinicianId;
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

    // Return data as-is from Prisma
    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error fetching attendance data",
    );
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 },
    );
  }
}
