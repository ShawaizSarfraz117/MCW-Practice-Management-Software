import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// Maximum character limit for SMS messages
const SMS_CHARACTER_LIMIT = 160;

// Schema for validating PUT request body
const reminderTextTemplateSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(
      SMS_CHARACTER_LIMIT,
      `Content must be at most ${SMS_CHARACTER_LIMIT} characters`,
    ),
});

/**
 * GET - Retrieve a specific reminder text template by ID
 * @param request - The NextRequest object
 * @param params - Object containing route parameters
 * @returns - JSON response with reminder text template data or error
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const template = await prisma.reminderTextTemplates.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Reminder text template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to retrieve reminder text template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to retrieve reminder text template" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update a specific reminder text template by ID
 * @param request - The NextRequest object
 * @param params - Object containing route parameters
 * @returns - JSON response with updated reminder text template data or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const requestData = await request.json();

    // Validate request data
    const result = reminderTextTemplateSchema.safeParse(requestData);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    // Verify template exists
    const existingTemplate = await prisma.reminderTextTemplates.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Reminder text template not found" },
        { status: 404 },
      );
    }

    // Update the template
    const updatedTemplate = await prisma.reminderTextTemplates.update({
      where: { id },
      data: {
        content: requestData.content,
      },
    });

    return NextResponse.json({
      message: "Reminder text template updated successfully",
      template: updatedTemplate,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to update reminder text template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to update reminder text template" },
      { status: 500 },
    );
  }
}
