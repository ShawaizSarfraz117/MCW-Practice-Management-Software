import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@mcw/database";
import { Prisma } from "@prisma/client";
import { logger } from "@mcw/logger";

// Zod schema for query parameters
const querySchema = z.object({
  locationId: z.string().optional(),
  clientStatus: z.string().optional(),
  requestSource: z.string().optional(),
  expiringSoon: z.string().optional(), // expects 'true' or 'false'
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  searchTerm: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const parseResult = querySchema.safeParse(query);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.errors,
        },
        { status: 400 },
      );
    }
    const {
      locationId,
      clientStatus,
      requestSource,
      expiringSoon,
      page = "1",
      limit = "20",
      sortBy = "received_date",
      sortOrder = "desc",
      searchTerm,
    } = parseResult.data;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const orderBy = { [sortBy]: sortOrder };

    // Build where clause
    const where: Prisma.AppointmentRequestsWhereInput = {};
    if (clientStatus) {
      where.status = clientStatus;
    }
    if (requestSource) {
      where.appointment_for = requestSource;
    }
    if (searchTerm) {
      where.OR = [
        { reasons_for_seeking_care: { contains: searchTerm } },
        { mental_health_history: { contains: searchTerm } },
        { additional_notes: { contains: searchTerm } },
      ];
    }
    if (expiringSoon === "true") {
      // Example: expiring soon = end_time within next 48 hours
      const now = new Date();
      const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      where.end_time = { lte: soon, gte: now };
    }

    logger.info({
      msg: "Fetching appointment requests",
      filters: {
        locationId,
        clientStatus,
        requestSource,
        expiringSoon,
        searchTerm,
      },
      pagination: { page: pageNum, limit: limitNum },
      sort: { sortBy, sortOrder },
    });

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      prisma.appointmentRequests.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          RequestContactItems: true,
          PracticeService: true,
        },
      }),
      prisma.appointmentRequests.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: unknown) {
    logger.error(
      `Failed to fetch appointment requests: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      { error: "Failed to fetch appointment requests" },
      { status: 500 },
    );
  }
}
