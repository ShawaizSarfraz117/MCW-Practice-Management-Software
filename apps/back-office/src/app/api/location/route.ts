import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET() {
  try {
    logger.info("Retrieving all locations");
    const locations = await prisma.location.findMany({});

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

// POST - Create a new location
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create new location
    const newLocation = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        is_active: data.is_active ?? true,
      },
    });

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing location
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

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

    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a location
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

    // Instead of deleting, set is_active to false
    const deactivatedLocation = await prisma.location.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({
      message: "Location deactivated successfully",
      location: deactivatedLocation,
    });
  } catch (error) {
    console.error("Error deactivating location:", error);
    return NextResponse.json(
      { error: "Failed to deactivate location" },
      { status: 500 },
    );
  }
}
