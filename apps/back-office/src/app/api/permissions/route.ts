import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";

/**
 * GET handler for fetching all permissions
 * Optionally filters by role or permission name if query parameters are provided
 */
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get("roleId");
    const permissionName = searchParams.get("name");

    // Base query conditions
    let where = {};

    // Add role filter if roleId is provided
    if (roleId) {
      where = {
        RolePermission: {
          some: {
            role_id: roleId,
          },
        },
      };
    }

    // Add name filter if permissionName is provided
    if (permissionName) {
      where = {
        ...where,
        name: {
          contains: permissionName,
        },
      };
    }

    // Fetch permissions with RolePermission relationships
    const permissions = await prisma.permission.findMany({
      where,
      include: {
        RolePermission: {
          include: {
            Role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Return the permissions
    return NextResponse.json(permissions);
  } catch (error: unknown) {
    // Log the error
    logger.error(
      {
        errorDetails: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to fetch permissions",
    );

    // Return error response
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}
