import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// POST - Create a new location
export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    const locationSchema = z.object({
      name: z.string().min(1, "Name is required"),
      address: z.string().min(1, "Address is required"),
      is_active: z.boolean().optional().default(true),
    });

    const parseResult = locationSchema.safeParse(rawData);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parseResult.error.issues },
        { status: 400 },
      );
    }

    const data = parseResult.data as z.infer<typeof locationSchema>;

    // Validate required fields
    if (!data.name || !data.address) {
      return NextResponse.json(
        { error: "Missing required fields: name and address are required" },
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

    logger.info(`Created new location with ID: ${newLocation.id}`);
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    logger.error(error as Error, "Error creating location");
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}
