import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { z } from "zod";

const licensePayload = z.object({
  license_type: z.string().max(100).optional().nullable(),
  license_number: z.string().max(50).optional().nullable(),
  expiration_date: z.date().optional().nullable(),
  state: z.string().max(50).optional().nullable(),
});

// PUT route to add or update licenses
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body
    const validationResult = licensePayload.safeParse(data);
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

    if (!existingClinicalInfo) {
      return NextResponse.json(
        { error: "Clinical information not found" },
        { status: 404 },
      );
    }

    // Create or update licenses
    const newLicense = await prisma.license.create({
      data: {
        clinical_info_id: existingClinicalInfo.id, // Link to clinical info
        license_type: validationResult.data.license_type ?? "",
        license_number: validationResult.data.license_number ?? "",
        expiration_date: validationResult.data.expiration_date ?? new Date(),
        state: validationResult.data.state ?? "",
      },
    });

    return NextResponse.json(newLicense);
  } catch (error) {
    console.error("Error updating licenses:", error);
    return NextResponse.json(
      { error: "Failed to update licenses" },
      { status: 500 },
    );
  }
}

// GET route to fetch licenses for a specific clinical info
export async function GET() {
  try {
    const session = await getServerSession(backofficeAuthOptions);
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

    const licenses = await prisma.license.findMany({
      where: {
        clinical_info_id: clinicalInfo.id, // Fetch licenses linked to the clinical info
      },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}
