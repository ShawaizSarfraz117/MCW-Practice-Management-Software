import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@mcw/database";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicians = await prisma.clinician.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(clinicians);
  } catch (error) {
    console.error("Error fetching clinicians:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinicians" },
      { status: 500 },
    );
  }
}
