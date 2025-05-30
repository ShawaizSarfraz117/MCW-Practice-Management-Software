import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";

// GET - Retrieve document summary counts
export async function GET(_request: NextRequest) {
  try {
    logger.info("Fetching document summary counts");

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    // Get current date for expiry comparison
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    // Count documents expiring soon (within 30 days and not completed)
    const expiringSoonCount = await prisma.surveyAnswers.count({
      where: {
        expiry_date: {
          lte: thirtyDaysFromNow,
          gte: currentDate,
        },
        status: {
          not: "completed",
        },
        Client: {
          ClinicianClient: {
            some: {
              clinician_id: clinicianId,
            },
          },
        },
      },
    });

    // Count incomplete documents (status indicates incomplete)
    const documentsIncompleteCount = await prisma.surveyAnswers.count({
      where: {
        OR: [
          { status: "sent" },
          { status: "pending" },
          { status: "in_progress" },
          {
            AND: [{ content: null }, { status: { not: "completed" } }],
          },
        ],
        Client: {
          ClinicianClient: {
            some: {
              clinician_id: clinicianId,
            },
          },
        },
      },
    });

    // Count completed documents
    const documentsCompletedCount = await prisma.surveyAnswers.count({
      where: {
        status: "completed",
        Client: {
          ClinicianClient: {
            some: {
              clinician_id: clinicianId,
            },
          },
        },
      },
    });

    logger.info(
      {
        expiringSoonCount,
        documentsIncompleteCount,
        documentsCompletedCount,
      },
      "Document summary counts retrieved successfully",
    );

    return NextResponse.json({
      expiringSoonCount,
      documentsIncompleteCount,
      documentsCompletedCount,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching document summary counts");
    return NextResponse.json(
      { error: "Failed to fetch document summary counts" },
      { status: 500 },
    );
  }
}
