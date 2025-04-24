import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@mcw/database";
import { z } from "zod";

// Schema for validating availability update data
const updateAvailabilitySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional(),
});

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

  // Check for overlapping availability slots
  const overlappingSlot = await prisma.availability.findFirst({
    where: {
      clinician_id: clinicianId,
      id: { not: excludeId },
      OR: [
        {
          AND: [
            { start_time: { lte: startTime } },
            { end_time: { gt: startTime } },
          ],
        },
        {
          AND: [
            { start_time: { lt: endTime } },
            { end_time: { gte: endTime } },
          ],
        },
        {
          AND: [
            { start_time: { gte: startTime } },
            { end_time: { lte: endTime } },
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
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session) {
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
      : existingAvailability.start_time;
    const endTime = validatedData.endTime
      ? new Date(validatedData.endTime)
      : existingAvailability.end_time;

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
        start_time: startTime,
        end_time: endTime,
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

// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession();
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { id } = params;

//     // Check if the availability exists
//     const availability = await prisma.availability.findUnique({
//       where: { id },
//     });

//     if (!availability) {
//       return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
//     }

//     // Delete the availability
//     await prisma.availability.delete({
//       where: { id },
//     });

//     return NextResponse.json({ message: 'Availability deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting availability:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete availability' },
//       { status: 500 }
//     );
//   }
// }
