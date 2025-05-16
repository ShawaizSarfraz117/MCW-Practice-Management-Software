import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          UserRole: {
            include: {
              Role: {
                include: {
                  RolePermission: {
                    include: {
                      Permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return NextResponse.json(user);
    }
  } catch (error) {
    logger.error({ error }, "Failed to fetch team members");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
