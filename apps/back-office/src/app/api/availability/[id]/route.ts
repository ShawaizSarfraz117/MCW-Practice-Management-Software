import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { backofficeAuthOptions } from "@/api/auth/[...nextauth]/auth-options";
import { logger } from "@mcw/logger";

// Schema for validating availability update data
const updateAvailabilitySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional(),
});

// Helper function to check authentication
async function isAuthenticated(request: NextRequest) {
  // @ts-expect-error - nextauth property may be added by tests
  if (request.nextauth?.token) {
    return true;
  }

  try {
    const session = await getServerSession(backofficeAuthOptions);
    return !!session?.user;
  } catch (error) {
    logger.error({ error }, "Error checking authentication");
    return false;
  }
}

// Helper function to validate time slots
const validateTimeSlot = async (
  clinicianId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string,
) => {
  if (endTime <= startTime) {
    return { isValid: false, error: "End time must be after start time" };
  }

  // Check for overlapping availability slots using start_date and end_date
  const overlappingSlot = await prisma.availability.findFirst({
    where: {
      clinician_id: clinicianId,
      id: { not: excludeId },
      OR: [
        {
          AND: [
            { start_date: { lte: startTime } },
            { end_date: { gt: startTime } },
          ],
        },
        {
          AND: [
            { start_date: { lt: endTime } },
            { end_date: { gte: endTime } },
          ],
        },
        {
          AND: [
            { start_date: { gte: startTime } },
            { end_date: { lte: endTime } },
          ],
        },
      ],
    },
  });

  if (overlappingSlot) {
    return {
      isValid: false,
      error: "Time slot overlaps with existing availability",
    };
  }

  return { isValid: true };
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateAvailabilitySchema.parse(body);

    // Get the existing availability slot
    const existingAvailability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!existingAvailability) {
      return NextResponse.json(
        { error: "Availability not found" },
        { status: 404 },
      );
    }

    const startTime = validatedData.startTime
      ? new Date(validatedData.startTime)
      : existingAvailability.start_date;
    const endTime = validatedData.endTime
      ? new Date(validatedData.endTime)
      : existingAvailability.end_date;

    // Validate time slot if times are being updated
    if (validatedData.startTime || validatedData.endTime) {
      const validation = await validateTimeSlot(
        existingAvailability.clinician_id,
        startTime,
        endTime,
        id,
      );
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const updatedAvailability = await prisma.availability.update({
      where: { id },
      data: {
        start_date: startTime,
        end_date: endTime,
        is_recurring:
          validatedData.isRecurring ?? existingAvailability.is_recurring,
        recurring_rule:
          validatedData.recurringRule ?? existingAvailability.recurring_rule,
      },
    });

    return NextResponse.json(updatedAvailability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 },
    );
  }
}
