import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { z } from "zod";

const updateLocationSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  color: z.string().optional(),
});

export async function GET() {
  try {
    // Get clinician info from the session
    const { isClinician, clinicianId } = await getClinicianInfo();

    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "User is not a clinician" },
        { status: 403 },
      );
    }

    // Get clinician with their location details
    const clinicianWithLocation = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      include: {
        ClinicianLocation: {
          include: {
            Location: true,
          },
        },
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!clinicianWithLocation) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 404 },
      );
    }

    // Get the primary location if it exists, otherwise get the first location
    const primaryLocation =
      clinicianWithLocation.ClinicianLocation.find((cl) => cl.is_primary)
        ?.Location || clinicianWithLocation.ClinicianLocation[0]?.Location;

    if (!primaryLocation) {
      return NextResponse.json(
        { error: "TeleHealth location not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      clinician: {
        id: clinicianWithLocation.id,
        firstName: clinicianWithLocation.first_name,
        lastName: clinicianWithLocation.last_name,
        email: clinicianWithLocation.User.email,
      },
      location: primaryLocation,
    });
  } catch (error) {
    console.error("Error fetching telehealth details:", error);
    return NextResponse.json(
      { error: "Failed to fetch telehealth details" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get clinician info from the session
    const { isClinician, clinicianId } = await getClinicianInfo();

    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "User is not a clinician" },
        { status: 403 },
      );
    }

    const data = await request.json();
    // Validate request body
    const validationResult = updateLocationSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Incomplete or invalid data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const {
      locationId,
      name: officeName,
      address,
      street: street,
      city,
      state,
      zip,
      color,
    } = validationResult.data;

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Update location details
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        name: officeName,
        address: address,
        street: street,
        city,
        state,
        zip,
        color,
        is_active: true,
      },
    });

    return NextResponse.json({
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error updating telehealth location:", error);
    return NextResponse.json(
      { error: "Failed to update telehealth location" },
      { status: 500 },
    );
  }
}
