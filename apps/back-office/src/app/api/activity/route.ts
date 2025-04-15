import { prisma } from "@mcw/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const audits = await prisma.audit.findMany({
      include: {
        Client: {
          select: {
            legal_first_name: true,
            legal_last_name: true,
          },
        },
        User: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
