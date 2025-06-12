import { NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET() {
  try {
    logger.info("Fetching all reminder text templates");

    const templates = await prisma.reminderTextTemplates.findMany({
      orderBy: { type: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error: unknown) {
    logger.error(
      {
        errorDetails: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "Error fetching reminder text templates",
    );

    return NextResponse.json(
      { error: "Failed to fetch reminder text templates" },
      { status: 500 },
    );
  }
}
