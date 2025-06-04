import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";

const clinicalInfoPayload = z.object({
  speciality: z.string().max(250).optional().nullable(),
  taxonomy_code: z.string().max(250).optional().nullable(),
  NPI_number: z.string().max(250).optional().nullable(),
});

export const dynamic = "force-dynamic";
export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isClinician, clinicianId } = await getClinicianInfo();
    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found for user" },
        { status: 404 },
      );
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

    // Update clinician info
    const updatedClinician = await prisma.clinician.update({
      where: { id: clinicianId },
      data: {
        speciality: validationResult.data.speciality ?? null,
        taxonomy_code: validationResult.data.taxonomy_code ?? null,
        NPI_number: validationResult.data.NPI_number ?? null,
      },
    });

    return NextResponse.json(updatedClinician);
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

    const { isClinician, clinicianId } = await getClinicianInfo();
    if (!isClinician || !clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found for user" },
        { status: 404 },
      );
    }

    const clinician = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      select: {
        id: true,
        speciality: true,
        taxonomy_code: true,
        NPI_number: true,
      },
    });

    if (!clinician) {
      return NextResponse.json(
        { error: "Clinical information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(clinician);
  } catch (error) {
    console.error("Error fetching clinical information:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinical information" },
      { status: 500 },
    );
  }
}
