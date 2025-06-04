import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { z } from "zod";

const billingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  type: z.enum(["business", "client"], {
    errorMap: () => ({ message: "Type must be either 'business' or 'client'" }),
  }),
});

export async function GET(request: NextRequest) {
  try {
    // Get clinician info from the session
    const { isClinician, clinicianId } = await getClinicianInfo();

    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "User is not a clinician" },
        { status: 403 },
      );
    }

    // Get type from query params if specified
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Build where clause based on type
    const where = {
      clinician_id: clinicianId,
      ...(type && ["business", "client"].includes(type) ? { type } : {}),
    };

    // Get clinician's billing addresses
    const billingAddresses = await prisma.billingAddress.findMany({
      where,
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        type: true,
      },
    });

    return NextResponse.json({ billingAddresses });
  } catch (error) {
    console.error("Error fetching billing addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = billingAddressSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { street, city, state, zip, type } = validationResult.data;

    // Check if address of this type already exists for the clinician
    const existingAddress = await prisma.billingAddress.findFirst({
      where: {
        clinician_id: clinicianId,
        type,
      },
    });

    if (existingAddress) {
      // Update existing address instead of returning error
      const updatedAddress = await prisma.billingAddress.update({
        where: { id: existingAddress.id },
        data: {
          street,
          city,
          state,
          zip,
        },
      });

      return NextResponse.json(
        {
          billingAddress: updatedAddress,
          message: `Existing ${type} billing address was updated`,
        },
        { status: 200 },
      );
    }

    // Create new billing address
    const newAddress = await prisma.billingAddress.create({
      data: {
        street,
        city,
        state,
        zip,
        type,
        clinician_id: clinicianId,
      },
    });

    return NextResponse.json({ billingAddress: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Error creating billing address:", error);
    return NextResponse.json(
      { error: "Failed to create billing address" },
      { status: 500 },
    );
  }
}
