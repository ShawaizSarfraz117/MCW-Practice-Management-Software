import { NextResponse, NextRequest } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// TypeScript interface for authenticated request
interface AuthenticatedRequest extends NextRequest {
  nextauth?: {
    token?: unknown;
  };
}

// Validation schema for availability
const availabilitySchema = z.object({
  title: z.string().optional(),
  clinician_id: z.string().uuid(),
  allow_online_requests: z.boolean().default(false),
  location: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_recurring: z.boolean().default(false),
  recurring_rule: z.string().optional().nullable(),
});

export async function POST(request: AuthenticatedRequest) {
  try {
    if (!request.nextauth?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    // Convert string dates to Date objects and prepare data
    const data: Prisma.AvailabilityUncheckedCreateInput = {
      clinician_id: validatedData.clinician_id,
      title: validatedData.title || "",
      allow_online_requests: validatedData.allow_online_requests,
      location: validatedData.location,
      start_date: new Date(validatedData.start_date),
      end_date: new Date(validatedData.end_date),
      is_recurring: validatedData.is_recurring,
      recurring_rule: validatedData.recurring_rule || null,
    };

    const availability = await prisma.availability.create({
      data,
    });

    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(
        { error: error.errors },
        "Validation error while creating availability",
      );
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error creating availability");
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: AuthenticatedRequest) {
  try {
    if (!request.nextauth?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // If ID is provided, return single availability
    if (id) {
      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(availability);
    }

    // Otherwise, handle filtering logic for multiple availabilities
    const where: Prisma.AvailabilityWhereInput = {};

    if (clinicianId) {
      where.clinician_id = clinicianId;
    }

    if (startDate && endDate) {
      where.AND = [
        { start_date: { gte: new Date(startDate) } },
        { end_date: { lte: new Date(endDate) } },
      ];
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { start_date: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    logger.error({ error }, "Error fetching availabilities");
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: AuthenticatedRequest) {
  try {
    if (!request.nextauth?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = availabilitySchema.partial().parse(body);

    // Convert date strings to Date objects if they exist
    const data = {
      ...validatedData,
      updated_at: new Date(),
      recurring_rule: validatedData.recurring_rule || null,
    };

    const availability = await prisma.availability.update({
      where: { id },
      data,
    });

    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error updating availability");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: AuthenticatedRequest) {
  try {
    if (!request.nextauth?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    await prisma.availability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Error deleting availability");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
