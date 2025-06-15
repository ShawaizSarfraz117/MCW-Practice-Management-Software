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
  clientGroupServices: z
    .array(
      z.object({
        service_id: z.string().uuid(),
        custom_rate: z.number(),
      }),
    )
    .optional(),
});

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

    const { client_group_id, clientGroupServices, ...preferences } =
      validationResult.data;

    // Execute all database operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if client group exists
      const clientGroupExists = await tx.clientGroup.findUnique({
        where: { id: client_group_id },
        select: { id: true },
      });

      if (!clientGroupExists) {
        throw new Error("Client group not found");
      }

      // Check if preferences already exist for this client group
      const existingPreferences = await tx.clientBillingPreferences.findFirst({
        where: { client_group_id },
      });

      let billingPreferencesResult;

      if (existingPreferences) {
        // Update existing preferences
        billingPreferencesResult = await tx.clientBillingPreferences.update({
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
        billingPreferencesResult = await tx.clientBillingPreferences.create({
          data: createData,
        });

        logger.info({
          message: "Client billing preferences created successfully",
          client_group_id,
        });
      }

      // Update client group auto flags
      await tx.clientGroup.update({
        where: { id: client_group_id },
        data: {
          auto_monthly_statement_enabled:
            preferences.email_generated_statements || false,
          auto_monthly_superbill_enabled:
            preferences.email_generated_superbills || false,
        },
      });

      // Handle client group services
      if (clientGroupServices && clientGroupServices.length > 0) {
        await tx.clientGroupServices.deleteMany({
          where: { client_group_id },
        });

        await tx.clientGroupServices.createMany({
          data: clientGroupServices.map((service) => ({
            id: randomUUID(),
            client_group_id,
            service_id: service.service_id,
            custom_rate: Number(service.custom_rate),
          })),
        });
      }

      return {
        billingPreferences: billingPreferencesResult,
        isUpdate: !!existingPreferences,
      };
    });

    return NextResponse.json(result.billingPreferences, {
      status: result.isUpdate ? 200 : 201,
    });
  } catch (error) {
    logger.error({
      message: "Error processing client billing preferences",
      error: error instanceof Error ? error.message : String(error),
    });

    // Handle specific error for client group not found
    if (error instanceof Error && error.message === "Client group not found") {
      return NextResponse.json(
        { error: "Client group not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process client billing preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Get client billing preferences by client_group_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientGroupId = searchParams.get("client_group_id");

    if (!clientGroupId) {
      return NextResponse.json(
        { error: "client_group_id is required" },
        { status: 400 },
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientGroupId)) {
      return NextResponse.json(
        { error: "Invalid client_group_id format" },
        { status: 400 },
      );
    }

    const preferences = await prisma.clientBillingPreferences.findFirst({
      where: { client_group_id: clientGroupId },
    });

    // Get client group services
    const clientGroupServices = await prisma.clientGroupServices.findMany({
      where: { client_group_id: clientGroupId },
      include: {
        PracticeService: true,
      },
    });

    // Get client group for autogenerate settings
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: clientGroupId },
      select: {
        auto_monthly_statement_enabled: true,
        auto_monthly_superbill_enabled: true,
      },
    });

    // Always return data, even if preferences don't exist yet
    return NextResponse.json({
      ...(preferences || {
        // Default values if no preferences exist
        email_generated_invoices: false,
        email_generated_statements: false,
        email_generated_superbills: false,
        notify_new_invoices: false,
        notify_new_statements: false,
        notify_new_superbills: false,
      }),
      clientGroupServices,
      clientGroup,
    });
  } catch (error) {
    logger.error({
      message: "Error fetching client billing preferences",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to fetch client billing preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
