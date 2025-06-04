import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// Simple validation helper
const isValidUUID = (str: string): boolean => {
  // More flexible UUID regex that accepts all hex digits (good for tests and real UUIDs)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

interface ClientData {
  id?: string;
  client_id: string;
  name: string;
  dob: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  should_voice?: boolean;
  should_text?: boolean;
  should_email?: boolean;
}

interface ServiceData {
  id?: string;
  service_id: string;
  diagnosis_id: string;
  location_id: string;
  quantity: number;
  fee: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { estimateId: string } },
) {
  try {
    const { estimateId } = params;

    if (!isValidUUID(estimateId)) {
      return NextResponse.json(
        { error: "Invalid estimate ID format" },
        { status: 400 },
      );
    }

    const estimate = await prisma.goodFaithEstimate.findUnique({
      where: { id: estimateId },
      include: {
        GoodFaithClients: {
          include: {
            Client: true,
          },
        },
        GoodFaithServices: {
          include: {
            PracticeService: true,
            Diagnosis: true,
            Location: true,
          },
        },
        Clinician: true,
        Location: true,
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Good Faith Estimate not found" },
        { status: 404 },
      );
    }

    logger.info({
      message: "Good Faith Estimate retrieved successfully",
      estimateId,
    });
    return NextResponse.json(estimate);
  } catch (error: unknown) {
    logger.error({
      message: "Failed to retrieve Good Faith Estimate",
      estimateId: params.estimateId,
      errorDetails: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to retrieve estimate" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { estimateId: string } },
) {
  try {
    const { estimateId } = params;
    const requestData = await request.json();

    if (!isValidUUID(estimateId)) {
      return NextResponse.json(
        { error: "Invalid estimate ID format" },
        { status: 400 },
      );
    }

    // Update estimate with related data in transaction
    await prisma.$transaction(async (tx) => {
      // Check if estimate exists
      const existingEstimate = await tx.goodFaithEstimate.findUnique({
        where: { id: estimateId },
        include: {
          GoodFaithClients: true,
          GoodFaithServices: true,
        },
      });

      if (!existingEstimate) {
        throw new Error("Good Faith Estimate not found");
      }

      // Update the main estimate
      await tx.goodFaithEstimate.update({
        where: { id: estimateId },
        data: {
          clinician_npi: requestData.clinician_npi,
          clinician_tin: requestData.clinician_tin,
          contact_person_id: requestData.contact_person_id,
          clinician_phone: requestData.clinician_phone,
          clinician_email: requestData.clinician_email,
          provided_date: requestData.provided_date
            ? new Date(requestData.provided_date)
            : undefined,
          expiration_date: requestData.expiration_date
            ? new Date(requestData.expiration_date)
            : undefined,
          service_start_date: requestData.service_start_date
            ? new Date(requestData.service_start_date)
            : undefined,
          service_end_date: requestData.service_end_date
            ? new Date(requestData.service_end_date)
            : undefined,
          total_cost: requestData.total_cost,
          notes: requestData.notes,
        },
      });

      // Handle clients updates if provided
      if (requestData.clients && Array.isArray(requestData.clients)) {
        // Delete existing clients not in the new list
        const newClientIds = requestData.clients
          .filter((c: ClientData) => c.id)
          .map((c: ClientData) => c.id);

        await tx.goodFaithClients.deleteMany({
          where: {
            good_faith_id: estimateId,
            id: { notIn: newClientIds },
          },
        });

        // Update or create clients
        await Promise.all(
          requestData.clients.map((client: ClientData) => {
            if (client.id) {
              // Update existing client
              return tx.goodFaithClients.update({
                where: { id: client.id },
                data: {
                  name: client.name,
                  dob: new Date(client.dob),
                  address: client.address,
                  city: client.city,
                  state: client.state,
                  zip_code: client.zip_code,
                  phone: client.phone,
                  email: client.email,
                  should_voice: client.should_voice || false,
                  should_text: client.should_text || false,
                  should_email: client.should_email || false,
                },
              });
            } else {
              // Create new client
              return tx.goodFaithClients.create({
                data: {
                  good_faith_id: estimateId,
                  client_id: client.client_id,
                  name: client.name,
                  dob: new Date(client.dob),
                  address: client.address,
                  city: client.city,
                  state: client.state,
                  zip_code: client.zip_code,
                  phone: client.phone,
                  email: client.email,
                  should_voice: client.should_voice || false,
                  should_text: client.should_text || false,
                  should_email: client.should_email || false,
                },
              });
            }
          }),
        );
      }

      // Handle services updates if provided
      if (requestData.services && Array.isArray(requestData.services)) {
        // Delete existing services not in the new list
        const newServiceIds = requestData.services
          .filter((s: ServiceData) => s.id)
          .map((s: ServiceData) => s.id);

        await tx.goodFaithServices.deleteMany({
          where: {
            good_faith_id: estimateId,
            id: { notIn: newServiceIds },
          },
        });

        // Update or create services
        await Promise.all(
          requestData.services.map((service: ServiceData) => {
            if (service.id) {
              // Update existing service
              return tx.goodFaithServices.update({
                where: { id: service.id },
                data: {
                  quantity: service.quantity,
                  fee: service.fee,
                },
              });
            } else {
              // Create new service
              return tx.goodFaithServices.create({
                data: {
                  good_faith_id: estimateId,
                  service_id: service.service_id,
                  diagnosis_id: service.diagnosis_id,
                  location_id: service.location_id,
                  quantity: service.quantity,
                  fee: service.fee,
                },
              });
            }
          }),
        );
      }
    });

    // Fetch updated estimate with relations
    const updatedEstimate = await prisma.goodFaithEstimate.findUnique({
      where: { id: estimateId },
      include: {
        GoodFaithClients: true,
        GoodFaithServices: {
          include: {
            PracticeService: true,
            Diagnosis: true,
            Location: true,
          },
        },
        Clinician: true,
        Location: true,
      },
    });

    logger.info({
      message: "Good Faith Estimate updated successfully",
      estimateId,
    });
    return NextResponse.json(updatedEstimate);
  } catch (error: unknown) {
    logger.error({
      message: "Failed to update Good Faith Estimate",
      estimateId: params.estimateId,
      errorDetails: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Good Faith Estimate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update estimate" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { estimateId: string } },
) {
  try {
    const { estimateId } = params;

    if (!isValidUUID(estimateId)) {
      return NextResponse.json(
        { error: "Invalid estimate ID format" },
        { status: 400 },
      );
    }

    // Delete estimate and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Check if estimate exists
      const existingEstimate = await tx.goodFaithEstimate.findUnique({
        where: { id: estimateId },
      });

      if (!existingEstimate) {
        throw new Error("Good Faith Estimate not found");
      }

      // Delete related records first (due to foreign key constraints)
      await tx.goodFaithServices.deleteMany({
        where: { good_faith_id: estimateId },
      });

      await tx.goodFaithClients.deleteMany({
        where: { good_faith_id: estimateId },
      });

      // Delete the main estimate
      await tx.goodFaithEstimate.delete({
        where: { id: estimateId },
      });
    });

    logger.info({
      message: "Good Faith Estimate deleted successfully",
      estimateId,
    });
    return NextResponse.json({
      message: "Good Faith Estimate deleted successfully",
    });
  } catch (error: unknown) {
    logger.error({
      message: "Failed to delete Good Faith Estimate",
      estimateId: params.estimateId,
      errorDetails: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Good Faith Estimate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete estimate" },
      { status: 500 },
    );
  }
}
