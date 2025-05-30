import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET handler for retrieving a specific text template by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      logger.info("Missing template ID");
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    logger.info({ templateId: id }, "Fetching text template");

    const template = await prisma.reminderTextTemplates.findUnique({
      where: { id },
    });

    if (!template) {
      logger.info({ templateId: id }, "Text template not found");
      return NextResponse.json(
        { error: "Text template not found" },
        { status: 404 },
      );
    }

    logger.info({ templateId: id }, "Successfully fetched text template");
    return NextResponse.json({ data: template });
  } catch (error) {
    logger.error({ error }, "Failed to fetch text template");

    return NextResponse.json(
      { error: "Failed to fetch text template" },
      { status: 500 },
    );
  }
}

/**
 * PUT handler for updating a specific text template by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      logger.info("Missing template ID");
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.content) {
      logger.info({ data }, "Invalid text template data");
      return NextResponse.json(
        { error: "Type and content are required fields" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.reminderTextTemplates.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      logger.info({ templateId: id }, "Text template not found");
      return NextResponse.json(
        { error: "Text template not found" },
        { status: 404 },
      );
    }

    logger.info({ templateId: id }, "Updating text template");

    const updatedTemplate = await prisma.reminderTextTemplates.update({
      where: { id },
      data: {
        type: data.type,
        content: data.content,
      },
    });

    logger.info({ templateId: id }, "Successfully updated text template");
    return NextResponse.json({
      data: updatedTemplate,
      message: "Text template updated successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to update text template");

    return NextResponse.json(
      { error: "Failed to update text template" },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for removing a specific text template by ID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      logger.info("Missing template ID");
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.reminderTextTemplates.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      logger.info({ templateId: id }, "Text template not found");
      return NextResponse.json(
        { error: "Text template not found" },
        { status: 404 },
      );
    }

    logger.info({ templateId: id }, "Deleting text template");

    await prisma.reminderTextTemplates.delete({
      where: { id },
    });

    logger.info({ templateId: id }, "Successfully deleted text template");
    return NextResponse.json({
      success: true,
      message: "Text template deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete text template");

    return NextResponse.json(
      { error: "Failed to delete text template" },
      { status: 500 },
    );
  }
}
