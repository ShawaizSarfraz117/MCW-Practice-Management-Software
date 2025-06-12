/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";

// Simple validation helpers (KISS principle)
const isValidUUID = (str: string): boolean => {
  // More flexible UUID regex that accepts all hex digits (good for tests and real UUIDs)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const validateRequired = (
  data: Record<string, unknown>,
  fields: string[],
): string | null => {
  for (const field of fields) {
    if (!data[field]) {
      return `${field} is required`;
    }
  }
  return null;
};

interface ClientData {
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
  service_id: string;
  diagnosis_id: string;
  location_id: string;
  quantity: number;
  fee: number;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Simple validation
    const validationError = validateRequired(requestData, [
      "clinician_id",
      "clinician_location_id",
      "total_cost",
      "clients",
      "services",
    ]);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Validate arrays first (before UUID validation)
    if (
      !Array.isArray(requestData.clients) ||
      requestData.clients.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one client is required" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(requestData.services) ||
      requestData.services.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one service is required" },
        { status: 400 },
      );
    }

    // Validate UUID formats after array validation
    if (
      !isValidUUID(requestData.clinician_id) ||
      !isValidUUID(requestData.clinician_location_id)
    ) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 },
      );
    }

    // Create estimate with related data in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify clinician and location exist
      const clinician = await tx.clinician.findUnique({
        where: { id: requestData.clinician_id },
      });

      if (!clinician) {
        throw new Error("Clinician not found");
      }

      const location = await tx.location.findUnique({
        where: { id: requestData.clinician_location_id },
      });

      if (!location) {
        throw new Error("Location not found");
      }

      // Create the estimate
      const estimate = await tx.goodFaithEstimate.create({
        data: {
          clinician_id: requestData.clinician_id,
          client_group_id: requestData.client_group_id || null,
          clinician_npi: requestData.clinician_npi,
          clinician_tin: requestData.clinician_tin,
          clinician_location_id: requestData.clinician_location_id,
          contact_person_id: requestData.contact_person_id,
          clinician_phone: requestData.clinician_phone,
          clinician_email: requestData.clinician_email,
          provided_date: requestData.provided_date
            ? new Date(requestData.provided_date)
            : null,
          expiration_date: requestData.expiration_date
            ? new Date(requestData.expiration_date)
            : null,
          service_start_date: requestData.service_start_date
            ? new Date(requestData.service_start_date)
            : null,
          service_end_date: requestData.service_end_date
            ? new Date(requestData.service_end_date)
            : null,
          total_cost: requestData.total_cost,
          notes: requestData.notes,
        },
      });

      // Create clients
      const clients = await Promise.all(
        requestData.clients.map((client: ClientData) =>
          tx.goodFaithClients.create({
            data: {
              good_faith_id: estimate.id,
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
          }),
        ),
      );

      // Create services
      const services = await Promise.all(
        requestData.services.map((service: ServiceData) =>
          tx.goodFaithServices.create({
            data: {
              good_faith_id: estimate.id,
              service_id: service.service_id,
              diagnosis_id: service.diagnosis_id || null,
              location_id: service.location_id,
              quantity: service.quantity,
              fee: service.fee,
            },
          }),
        ),
      );

      return { estimate, clients, services };
    });

    // Fetch complete estimate with relations for response
    const completeEstimate = await prisma.goodFaithEstimate.findUnique({
      where: { id: result.estimate.id },
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
      message: "Good Faith Estimate created successfully",
      estimateId: result.estimate.id,
    });

    return NextResponse.json(completeEstimate, { status: 201 });
  } catch (error: unknown) {
    logger.error({
      message: "Failed to create Good Faith Estimate",
      errorDetails: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "A record with this value already exists.",
            details: error.meta?.target,
          },
          { status: 409 },
        );
      } else if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Related record not found.", details: error.meta?.cause },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Database operation failed.", details: error.message },
        { status: 500 },
      );
    } else if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json(
        { error: "An unexpected error occurred.", message: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred.", message: String(error) },
        { status: 500 },
      );
    }
  }
}
