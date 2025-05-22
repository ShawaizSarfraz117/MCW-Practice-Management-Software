import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@mcw/database"; // Commented out as not used yet
import { logger } from "@mcw/logger";

// TODO: Implement GET handler
export async function GET(_request: NextRequest) {
  // Prefix with _ if not used immediately
  logger.info("GET /api/analytics/home called");
  // Placeholder response
  return NextResponse.json(
    { message: "GET /api/analytics/home not yet implemented." },
    { status: 501 },
  );
}
