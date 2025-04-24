import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@mcw/database";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { z } from "zod";
// import { parseISO, isBefore, startOfDay } from 'date-fns';

// Define types for the availability data
interface AvailabilityInput {
  clinician_id: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  recurring_rule: string | null;
}

interface WhereClause {
  clinician_id?: string;
  start_time?: {
    gte?: Date;
  };
  end_time?: {
    lte?: Date;
  };
}

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Schema for validating availability data
const availabilitySchema = z.object({
  clinician_id: z.string().refine((val) => isValidUUID(val), {
    message: "Invalid UUID format for clinician_id",
  }),
  start_date: z.string().datetime({
    message: "Invalid datetime format for start_date",
  }),
  end_date: z.string().datetime({
    message: "Invalid datetime format for end_date",
  }),
  is_recurring: z.boolean().default(false),
  recurring_rule: z.string().nullable().optional(),
});

// // Helper function to parse recurring rule
// function parseRecurringRule(rule: string) {
//   const parts = rule.split(';');
//   const ruleObj: Record<string, string> = {};

//   parts.forEach(part => {
//     const [key, value] = part.split('=');
//     ruleObj[key] = value;
//   });

//   return {
//     frequency: ruleObj.FREQ,
//     interval: parseInt(ruleObj.INTERVAL || '1'),
//     byDay: ruleObj.BYDAY ? ruleObj.BYDAY.split(',') : [],
//     until: ruleObj.UNTIL ? parseISO(ruleObj.UNTIL.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : undefined,
//     count: ruleObj.COUNT ? parseInt(ruleObj.COUNT) : undefined,
//   };
// }

// Helper function to validate time slots
// const validateTimeSlot = async (clinicianId: string, startTime: Date, endTime: Date, excludeId?: string) => {
//   // Basic validation
//   if (!startTime || !endTime) {
//     return { isValid: false, error: 'Start time and end time are required' };
//   }

//   if (isBefore(endTime, startTime)) {
//     return { isValid: false, error: 'End time must be after start time' };
//   }

//   if (isBefore(startTime, startOfDay(new Date()))) {
//     return { isValid: false, error: 'Cannot create availability in the past' };
//   }

//   // Check for minimum and maximum duration
//   const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
//   if (durationInMinutes < 15) {
//     return { isValid: false, error: 'Availability duration must be at least 15 minutes' };
//   }
//   if (durationInMinutes > 720) { // 12 hours
//     return { isValid: false, error: 'Availability duration cannot exceed 12 hours' };
//   }

//   // Check for overlapping availability slots
//   const overlappingSlot = await prisma.availability.findFirst({
//     where: {
//       clinician_id: clinicianId,
//       id: { not: excludeId },
//       OR: [
//         {
//           AND: [
//             { start_time: { lte: startTime } },
//             { end_time: { gt: startTime } },
//           ],
//         },
//         {
//           AND: [
//             { start_time: { lt: endTime } },
//             { end_time: { gte: endTime } },
//           ],
//         },
//         {
//           AND: [
//             { start_time: { gte: startTime } },
//             { end_time: { lte: endTime } },
//           ],
//         },
//       ],
//     },
//   });

//   if (overlappingSlot) {
//     return { isValid: false, error: 'Time slot overlaps with existing availability' };
//   }

//   return { isValid: true };
// };

// Helper function to generate recurring availability slots
// async function generateRecurringSlots(
//   clinicianId: string,
//   startTime: Date,
//   endTime: Date,
//   recurringRule: string
// )
//  {
//   const rule = parseRecurringRule(recurringRule);
//   const slots: Array<{ start_time: Date; end_time: Date }> = [];
//   const duration = endTime.getTime() - startTime.getTime();
//   let currentDate = new Date(startTime);
//   let count = 0;

//   // Maximum number of occurrences to prevent infinite loops
//   const maxOccurrences = Math.min(rule.count || 52, 52); // Cap at 52 occurrences

//   while (count < maxOccurrences) {
//     if (rule.until && isAfter(currentDate, rule.until)) break;

//     if (rule.frequency === 'WEEKLY' && rule.byDay.length > 0) {
//       const currentWeek = new Date(currentDate);
//       const daysMap: Record<string, number> = {
//         SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
//       };

//       for (const day of rule.byDay) {
//         const dayNum = daysMap[day];
//         if (dayNum === undefined) continue;

