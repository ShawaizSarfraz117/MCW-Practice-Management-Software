import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";

// Validation schema for the request body
const updatePermissionSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  weeklyDisplay: z.enum(["Show full week", "Show custom hours"]),
  cancellationHours: z.number().nullable(),
});

export async function GET() {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await prisma.clientPortalPermission.findFirst();

    if (!permissions) {
      // Create default permissions if none exist
      const defaultPermissions = await prisma.clientPortalPermission.create({
        data: {
          startTime: "09:00",
          endTime: "17:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });
      return NextResponse.json(defaultPermissions);
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error fetching client portal permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePermissionSchema.parse(body);

    // Validate that end time is after start time
    const [startHour, startMinute] = validatedData.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = validatedData.endTime.split(":").map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (endTimeInMinutes <= startTimeInMinutes) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    const existingPermission = await prisma.clientPortalPermission.findFirst();

    if (!existingPermission) {
      const newPermission = await prisma.clientPortalPermission.create({
        data: validatedData,
      });
      return NextResponse.json({
        message: "Settings created successfully",
        data: newPermission,
      });
    }

    const updatedPermission = await prisma.clientPortalPermission.update({
      where: { id: existingPermission.id },
      data: validatedData,
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      data: updatedPermission,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating client portal permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
