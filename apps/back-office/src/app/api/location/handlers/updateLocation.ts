import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { LocationData } from "../types";

// PUT - Update an existing location
export async function PUT(request: NextRequest) {
  try {
    const data = (await request.json()) as LocationData;

    if (!data.id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: data.id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address,
        is_active: data.is_active,
      },
    });

    logger.info(`Updated location with ID: ${updatedLocation.id}`);
    return NextResponse.json(updatedLocation);
  } catch (error) {
    logger.error(error as Error, "Error updating location");
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 },
    );
  }
}
