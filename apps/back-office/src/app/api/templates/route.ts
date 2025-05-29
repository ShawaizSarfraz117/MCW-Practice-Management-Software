import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const sharable = searchParams.get("sharable");
    const is_active = searchParams.get("is_active");
    const search = searchParams.get("search");

    // Build where condition based on query parameters
    const whereCondition: Prisma.SurveyTemplateWhereInput = {};

    if (type) {
      whereCondition.type = type;
    }

    if (sharable === "true") {
      whereCondition.is_shareable = true;
    } else if (sharable === "false") {
      whereCondition.is_shareable = false;
    }

    // Add filter for is_active
    if (is_active === "true") {
      whereCondition.is_active = true;
    } else if (is_active === "false") {
      whereCondition.is_active = false;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get templates without pagination
    const templates = await prisma.surveyTemplate.findMany({
      where: whereCondition,
      orderBy: {
        created_at: "desc",
      },
    });

    // Return templates without pagination metadata
    return NextResponse.json({
      data: templates,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to get templates: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.content || !data.type) {
      return NextResponse.json(
        { error: "Name, content, and type are required fields" },
        { status: 400 },
      );
    }

    const template = await prisma.surveyTemplate.create({
      data: {
        name: data.name,
        content: data.content,
        type: data.type,
        description: data.description,
        is_shareable:
          data.is_shareable !== undefined ? data.is_shareable : false,
        is_default: data.is_default !== undefined ? data.is_default : false,
        requires_signature:
          data.requires_signature !== undefined
            ? data.requires_signature
            : false,
        frequency_options: data.frequency_options,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to create template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
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

    // Delete the template
    await prisma.surveyTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to delete template: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
