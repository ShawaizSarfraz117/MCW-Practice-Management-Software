import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";
import { withErrorHandling } from "@mcw/utils";

const clinicalInfoPayload = z.object({
  speciality: z.string().max(250).optional().nullable(),
  taxonomy_code: z.string().max(250).optional().nullable(),
  NPI_number: z.string().max(250).optional().nullable(),
});

export const dynamic = "force-dynamic";

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isClinician, clinicianId } = await getClinicianInfo();
  if (!isClinician || !clinicianId) {
    return NextResponse.json(
      { error: "Clinician not found for user" },
      { status: 400 }, // Changed from 404 to 400 (Bad Request) to avoid confusion
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
});

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isClinician, clinicianId } = await getClinicianInfo();
  if (!isClinician || !clinicianId) {
    return NextResponse.json(
      { error: "Clinician not found for user" },
      { status: 400 }, // Changed from 404 to 400 (Bad Request) to avoid confusion
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
});
