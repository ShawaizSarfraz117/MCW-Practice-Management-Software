import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// PUT - Update an existing appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const id = params.id;
    const appointment = await prisma.appointment.findUnique({
      where: { id: id as string },
      include: { Invoice: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }
    const { fee, writeOff, serviceId } = data;

    if (
      parseFloat(appointment.appointment_fee?.toString() || "0") ===
        parseFloat(fee) &&
      parseFloat(appointment.write_off?.toString() || "0") ===
        parseFloat(writeOff)
    ) {
      const updatedAppointment = await prisma.appointment.update({
        where: { id: id as string },
        data: {
          service_id: serviceId,
        },
      });
      return NextResponse.json(updatedAppointment);
    }
    // Calculate differences
    const feeDiff = Number(fee) - Number(appointment.appointment_fee);
    const writeOffDiff = Number(writeOff) - Number(appointment.write_off);

    // const adjustmentAmount = feeDiff - writeOffDiff //prev formula
    const adjustmentAmount = appointment.adjustable_amount
      ? Number(appointment.adjustable_amount) + (feeDiff - writeOffDiff)
      : feeDiff - writeOffDiff;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: id as string },
      data: {
        appointment_fee: fee,
        write_off: writeOff,
        adjustable_amount: adjustmentAmount,
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    logger.error(error as Error, "Failed to update appointment");
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}
