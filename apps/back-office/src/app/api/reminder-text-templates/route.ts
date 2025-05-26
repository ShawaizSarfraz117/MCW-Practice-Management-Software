import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET - Retrieve all reminder text templates with optional type filtering
 * @param request - The NextRequest object
 * @returns - JSON response with reminder text templates or error
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const templates = await prisma.reminderTextTemplates.findMany({
      where: type ? { type } : undefined,
      orderBy: {
        type: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to fetch reminder text templates: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to fetch reminder text templates" },
      { status: 500 },
    );
  }
}
