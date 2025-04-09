import { NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET() {
  try {
    logger.info("Retrieving all client groups");
    const clientGroups = await prisma.clientGroup.findMany({});

    return NextResponse.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch client groups" },
      { status: 500 },
    );
  }
}
