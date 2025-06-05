import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { randomUUID } from "crypto";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";

// Request query validation schema
const querySchema = z.object({
  clinician_id: z.string().uuid().optional(),
});

// Request body validation schema for PUT/POST
const clientPortalSettingsSchema = z.object({
  is_enabled: z.boolean().optional(),
  domain_url: z.string().max(250).optional().nullable(),
  is_appointment_requests_enabled: z.boolean().optional().nullable(),
  appointment_start_times: z.string().max(250).optional().nullable(),
  request_minimum_notice: z.string().max(250).optional().nullable(),
  maximum_request_notice: z.string().max(250).optional().nullable(),
  allow_new_clients_request: z.boolean().optional(),
  requests_from_new_individuals: z.boolean().optional(),
  requests_from_new_couples: z.boolean().optional(),
  requests_from_new_contacts: z.boolean().optional(),
  is_prescreen_new_clinets: z.boolean().optional(),
  card_for_appointment_request: z.boolean().optional(),
  is_upload_documents_allowed: z.boolean().optional(),
  welcome_message: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clinicianIdParam = searchParams.get("clinician_id");
    const clinicianId = clinicianIdParam || session.user.id;

    // Validate clinician_id format using zod schema
    try {
      querySchema.parse({ clinician_id: clinicianId });
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details:
            validationError instanceof z.ZodError
              ? validationError.errors
              : "Invalid UUID format",
        },
        { status: 400 },
      );
    }

    // Find client portal settings for the clinician
    const settings = await prisma.clientPortalSettings.findFirst({
      where: {
        clinician_id: clinicianId,
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Client portal settings not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Client portal settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching client portal settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get clinician ID from session
    const clinicianId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = clientPortalSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    // Check if settings exist for this clinician
    const existingSettings = await prisma.clientPortalSettings.findFirst({
      where: {
        clinician_id: clinicianId,
      },
    });

    if (!existingSettings) {
      return NextResponse.json(
        { error: "Client portal settings not found" },
        { status: 404 },
      );
    }

    // Update the settings
    const updatedSettings = await prisma.clientPortalSettings.update({
      where: {
        id: existingSettings.id,
      },
      data: validationResult.data,
    });

    return NextResponse.json({
      message: "Client portal settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating client portal settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get clinician ID from session
    const clinicianId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = clientPortalSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    // Check if settings already exist for this clinician
    const existingSettings = await prisma.clientPortalSettings.findFirst({
      where: {
        clinician_id: clinicianId,
      },
    });

    if (existingSettings) {
      return NextResponse.json(
        { error: "Client portal settings already exist for this clinician" },
        { status: 409 },
      );
    }

    // Create new settings
    const newSettings = await prisma.clientPortalSettings.create({
      data: {
        id: randomUUID(),
        clinician_id: clinicianId,
        ...validationResult.data,
      },
    });

    return NextResponse.json(
      {
        message: "Client portal settings created successfully",
        data: newSettings,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating client portal settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
