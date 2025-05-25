import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// Allowed status values
const StatusEnum = z.enum(["accepted", "rejected"]);

const BodySchema = z.object({
  status: StatusEnum,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing requestId" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parseResult = BodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.errors },
        { status: 400 },
      );
    }
    const { status } = parseResult.data;

    // Check if appointment request exists
    const existing = await prisma.appointmentRequests.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Appointment request not found" },
        { status: 404 },
      );
    }

    // Update status only
    const updated = await prisma.appointmentRequests.update({
      where: { id: requestId },
      data: {
        status,
      },
    });

    logger.info({
      msg: "Updated appointment request status",
      requestId,
      status,
    });

    return NextResponse.json({
      message: "Status updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    logger.error(
      `Failed to update appointment request status: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      { error: "Failed to update appointment request status" },
      { status: 500 },
    );
  }
}
