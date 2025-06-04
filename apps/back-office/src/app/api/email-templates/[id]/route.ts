import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";

export async function PUT(
  request: NextRequest,
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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.subject || !body.content || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Update the template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        content: body.content,
        type: body.type,
        email_type: body.email_type,
      },
    });

    return NextResponse.json({ data: updatedTemplate });
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log("🚀 ~ request:", request);
  try {
    const { id } = params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 },
    );
  }
}
