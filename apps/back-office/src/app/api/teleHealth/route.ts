import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { withErrorHandling } from "@mcw/utils";
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

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find or create a telehealth location
  let telehealthLocation = await prisma.location.findFirst({
    where: {
      name: "Telehealth",
      is_active: true,
    },
  });

  if (!telehealthLocation) {
    // Create a default telehealth location if it doesn't exist
    telehealthLocation = await prisma.location.create({
      data: {
        name: "Telehealth",
        address: "Virtual Location",
        street: "Virtual",
        city: "",
        state: "",
        zip: "",
        color: "#10b981", // Green color for telehealth
        is_active: true,
      },
    });
  }

  return NextResponse.json({
    location: telehealthLocation,
  });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  // Update location details
  const updatedLocation = await prisma.location.update({
    where: { id: locationId },
    data: {
      name: officeName,
      address: address,
      street: street,
      city: city || "",
      state: state || "",
      zip: zip || "",
      color: color || existingLocation.color,
      is_active: true,
    },
  });

  return NextResponse.json({
    location: updatedLocation,
  });
});
