import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";

const VALID_TEMPLATE_TYPES = [
  "appointment",
  "telehealth",
  "document",
  "cancellation",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: { type: string } },
) {
  try {
    const { type } = params;

    // First check if the type is valid
    if (!VALID_TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 },
      );
    }

    // Then check if template exists in database
    const template = await prisma.reminderTextTemplates.findFirst({
      where: { type },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error retrieving reminder text template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string } },
) {
  try {
    const { type } = params;

    // First check if the type is valid
    if (!VALID_TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Template content is required and cannot be empty" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.reminderTextTemplates.findFirst({
      where: { type },
    });

    let template;

    if (existingTemplate) {
      // Update existing template
      template = await prisma.reminderTextTemplates.update({
        where: { id: existingTemplate.id },
        data: { content },
      });
    } else {
      // Create new template
      template = await prisma.reminderTextTemplates.create({
        data: { type, content },
      });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating reminder text template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
