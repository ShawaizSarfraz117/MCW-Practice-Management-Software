import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

const clinicalInfoPayload = z.object({
  speciality: z.string().max(100).optional().nullable(),
  taxonomyCode: z.string().max(50).optional().nullable(),
  NPInumber: z.number().optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body
    const validationResult = clinicalInfoPayload.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }

    // Check if clinical info exists
    const existingClinicalInfo = await prisma.clinicalInfo.findFirst({
      where: {
        user_id: session.user.id,
      },
    });

    if (existingClinicalInfo) {
      // Update existing clinical info
      const updatedClinicalInfo = await prisma.clinicalInfo.updateMany({
        where: { user_id: session.user.id },
        data: {
          speciality: validationResult.data.speciality ?? undefined,
          taxonomy_code: validationResult.data.taxonomyCode ?? undefined,
          NPI_number: validationResult.data.NPInumber ?? undefined,
        },
      });

      return NextResponse.json(updatedClinicalInfo);
    } else {
      // Insert new clinical info
      const newClinicalInfo = await prisma.clinicalInfo.create({
        data: {
          user_id: session.user.id,
          speciality: validationResult.data.speciality ?? "",
          taxonomy_code: validationResult.data.taxonomyCode ?? "",
          NPI_number: validationResult.data.NPInumber ?? 0,
        },
      });

      return NextResponse.json(newClinicalInfo);
    }
  } catch (error) {
    console.error("Error updating clinical information:", error);
    return NextResponse.json(
      { error: "Failed to update clinical information" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicalInfo = await prisma.clinicalInfo.findFirst({
      where: {
        user_id: session.user.id,
      },
    });

    if (!clinicalInfo) {
      return NextResponse.json(
        { error: "Clinical information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(clinicalInfo);
  } catch (error) {
    console.error("Error fetching clinical information:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinical information" },
      { status: 500 },
    );
  }
}