//         const date = new Date(currentWeek);
//         date.setDate(date.getDate() + (dayNum + 7 - date.getDay()) % 7);

//         if (
//           !isBefore(date, startTime) &&
//           (!rule.until || !isAfter(date, rule.until))
//         ) {
//           const slotStart = new Date(date);
//           slotStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
//           const slotEnd = new Date(slotStart.getTime() + duration);

//           // Validate the slot
//           const validation = await validateTimeSlot(clinicianId, slotStart, slotEnd);
//           if (validation.isValid) {
//             slots.push({ start_time: slotStart, end_time: slotEnd });
//             count++;
//           }
//         }
//       }

//       // Move to next week
//       currentDate = addWeeks(currentDate, rule.interval);
//     } else if (rule.frequency === 'MONTHLY') {
//       const slotStart = new Date(currentDate);
//       const slotEnd = new Date(slotStart.getTime() + duration);

//       // Validate the slot
//       const validation = await validateTimeSlot(clinicianId, slotStart, slotEnd);
//       if (validation.isValid) {
//         slots.push({ start_time: slotStart, end_time: slotEnd });
//         count++;
//       }

//       // Move to next month
//       currentDate = addMonths(currentDate, rule.interval);
//     }

//     if (count >= maxOccurrences) break;
//   }

//   return slots;
// }

// GET - Fetch availabilities with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicianId = searchParams.get("clinicianId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: WhereClause = {};

    if (clinicianId) {
      if (!isValidUUID(clinicianId)) {
        return NextResponse.json(
          { error: "Invalid UUID format for clinicianId" },
          { status: 400 },
        );
      }
      where.clinician_id = clinicianId;
    }

    if (startDate && endDate) {
      where.start_time = {
        gte: new Date(startDate),
      };
      where.end_time = {
        lte: new Date(endDate),
      };
    }

    const availabilities = await prisma.availability.findMany({
      where,
      include: {
        Clinician: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        start_time: "asc",
      },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Error fetching availabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch availabilities" },
      { status: 500 },
    );
  }
}

// POST - Create new availability
export async function POST(req: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("Received data:", data); // Debug log

    try {
      // Validate the data using Zod schema
      const validatedData = availabilitySchema.parse(data) as AvailabilityInput;

      // First, verify that the clinician exists
      try {
        const clinician = await prisma.clinician.findFirst({
          where: {
            id: validatedData.clinician_id,
            is_active: true,
          },
        });

        if (!clinician) {
          return NextResponse.json(
            { error: "Active clinician not found" },
            { status: 404 },
          );
        }

        // Create the availability
        const availability = await prisma.availability.create({
          data: {
            clinician_id: validatedData.clinician_id,
            start_time: new Date(validatedData.start_date),
            end_time: new Date(validatedData.end_date),
            is_recurring: validatedData.is_recurring,
            recurring_rule: validatedData.recurring_rule,
          },
          include: {
            Clinician: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        return NextResponse.json(availability);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          {
            error: "Database error",
            details:
              dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    } catch (validationError) {
      console.error("Validation error:", validationError); // Debug log
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: validationError.errors },
          { status: 400 },
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      {
        error: "Failed to create availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - Update availability
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: "Valid availability ID (UUID) is required" },
        { status: 400 },
      );
    }

    const data = await req.json();

    try {
      // Validate the data using Zod schema
      const validatedData = availabilitySchema.parse(data) as AvailabilityInput;

      // First, verify that the clinician exists
      try {
        const clinician = await prisma.clinician.findFirst({
          where: {
            id: validatedData.clinician_id,
            is_active: true,
          },
        });

        if (!clinician) {
          return NextResponse.json(
            { error: "Active clinician not found" },
            { status: 404 },
          );
        }

        // Update the availability
        const availability = await prisma.availability.update({
          where: { id },
          data: {
            clinician_id: validatedData.clinician_id,
            start_time: new Date(validatedData.start_date),
            end_time: new Date(validatedData.end_date),
            is_recurring: validatedData.is_recurring,
            recurring_rule: validatedData.recurring_rule,
            updated_at: new Date(),
          },
          include: {
            Clinician: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        return NextResponse.json(availability);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          {
            error: "Database error",
            details:
              dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: validationError.errors },
          { status: 400 },
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 },
    );
  }
}

// DELETE - Delete availability
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: "Valid availability ID (UUID) is required" },
        { status: 400 },
      );
    }

    // Delete the availability
    await prisma.availability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 },
    );
  }
}
