import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// GET - Retrieve all services or a specific service by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");

    if (id) {
      logger.info("Retrieving specific service");
      // Retrieve specific service
      const service = await prisma.practiceService.findUnique({
        where: { id },
        include: {
          ClinicianServices: {
            include: {
              Clinician: true,
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

      // Get clinician's services
      const clinicianServices = await prisma.clinicianServices.findMany({
        where: {
          clinician_id: clinicianId,
        },
        include: {
          PracticeService: true,
        },
      });

      // Extract the services from the clinician-service relationship
      // Filter out any null values and ensure no duplicates
      const services = clinicianServices
        .map((cs) => cs.PracticeService)
        .filter((service) => service !== null)
        .filter(
          (service, index, self) =>
            index === self.findIndex((s) => s.id === service.id),
        );

      return NextResponse.json(services);
    } else {
      logger.info("Retrieving all services");
      // List all services
      const services = await prisma.practiceService.findMany();

      return NextResponse.json(services);
    }
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.code || !data.duration || data.rate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing service
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

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
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a service
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

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

    // Instead of deactivating, we'll just delete the service since there's no is_active field
    const deletedService = await prisma.practiceService.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Service deleted successfully",
      service: deletedService,
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 },
    );
  }
}
