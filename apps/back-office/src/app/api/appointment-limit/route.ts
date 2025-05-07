import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clinicianId = searchParams.get("clinicianId");
  const date = searchParams.get("date");

  if (!clinicianId || !date) {
    return NextResponse.json(
      { error: "Missing clinicianId or date" },
      { status: 400 },
    );
  }

  // Parse date and get start/end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const limitRecord = await prisma.appointmentLimit.findFirst({
    where: {
      clinician_id: clinicianId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return NextResponse.json({ limit: limitRecord?.max_limit ?? null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinician_id, date, max_limit } = body;

    if (!clinician_id || !date || typeof max_limit !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid clinician_id, date, or max_limit" },
        { status: 400 },
      );
    }

    const inputDate = new Date(date);

    const dayUTC = new Date(
      Date.UTC(
        inputDate.getUTCFullYear(),
        inputDate.getUTCMonth(),
        inputDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const existingLimit = await prisma.appointmentLimit.findUnique({
      where: {
        UQ_AppointmentLimit_Date_Clinician: {
          date: dayUTC,
          clinician_id,
        },
      },
    });

    let limitRecord;
    if (existingLimit) {
      // Update if exists
      limitRecord = await prisma.appointmentLimit.update({
        where: {
          id: existingLimit.id,
        },
        data: {
          max_limit,
        },
      });
    } else {
      // Create if not exists
      limitRecord = await prisma.appointmentLimit.create({
        data: {
          date: dayUTC,
          clinician_id,
          max_limit,
        },
      });
    }

    return NextResponse.json(limitRecord, {
      status: existingLimit ? 200 : 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to set appointment limit",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 },
    );
  }
}
