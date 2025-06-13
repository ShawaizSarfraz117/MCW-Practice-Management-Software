import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const isContactOnly = searchParams.get("isContactOnly");
    const includeProfile = searchParams.get("includeProfile");
    const includeAdress = searchParams.get("includeAdress");
    if (id) {
      logger.info(`Retrieving client group with id: ${id}`);
      const clientGroup = await prisma.clientGroup.findUnique({
        where: { id },
        include: {
          Clinician: {
            include: {
              ClinicianLocation: true,
            },
          },
          ClientGroupMembership: {
            orderBy: {
              created_at: "asc",
            },
            where: {
              is_contact_only: isContactOnly === "true",
            },
            include: {
              Client: {
                include: {
                  ClientContact: true,
                  ClientProfile: includeProfile === "true",
                  ClientAdress: includeAdress === "true",
                },
              },
            },
          },
        },
      });

      if (!clientGroup) {
        return NextResponse.json(
          { error: "Client group not found" },
          { status: 404 },
        );
      }

      // Return consistent paginated format even for single items
      return NextResponse.json({
        data: clientGroup,
      });
    }
  } catch (error) {
    console.error("Error fetching client groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch client groups" },
      { status: 500 },
    );
  }
}
