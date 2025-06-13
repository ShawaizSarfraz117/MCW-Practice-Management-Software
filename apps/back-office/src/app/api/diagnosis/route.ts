import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let whereCondition = {};

    if (search) {
      whereCondition = {
        OR: [
          { code: { contains: search } },
          { description: { contains: search } },
        ],
      };
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: whereCondition,
      take: limit,
      orderBy: { code: "asc" },
    });

    return NextResponse.json(diagnoses);
  } catch (error) {
    logger.error({ message: "Error fetching diagnoses:", error });
    return NextResponse.json(
      { error: "Failed to fetch diagnoses" },
      { status: 500 },
    );
  }
}
