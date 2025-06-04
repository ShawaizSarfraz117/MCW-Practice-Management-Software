import { NextResponse, NextRequest } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";

/**
 * Availability API Route
 *
 * Note: This API uses only start_date and end_date fields which contain both date and time information.
 * The database schema has been updated to remove the redundant start_time/end_time fields.
 */

// Validation schema for availability
const availabilitySchema = z.object({
  title: z.string().optional(),
  clinician_id: z.string().uuid(),
  allow_online_requests: z.boolean().default(false),
  location_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_recurring: z.boolean().default(false),
  recurring_rule: z.string().optional().nullable(),
});

async function isAuthenticated(request: NextRequest) {
  // @ts-expect-error - nextauth property may be added by tests
  if (request.nextauth?.token) {
    return true;
  }

  try {
    const session = await getServerSession(backofficeAuthOptions);
    return !!session?.user;
  } catch (error) {
    logger.error({ error }, "Error checking authentication");
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const services = searchParams.get("services");
    const body = await request.json();

    // If ID and services=true, add service to availability
    if (id && services === "true") {
      const { serviceId } = body;

      if (!serviceId) {
        return NextResponse.json(
          { error: "Service ID is required" },
          { status: 400 },
        );
      }

      // Validate that the availability exists
      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Validate that the service exists
      const service = await prisma.practiceService.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      }

      // Check if the relationship already exists
      const existingRelation = await prisma.availabilityServices.findUnique({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      if (existingRelation) {
        return NextResponse.json(
          { error: "Service already assigned to availability" },
          { status: 409 },
        );
      }

      // Create the availability-service relationship
      const availabilityService = await prisma.availabilityServices.create({
        data: {
          availability_id: id,
          service_id: serviceId,
        },
        include: {
          PracticeService: true,
        },
      });

      return NextResponse.json(
        {
          message: "Service added to availability successfully",
          service: {
            id: availabilityService.PracticeService.id,
            type: availabilityService.PracticeService.type,
            code: availabilityService.PracticeService.code,
            description: availabilityService.PracticeService.description,
            duration: availabilityService.PracticeService.duration,
            rate: availabilityService.PracticeService.rate,
            availableOnline:
              availabilityService.PracticeService.available_online,
          },
        },
        { status: 201 },
      );
    }

    // Otherwise, create new availability
    const validatedData = availabilitySchema.parse(body);

    // Convert string dates to Date objects and prepare data
    const data: Prisma.AvailabilityUncheckedCreateInput = {
      clinician_id: validatedData.clinician_id,
      title: validatedData.title || "",
      allow_online_requests: validatedData.allow_online_requests,
      location_id: validatedData.location_id,
      start_date: new Date(validatedData.start_date),
      end_date: new Date(validatedData.end_date),
      is_recurring: validatedData.is_recurring,
      recurring_rule: validatedData.recurring_rule || null,
    };

    // Use a transaction to create availability and add services
    const result = await prisma.$transaction(async (tx) => {
      // Create the availability
      const availability = await tx.availability.create({
        data,
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Check if custom services are provided
      if (body.selectedServices && Array.isArray(body.selectedServices)) {
        // Use the services selected by the user
        const selectedServiceIds = body.selectedServices;

        if (selectedServiceIds.length > 0) {
          const availabilityServicesData = selectedServiceIds.map(
            (serviceId: string) => ({
              availability_id: availability.id,
              service_id: serviceId,
            }),
          );

          await tx.availabilityServices.createMany({
            data: availabilityServicesData,
          });
        }

        return {
          availability,
          servicesAdded: selectedServiceIds.length,
        };
      } else {
        // Fallback to original logic if no custom services provided
        // Get all active online services for the clinician
        const clinicianServices = await tx.clinicianServices.findMany({
          where: {
            clinician_id: validatedData.clinician_id,
            is_active: true,
          },
          include: {
            PracticeService: true,
          },
        });

        // Filter for services that are available online
        const onlineServices = clinicianServices.filter(
          (cs) => cs.PracticeService.available_online === true,
        );

        // Create availability-service relationships for all online services
        if (onlineServices.length > 0) {
          const availabilityServicesData = onlineServices.map((cs) => ({
            availability_id: availability.id,
            service_id: cs.service_id,
          }));

          await tx.availabilityServices.createMany({
            data: availabilityServicesData,
          });
        }

        return {
          availability,
          servicesAdded: onlineServices.length,
        };
      }
    });

    logger.info(
      `Created availability ${result.availability.id} with ${result.servicesAdded} services automatically added`,
    );

    return NextResponse.json({
      ...result.availability,
      servicesAdded: result.servicesAdded,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(
        { error: error.errors },
        "Validation error while creating availability",
      );
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error creating availability");
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const services = searchParams.get("services");

    // If ID is provided and services=true, return availability services
    if (id && services === "true") {
      const availability = await prisma.availability.findUnique({
        where: { id },
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Get availability services with detailed information
      const availabilityServices = await prisma.availabilityServices.findMany({
        where: { availability_id: id },
        include: {
          PracticeService: true,
        },
        orderBy: {
          PracticeService: {
            type: "asc",
          },
        },
      });

      // Transform the data to include service details
      const servicesData = availabilityServices.map((as) => ({
        id: as.PracticeService.id,
        type: as.PracticeService.type,
        code: as.PracticeService.code,
        description: as.PracticeService.description,
        duration: as.PracticeService.duration,
        rate: as.PracticeService.rate,
        color: as.PracticeService.color,
        isDefault: as.PracticeService.is_default,
        billInUnits: as.PracticeService.bill_in_units,
        availableOnline: as.PracticeService.available_online,
        allowNewClients: as.PracticeService.allow_new_clients,
        requireCall: as.PracticeService.require_call,
        blockBefore: as.PracticeService.block_before,
        blockAfter: as.PracticeService.block_after,
      }));

      return NextResponse.json({
        availabilityId: id,
        services: servicesData,
        totalCount: servicesData.length,
      });
    }

    // If ID is provided, return single availability
    if (id) {
      const availability = await prisma.availability.findUnique({
        where: { id },
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(availability);
    }

    // Otherwise, handle filtering logic for multiple availabilities
    const where: Prisma.AvailabilityWhereInput = {};

    if (clinicianId) {
      where.clinician_id = clinicianId;
    }

    if (startDate && endDate) {
      // Ensure AND condition is added, not overwriting
      if (!where.AND) {
        where.AND = [];
      }
      // Push date range conditions into the AND array
      (where.AND as Prisma.AvailabilityWhereInput[]).push(
        { start_date: { gte: new Date(startDate) } },
        { end_date: { lte: new Date(endDate) } },
      );
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { start_date: "asc" },
      select: {
        id: true,
        clinician_id: true,
        title: true,
        start_date: true,
        end_date: true,
        location_id: true,
        allow_online_requests: true,
        is_recurring: true,
        recurring_rule: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    logger.error({ error }, "Error fetching availabilities");
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = availabilitySchema.partial().parse(body);

    // Convert date strings to Date objects if they exist and prepare data
    const data: Partial<Prisma.AvailabilityUncheckedUpdateInput> = {
      ...validatedData,
      updated_at: new Date(),
      recurring_rule: validatedData.recurring_rule || null,
    };

    // Convert date strings to Date objects if they exist
    if (validatedData.start_date) {
      data.start_date = new Date(validatedData.start_date);
    }
    if (validatedData.end_date) {
      data.end_date = new Date(validatedData.end_date);
    }

    const availability = await prisma.availability.update({
      where: { id },
      data,
      select: {
        id: true,
        clinician_id: true,
        title: true,
        start_date: true,
        end_date: true,
        location_id: true,
        allow_online_requests: true,
        is_recurring: true,
        recurring_rule: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error updating availability");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const services = searchParams.get("services");
    const serviceId = searchParams.get("serviceId");

    // If ID, services=true, and serviceId are provided, remove service from availability
    if (id && services === "true" && serviceId) {
      // Validate that the availability exists
      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Check if the relationship exists
      const existingRelation = await prisma.availabilityServices.findUnique({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: "Service not assigned to availability" },
          { status: 404 },
        );
      }

      // Delete the availability-service relationship
      await prisma.availabilityServices.delete({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      return NextResponse.json({
        message: "Service removed from availability successfully",
      });
    }

    // Otherwise, delete the availability
    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    // Use a transaction to delete availability and related services
    await prisma.$transaction(async (tx) => {
      // First, delete all related AvailabilityServices records
      await tx.availabilityServices.deleteMany({
        where: {
          availability_id: id,
        },
      });

      // Then delete the availability
      await tx.availability.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Error deleting availability");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
