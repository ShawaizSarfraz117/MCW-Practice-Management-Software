import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// GET - Retrieve all locations or a specific location by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      logger.info(`Retrieving location with ID: ${id}`);
      const location = await prisma.location.findUnique({
        where: { id },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(location);
    } else {
      logger.info("Retrieving all locations");
      const locations = await prisma.location.findMany({});

      return NextResponse.json(locations);
    }
  } catch (error) {
    logger.error(error as Error, "Error fetching locations");
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}
