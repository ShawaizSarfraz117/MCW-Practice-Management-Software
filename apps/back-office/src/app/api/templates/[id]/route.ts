import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    }

    const template = await prisma.surveyTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: template });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to get template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const data = await request.json();

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.surveyTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Update the template
    const updatedTemplate = await prisma.surveyTemplate.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingTemplate.name,
        content: data.content !== undefined ? data.content : existingTemplate.content,
        type: data.type !== undefined ? data.type : existingTemplate.type,
        description: data.description !== undefined ? data.description : existingTemplate.description,
        is_shareable: data.is_shareable !== undefined ? data.is_shareable : existingTemplate.is_shareable,
        is_default: data.is_default !== undefined ? data.is_default : existingTemplate.is_default,
        requires_signature: data.requires_signature !== undefined ? data.requires_signature : existingTemplate.requires_signature,
        frequency_options: data.frequency_options !== undefined ? data.frequency_options : existingTemplate.frequency_options,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: updatedTemplate });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to update template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
} 