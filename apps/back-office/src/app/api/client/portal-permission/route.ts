import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// Validation schema for request body
const updatePortalPermissionsSchema = z.object({
  client_id: z.string().uuid(),
  allow_online_appointment: z.boolean().optional(),
  access_billing_documents: z.boolean().optional(),
  use_secure_messaging: z.boolean().optional(),
});

/**
 * Update client portal permissions
 * This endpoint allows updating the three client portal permission fields:
 * - allow_online_appointment
 * - access_billing_documents
 * - use_secure_messaging
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = updatePortalPermissionsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { client_id, ...permissions } = validationResult.data;

    // Check if client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: client_id },
      select: { id: true },
    });

    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Only include fields that were actually provided in the request
    const updateData: Record<string, boolean> = {};

    if (permissions.allow_online_appointment !== undefined) {
      updateData.allow_online_appointment =
        permissions.allow_online_appointment;
    }

    if (permissions.access_billing_documents !== undefined) {
      updateData.access_billing_documents =
        permissions.access_billing_documents;
    }

    if (permissions.use_secure_messaging !== undefined) {
      updateData.use_secure_messaging = permissions.use_secure_messaging;
    }

    // Don't perform update if no fields were provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No portal permission fields provided to update" },
        { status: 400 },
      );
    }

    // Update client portal permissions
    const updatedClient = await prisma.client.update({
      where: { id: client_id },
      data: updateData,
      select: {
        id: true,
        legal_first_name: true,
        legal_last_name: true,
        allow_online_appointment: true,
        access_billing_documents: true,
        use_secure_messaging: true,
      },
    });

    logger.info({
      message: "Client portal permissions updated successfully",
      client_id,
      updated_fields: Object.keys(updateData),
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    logger.error({
      message: "Error updating client portal permissions",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to update client portal permissions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
