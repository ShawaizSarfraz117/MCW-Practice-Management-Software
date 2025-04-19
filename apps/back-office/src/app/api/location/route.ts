import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET(request?: NextRequest) {
  try {
    // Check if request exists (to support tests that call GET without parameters)
    const searchParams = request?.nextUrl?.searchParams;
    const clinicianId = searchParams?.get("clinicianId");

    if (clinicianId) {
      logger.info(`Retrieving locations for clinician: ${clinicianId}`);

      // Get location IDs from clinicianLocation table for this clinician
      const clinicianLocations = await prisma.clinicianLocation.findMany({
        where: { clinician_id: clinicianId },
        select: { location_id: true },
      });

      // Extract location IDs
      const locationIds = clinicianLocations.map((cl) => cl.location_id);

      // If clinician has associated locations, fetch them
      if (locationIds.length > 0) {
        const locations = await prisma.location.findMany({
          where: { id: { in: locationIds } },
        });
        return NextResponse.json(locations);
      } else {
        // Return empty array if clinician has no locations
        return NextResponse.json([]);
      }
    } else {
      // Original behavior - return all locations
      logger.info("Retrieving all locations");
      const locations = await prisma.location.findMany({});
      return NextResponse.json(locations);
    }
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
