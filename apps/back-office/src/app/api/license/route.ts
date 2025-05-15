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
    if (
      !data.clinical_info_id ||
      !data.licenses ||
      !Array.isArray(data.licenses)
    ) {
      return NextResponse.json(
        { error: "clinical_info_id and licenses array are required" },
        { status: 400 },
      );
    }

    // First get existing licenses for this clinical_info_id
    const existingLicenses = await prisma.license.findMany({
      where: {
        clinical_info_id: data.clinical_info_id,
      },
    });

    // Track IDs of existing licenses and submitted licenses to determine which to delete
    const existingLicenseIds = existingLicenses.map((license) => license.id);
    const submittedLicenseIds = data.licenses
      .filter((license: { id?: number }) => license.id)
      .map((license: { id?: number }) => Number(license.id));

    // Find IDs of licenses that need to be deleted (exist in DB but not in request)
    const licenseIdsToDelete = existingLicenseIds.filter(
      (id) => !submittedLicenseIds.includes(id),
    );

    // Delete licenses that are no longer in the array
    if (licenseIdsToDelete.length > 0) {
      await prisma.license.deleteMany({
        where: {
          id: { in: licenseIdsToDelete },
          clinical_info_id: data.clinical_info_id, // Extra safety check
        },
      });
    }

    // Process each license in the request (create or update)
    const results = await Promise.all(
      data.licenses.map(
        async (license: {
          id?: number;
          license_type?: string;
          license_number?: string;
          expiration_date?: string | Date;
          state?: string;
        }) => {
          // Preprocess expiration_date to ensure it's a Date object
          const normalizedLicense = {
            ...license,
            clinical_info_id: data.clinical_info_id,
            expiration_date:
              typeof license.expiration_date === "string"
                ? new Date(license.expiration_date)
                : license.expiration_date,
          };

          // Validate license data
          const validationResult = licensePayload.safeParse(normalizedLicense);
          if (!validationResult.success) {
            return {
              error: "Validation error",
              details: validationResult.error.format(),
              license: license,
            };
          }

          // If ID is provided, update existing license by ID
          if (license.id) {
            try {
              return await prisma.license.update({
                where: {
                  id: license.id,
                },
                data: {
                  license_type: license.license_type,
                  license_number: license.license_number,
                  expiration_date: normalizedLicense.expiration_date,
                  state: license.state,
                },
              });
            } catch (_error) {
              // If license with this ID doesn't exist, fall through to create logic
              console.log(
                `License with ID ${license.id} not found, creating new license`,
              );
            }
          }

          // Try to find matching license by type and number if no ID or ID not found
          const existingLicense = existingLicenses.find(
            (el) =>
              el.license_type === license.license_type &&
              el.license_number === license.license_number,
          );

          if (existingLicense) {
            // Update existing license
            return await prisma.license.update({
              where: {
                id: existingLicense.id,
              },
              data: {
                license_type: license.license_type,
                license_number: license.license_number,
                expiration_date: normalizedLicense.expiration_date,
                state: license.state,
              },
            });
          } else {
            // Create new license
            return await prisma.license.create({
              data: {
                clinical_info_id: data.clinical_info_id,
                license_type: license.license_type || "",
                license_number: license.license_number || "",
                expiration_date:
                  normalizedLicense.expiration_date || new Date(),
                state: license.state || "",
              },
            });
          }
        },
      ),
    );

    // Return both results and information about deleted licenses
    return NextResponse.json({
      updated: results,
      deleted:
        licenseIdsToDelete.length > 0
          ? { count: licenseIdsToDelete.length, ids: licenseIdsToDelete }
          : null,
    });
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
