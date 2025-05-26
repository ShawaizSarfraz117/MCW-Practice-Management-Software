import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// GET - Retrieve all services or a specific service by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const detailed = searchParams.get("detailed") === "true";

    if (id) {
      logger.info("Retrieving specific service");
      // Retrieve specific service
      const service = await prisma.practiceService.findUnique({
        where: { id },
        include: {
          ClinicianServices: {
            include: {
              Clinician: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  is_active: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(service);
    } else if (clinicianId) {
      logger.info(`Retrieving services for clinician: ${clinicianId}`);

      // Validate that the clinician exists
      const clinician = await prisma.clinician.findUnique({
        where: { id: clinicianId },
      });

      if (!clinician) {
        return NextResponse.json(
          { error: "Clinician not found" },
          { status: 404 },
        );
      }

      // Build where condition for clinician services
      const whereCondition = includeInactive
        ? { clinician_id: clinicianId }
        : { clinician_id: clinicianId, is_active: true };

      // Get clinician's services
      const clinicianServices = await prisma.clinicianServices.findMany({
        where: whereCondition,
        include: {
          PracticeService: true,
        },
        orderBy: {
          PracticeService: {
            type: "asc",
          },
        },
      });

      if (detailed) {
        // Return detailed information including custom rates and active status
        const detailedServices = clinicianServices.map((cs) => ({
          id: cs.PracticeService.id,
          type: cs.PracticeService.type,
          code: cs.PracticeService.code,
          description: cs.PracticeService.description,
          duration: cs.PracticeService.duration,
          defaultRate: cs.PracticeService.rate,
          customRate: cs.custom_rate,
          effectiveRate: cs.custom_rate || cs.PracticeService.rate,
          color: cs.PracticeService.color,
          isActive: cs.is_active,
          isDefault: cs.PracticeService.is_default,
          billInUnits: cs.PracticeService.bill_in_units,
          availableOnline: cs.PracticeService.available_online,
          allowNewClients: cs.PracticeService.allow_new_clients,
          requireCall: cs.PracticeService.require_call,
          blockBefore: cs.PracticeService.block_before,
          blockAfter: cs.PracticeService.block_after,
        }));

        return NextResponse.json({
          clinicianId,
          services: detailedServices,
          totalCount: detailedServices.length,
          activeCount: detailedServices.filter((s) => s.isActive).length,
        });
      } else {
        // Return simple service list for backward compatibility
        const services = clinicianServices
          .map((cs) => cs.PracticeService)
          .filter((service) => service !== null)
          .filter(
            (service, index, self) =>
              index === self.findIndex((s) => s.id === service.id),
          );

        return NextResponse.json(services);
      }
    } else {
      logger.info("Retrieving all services");
      // List all services
      const services = await prisma.practiceService.findMany({
        orderBy: {
          type: "asc",
        },
      });

      return NextResponse.json(services);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}

// POST - Create a new service or add service to clinician
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if this is a request to add service to clinician
    if (data.clinicianId && data.serviceId) {
      logger.info(
        `Adding service ${data.serviceId} to clinician: ${data.clinicianId}`,
      );

      // Validate that the clinician exists
      const clinician = await prisma.clinician.findUnique({
        where: { id: data.clinicianId },
      });

      if (!clinician) {
        return NextResponse.json(
          { error: "Clinician not found" },
          { status: 404 },
        );
      }

      // Validate that the service exists
      const service = await prisma.practiceService.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      }

      // Check if the relationship already exists
      const existingRelation = await prisma.clinicianServices.findUnique({
        where: {
          clinician_id_service_id: {
            clinician_id: data.clinicianId,
            service_id: data.serviceId,
          },
        },
      });

      if (existingRelation) {
        return NextResponse.json(
          { error: "Service already assigned to clinician" },
          { status: 409 },
        );
      }

      // Create the clinician-service relationship
      const clinicianService = await prisma.clinicianServices.create({
        data: {
          clinician_id: data.clinicianId,
          service_id: data.serviceId,
          custom_rate: data.customRate || null,
          is_active: data.isActive ?? true,
        },
        include: {
          PracticeService: true,
        },
      });

      return NextResponse.json(
        {
          message: "Service added to clinician successfully",
          clinicianService: {
            id: clinicianService.PracticeService.id,
            type: clinicianService.PracticeService.type,
            code: clinicianService.PracticeService.code,
            description: clinicianService.PracticeService.description,
            duration: clinicianService.PracticeService.duration,
            defaultRate: clinicianService.PracticeService.rate,
            customRate: clinicianService.custom_rate,
            effectiveRate:
              clinicianService.custom_rate ||
              clinicianService.PracticeService.rate,
            isActive: clinicianService.is_active,
          },
        },
        { status: 201 },
      );
    }

    // Otherwise, create a new practice service
    logger.info("Creating new practice service");

    // Validate required fields
    if (!data.code || !data.duration || data.rate === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: code, duration, and rate are required",
        },
        { status: 400 },
      );
    }

    // Create new service with all fields
    const newService = await prisma.practiceService.create({
      data: {
        type: data.type,
        code: data.code,
        duration: data.duration,
        rate: data.rate,
        description: data.description || null,
        color: data.color || null,
        is_default: data.is_default ?? false,
        bill_in_units: data.bill_in_units ?? false,
        available_online: data.available_online ?? false,
        allow_new_clients: data.allow_new_clients ?? false,
        require_call: data.require_call ?? false,
        block_before: data.block_before ?? 0,
        block_after: data.block_after ?? 0,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create service or add to clinician" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing service or clinician-service relationship
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if this is a request to update clinician-service relationship
    if (data.clinicianId && data.serviceId) {
      logger.info(
        `Updating clinician service: ${data.clinicianId} - ${data.serviceId}`,
      );

      // Check if the relationship exists
      const existingRelation = await prisma.clinicianServices.findUnique({
        where: {
          clinician_id_service_id: {
            clinician_id: data.clinicianId,
            service_id: data.serviceId,
          },
        },
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: "Service not assigned to clinician" },
          { status: 404 },
        );
      }

      // Update the clinician-service relationship
      const updatedClinicianService = await prisma.clinicianServices.update({
        where: {
          clinician_id_service_id: {
            clinician_id: data.clinicianId,
            service_id: data.serviceId,
          },
        },
        data: {
          custom_rate:
            data.customRate !== undefined
              ? data.customRate
              : existingRelation.custom_rate,
          is_active:
            data.isActive !== undefined
              ? data.isActive
              : existingRelation.is_active,
        },
        include: {
          PracticeService: true,
        },
      });

      return NextResponse.json({
        message: "Clinician service updated successfully",
        clinicianService: {
          id: updatedClinicianService.PracticeService.id,
          type: updatedClinicianService.PracticeService.type,
          code: updatedClinicianService.PracticeService.code,
          description: updatedClinicianService.PracticeService.description,
          duration: updatedClinicianService.PracticeService.duration,
          defaultRate: updatedClinicianService.PracticeService.rate,
          customRate: updatedClinicianService.custom_rate,
          effectiveRate:
            updatedClinicianService.custom_rate ||
            updatedClinicianService.PracticeService.rate,
          isActive: updatedClinicianService.is_active,
        },
      });
    }

    // Otherwise, update the practice service
    logger.info("Updating practice service");

    if (!data.id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 },
      );
    }

    // Check if service exists
    const existingService = await prisma.practiceService.findUnique({
      where: { id: data.id },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Update service
    const updatedService = await prisma.practiceService.update({
      where: { id: data.id },
      data: {
        type: data.type,
        code: data.code,
        duration: data.duration,
        rate: data.rate,
        description: data.description || null,
        color: data.color || null,
        is_default: data.is_default ?? false,
        bill_in_units: data.bill_in_units ?? false,
        available_online: data.available_online ?? false,
        allow_new_clients: data.allow_new_clients ?? false,
        require_call: data.require_call ?? false,
        block_before: data.block_before ?? 0,
        block_after: data.block_after ?? 0,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a service or remove service from clinician
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const serviceId = searchParams.get("serviceId");

    // Check if this is a request to remove service from clinician
    if (clinicianId && serviceId) {
      logger.info(
        `Removing service ${serviceId} from clinician: ${clinicianId}`,
      );

      // Check if the relationship exists
      const existingRelation = await prisma.clinicianServices.findUnique({
        where: {
          clinician_id_service_id: {
            clinician_id: clinicianId,
            service_id: serviceId,
          },
        },
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: "Service not assigned to clinician" },
          { status: 404 },
        );
      }

      // Delete the clinician-service relationship
      await prisma.clinicianServices.delete({
        where: {
          clinician_id_service_id: {
            clinician_id: clinicianId,
            service_id: serviceId,
          },
        },
      });

      return NextResponse.json({
        message: "Service removed from clinician successfully",
      });
    }

    // Otherwise, delete the practice service
    logger.info("Deleting practice service");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 },
      );
    }

    // Check if service exists
    const existingService = await prisma.practiceService.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete the service
    const deletedService = await prisma.practiceService.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Service deleted successfully",
      service: deletedService,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 },
    );
  }
}
