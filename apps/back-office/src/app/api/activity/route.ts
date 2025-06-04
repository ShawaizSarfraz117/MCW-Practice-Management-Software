import { prisma } from "@mcw/database";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = new URL(request.url).searchParams;
    const eventType = searchParams.get("eventType");
    const userId = searchParams.get("userId");
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build filters object
    const filters: Prisma.AuditWhereInput = {};

    // Add filters based on query parameters
    if (eventType) filters.event_type = eventType;
    if (userId) filters.user_id = userId;
    if (clientId) filters.client_id = clientId;

    // Add date range filter if both dates are provided
    if (startDate && endDate) {
      filters.datetime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get total count with filters
    const total = await prisma.audit.count({
      where: filters,
    });

    const audits = await prisma.audit.findMany({
      where: filters,
      include: {
        Client: {
          select: {
            legal_first_name: true,
            legal_last_name: true,
          },
        },
        User: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        datetime: "desc",
      },
      skip,
      take: limit,
    });

    // Transform the response to use lowercase 'id' instead of 'Id'
    const transformedAudits = audits.map((audit) => {
      const { Id, ...rest } = audit;
      return {
        id: Id,
        ...rest,
      };
    });

    return NextResponse.json({
      data: transformedAudits,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
