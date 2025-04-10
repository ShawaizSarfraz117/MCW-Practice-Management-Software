import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// DELETE - Remove a location (soft delete by setting is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Instead of deleting, set is_active to false (soft delete)
    const deactivatedLocation = await prisma.location.update({
      where: { id },
      data: { is_active: false },
    });

    logger.info(`Deactivated location with ID: ${id}`);
    return NextResponse.json({
      message: "Location deactivated successfully",
      location: deactivatedLocation,
    });
  } catch (error) {
    logger.error(error as Error, "Error deactivating location");
    return NextResponse.json(
      { error: "Failed to deactivate location" },
      { status: 500 },
    );
  }
}
