import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

const licensePayload = z.object({
  license_type: z.string().max(100).optional().nullable(),
  license_number: z.string().max(50).optional().nullable(),
  expiration_date: z.date().optional().nullable(),
  state: z.string().max(50).optional().nullable(),
});

// PUT route to add or update licenses
export async function POST(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid request payload: expected an array of licenses" },
        { status: 422 },
      );
    }

    const existingClinicalInfo = await prisma.clinicalInfo.findFirst({
      where: { user_id: session.user.id },
    });

    if (!existingClinicalInfo) {
      return NextResponse.json(
        { error: "Clinical information not found" },
        { status: 404 },
      );
    }

    const createdLicenses = [];

    for (const license of data) {
      // Preprocess expiration_date to ensure it's a Date object
      const normalizedLicense = {
        ...license,
        expiration_date:
          typeof license.expiration_date === "string"
            ? new Date(license.expiration_date)
            : license.expiration_date,
      };

      const validationResult = licensePayload.safeParse(normalizedLicense);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationResult.error.format(),
          },
          { status: 422 },
        );
      }

      const created = await prisma.license.create({
        data: {
          clinical_info_id: existingClinicalInfo.id,
          license_type: validationResult.data.license_type ?? "",
          license_number: validationResult.data.license_number ?? "",
          expiration_date: validationResult.data.expiration_date ?? new Date(),
          state: validationResult.data.state ?? "",
        },
      });

      createdLicenses.push(created);
    }

    return NextResponse.json(createdLicenses);
  } catch (error) {
    console.error(
      "Error creating licenses:",
      (error as Error).message,
      (error as Error).stack,
    );
    return NextResponse.json(
      { error: "Failed to create licenses" },
      { status: 500 },
    );
  }
}

// PUT route to update a license
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.id || !data.clinical_info_id) {
      return NextResponse.json(
        { error: "License ID and clinical_info_id are required" },
        { status: 400 },
      );
    }

    // Check if license exists
    const existingLicense = await prisma.license.findFirst({
      where: {
        id: data.id,
        clinical_info_id: data.clinical_info_id,
      },
    });

    if (!existingLicense) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Preprocess expiration_date to ensure it's a Date object
    const normalizedLicense = {
      ...data,
      expiration_date:
        typeof data.expiration_date === "string"
          ? new Date(data.expiration_date)
          : data.expiration_date,
    };

    // Validate license data
    const validationResult = licensePayload.safeParse(normalizedLicense);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        { status: 422 },
      );
    }

    // Update license
    const updatedLicense = await prisma.license.update({
      where: { id: data.id },
      data: {
        license_type:
          validationResult.data.license_type ?? existingLicense.license_type,
        license_number:
          validationResult.data.license_number ??
          existingLicense.license_number,
        expiration_date:
          validationResult.data.expiration_date ??
          existingLicense.expiration_date,
        state: validationResult.data.state ?? existingLicense.state,
      },
    });

    return NextResponse.json(updatedLicense);
  } catch (error) {
    console.error("Error updating license:", error);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 },
    );
  }
}

// GET route to fetch licenses for a specific clinical info
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

    const licenses = await prisma.license.findMany({
      where: {
        clinical_info_id: clinicalInfo.id, // Fetch licenses linked to the clinical info
      },
    });
    if (licenses.length === 0) {
      return NextResponse.json(
        { error: "Licenses not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(licenses);
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}
