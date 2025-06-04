import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for request body
const billingPreferencesSchema = z.object({
  client_group_id: z.string().uuid(),
  email_generated_invoices: z.boolean().optional(),
  email_generated_statements: z.boolean().optional(),
  email_generated_superbills: z.boolean().optional(),
  notify_new_invoices: z.boolean().optional(),
  notify_new_statements: z.boolean().optional(),
  notify_new_superbills: z.boolean().optional(),
});

/**
 * Create or update client billing preferences
 * If a record already exists for the client_group_id, it will be updated
 * If no record exists, a new one will be created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = billingPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { client_group_id, ...preferences } = validationResult.data;

    // Check if client group exists
    const clientGroupExists = await prisma.clientGroup.findUnique({
      where: { id: client_group_id },
      select: { id: true },
    });

    if (!clientGroupExists) {
      return NextResponse.json(
        { error: "Client group not found" },
        { status: 404 },
      );
    }

    // Check if preferences already exist for this client group
    const existingPreferences = await prisma.clientBillingPreferences.findFirst(
      {
        where: { client_group_id },
      },
    );

    let result;

    if (existingPreferences) {
      // Update existing preferences
      result = await prisma.clientBillingPreferences.update({
        where: { id: existingPreferences.id },
        data: preferences,
      });

      logger.info({
        message: "Client billing preferences updated successfully",
        client_group_id,
        updated_fields: Object.keys(preferences),
      });
    } else {
      // Create new preferences record
      // Generate UUID outside of the data object and use it directly
      const newId = randomUUID();

      // Create the data object with the generated ID
      const createData = {
        id: newId,
        client_group_id,
        ...preferences,
      };

      // Pass the data object to Prisma
      result = await prisma.clientBillingPreferences.create({
        data: createData,
      });

      logger.info({
        message: "Client billing preferences created successfully",
        client_group_id,
      });
    }

    return NextResponse.json(result, {
      status: existingPreferences ? 200 : 201,
    });
  } catch (error) {
    logger.error({
      message: "Error processing client billing preferences",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to process client billing preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
