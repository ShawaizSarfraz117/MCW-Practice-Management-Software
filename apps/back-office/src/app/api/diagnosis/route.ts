import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";

export async function GET(_request: NextRequest) {
  try {
    const diagnosis = await prisma.diagnosis.findMany({});

    return NextResponse.json({ data: diagnosis });
  } catch (error) {
    console.error("Error fetching diagnosis:", error);
    return NextResponse.json(
      { error: "Failed to fetch diagnosis" },
      { status: 500 },
    );
  }
}
