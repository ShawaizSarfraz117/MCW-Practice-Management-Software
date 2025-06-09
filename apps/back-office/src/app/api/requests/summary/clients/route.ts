import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";

// GET - Retrieve client summary counts
export async function GET(_request: NextRequest) {
  try {
    logger.info("Fetching client summary counts");

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    // Count prospective clients (is_active = false, is_waitlist = false)
    const prospectiveClientsCount = await prisma.client.count({
      where: {
        is_active: false,
        is_waitlist: false,
        ClinicianClient: {
          some: {
            clinician_id: clinicianId,
          },
        },
      },
    });

    // Count active clients (is_active = true)
    const activeClientsCount = await prisma.client.count({
      where: {
        is_active: true,
        ClinicianClient: {
          some: {
            clinician_id: clinicianId,
          },
        },
      },
    });

    logger.info(
      {
        prospectiveClientsCount,
        activeClientsCount,
      },
      "Client summary counts retrieved successfully",
    );

    return NextResponse.json({
      prospectiveClientsCount,
      activeClientsCount,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching client summary counts");
    return NextResponse.json(
      { error: "Failed to fetch client summary counts" },
      { status: 500 },
    );
  }
}
