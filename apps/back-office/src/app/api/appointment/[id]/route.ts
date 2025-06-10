import { NextRequest, NextResponse } from "next/server";

import { prisma, Prisma } from "@mcw/database";
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
    const { fee, writeOff, serviceId, start_date, end_date } = data;

    // Build update data object
    const updateData: Prisma.AppointmentUpdateInput = {};

    // Handle date/time updates
    if (start_date) {
      updateData.start_date = new Date(start_date);
    }
    if (end_date) {
      updateData.end_date = new Date(end_date);
    }

    // Handle fee and service updates
    if (serviceId !== undefined) {
      updateData.service_id = serviceId;
    }

    // Handle financial updates only if fee or writeOff are provided
    if (fee !== undefined || writeOff !== undefined) {
      const currentFee = parseFloat(
        appointment.appointment_fee?.toString() || "0",
      );
      const currentWriteOff = parseFloat(
        appointment.write_off?.toString() || "0",
      );
      const newFee = fee !== undefined ? parseFloat(fee) : currentFee;
      const newWriteOff =
        writeOff !== undefined ? parseFloat(writeOff) : currentWriteOff;

      if (currentFee !== newFee || currentWriteOff !== newWriteOff) {
        // Calculate differences
        const feeDiff = newFee - currentFee;
        const writeOffDiff = newWriteOff - currentWriteOff;

        const adjustmentAmount = appointment.adjustable_amount
          ? Number(appointment.adjustable_amount) + (feeDiff - writeOffDiff)
          : feeDiff - writeOffDiff;

        updateData.appointment_fee = newFee;
        updateData.write_off = newWriteOff;
        updateData.adjustable_amount = adjustmentAmount;
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: id as string },
      data: updateData,
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
