import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET handler for retrieving all text templates
 * Optional query param: type - filter templates by type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    logger.info({ type }, "Fetching text templates");

    const templates = await prisma.reminderTextTemplates.findMany({
      where: type ? { type } : undefined,
      orderBy: {
        type: "asc",
      },
    });

    logger.info(
      { count: templates.length },
      "Successfully fetched text templates",
    );

    // Return the templates
    return NextResponse.json({ data: templates });
  } catch (error) {
    logger.error({ error }, "Failed to fetch text templates");

    return NextResponse.json(
      { error: "Failed to fetch text templates" },
      { status: 500 },
    );
  }
}

/**
 * POST handler for creating a new text template
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.content) {
      logger.info({ data }, "Invalid text template data");
      return NextResponse.json(
        { error: "Type and content are required fields" },
        { status: 400 },
      );
    }

    logger.info({ templateType: data.type }, "Creating new text template");

    const template = await prisma.reminderTextTemplates.create({
      data: {
        id: crypto.randomUUID(),
        type: data.type,
        content: data.content,
      },
    });

    logger.info(
      { templateId: template.id },
      "Successfully created text template",
    );
    return NextResponse.json(
      {
        data: template,
        message: "Text template created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, "Failed to create text template");

    return NextResponse.json(
      { error: "Failed to create text template" },
      { status: 500 },
    );
  }
}
