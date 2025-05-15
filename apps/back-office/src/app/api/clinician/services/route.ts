import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// Validation schema for PUT request
const updateClinicianServiceSchema = z.object({
  clinician_id: z.string(),
  service_ids: z.array(z.string()),
  custom_rate: z.number().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// GET - Fetch services for a clinician
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clinicianId = searchParams.get("clinician_id");

    if (!clinicianId) {
      return NextResponse.json(
        { error: "clinician_id query parameter is required" },
        { status: 400 },
      );
    }
    // Fetch all practice services that have a relationship with this clinician
    const services = await prisma.practiceService.findMany({
      where: {
        ClinicianServices: {
          some: {
            clinician_id: clinicianId,
            is_active: true,
          },
        },
      },
      include: {
        ClinicianServices: {
          where: {
            clinician_id: clinicianId,
            is_active: true,
          },
        },
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    logger.error({ error }, "Error fetching clinician services");
    return NextResponse.json(
      { error: "Failed to fetch clinician services" },
      { status: 500 },
    );
  }
}

// PUT - Update ClinicianServices
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    const validationResult = updateClinicianServiceSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        { status: 422 },
      );
    }

    const { clinician_id, service_ids, custom_rate, is_active } =
      validationResult.data;

    // Check if the clinician exists
    const clinician = await prisma.clinician.findUnique({
      where: { id: clinician_id },
    });

    if (!clinician) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 404 },
      );
    }

    // Check if all services exist
    const services = await prisma.practiceService.findMany({
      where: { id: { in: service_ids } },
    });

    if (services.length !== service_ids.length) {
      const foundIds = services.map((s) => s.id);
      const missingIds = service_ids.filter((id) => !foundIds.includes(id));

      return NextResponse.json(
        {
          error: "One or more services not found",
          missing_service_ids: missingIds,
        },
        { status: 404 },
      );
    }

    // Get existing relationships for this clinician
    const existingRelations = await prisma.clinicianServices.findMany({
      where: {
        clinician_id,
      },
    });

    const existingServiceIds = existingRelations.map((rel) => rel.service_id);

    // Find service IDs to delete (present in database but not in request)
    const serviceIdsToDelete = existingServiceIds.filter(
      (id) => !service_ids.includes(id),
    );

    // Delete relationships for services that were removed
    if (serviceIdsToDelete.length > 0) {
      await prisma.clinicianServices.deleteMany({
        where: {
          clinician_id,
          service_id: { in: serviceIdsToDelete },
        },
      });

      logger.info(
        `Deleted ${serviceIdsToDelete.length} clinician service relations for clinician ${clinician_id}`,
      );
    }

    // Create new relationships for services that don't have one yet
    const newServiceIds = service_ids.filter(
      (id) => !existingServiceIds.includes(id),
    );

    // Prepare data for createMany
    const createData = newServiceIds.map((service_id) => ({
      clinician_id,
      service_id,
      custom_rate,
      is_active,
    }));

    let results = [];

    // Create new relationships if needed
    if (createData.length > 0) {
      await prisma.clinicianServices.createMany({
        data: createData,
      });

      logger.info(
        `Created ${createData.length} new clinician service relations for clinician ${clinician_id}`,
      );
    }

    // Update existing relationships if needed
    for (const relation of existingRelations) {
      // Skip updating relationships for services that aren't in the request anymore
      if (!service_ids.includes(relation.service_id)) {
        continue;
      }

      await prisma.clinicianServices.update({
        where: {
          clinician_id_service_id: {
            clinician_id,
            service_id: relation.service_id,
          },
        },
        data: {
          custom_rate:
            custom_rate !== undefined ? custom_rate : relation.custom_rate,
          is_active: is_active !== undefined ? is_active : relation.is_active,
        },
      });
    }

    // Fetch all relationships after updates
    results = await prisma.clinicianServices.findMany({
      where: {
        clinician_id,
        service_id: { in: service_ids },
      },
    });

    // Return appropriate status code based on whether any new relations were created
    return NextResponse.json(results, {
      status: newServiceIds.length > 0 ? 201 : 200,
    });
  } catch (error) {
    logger.error({ error }, "Error updating clinician services");
    return NextResponse.json(
      { error: "Failed to update clinician services" },
      { status: 500 },
    );
  }
}
