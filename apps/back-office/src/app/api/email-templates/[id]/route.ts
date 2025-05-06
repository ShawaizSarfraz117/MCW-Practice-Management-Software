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

    // Update the template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        content: body.content,
        type: body.type,
        is_active: body.isActive ?? true,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function GET({ params }: { params: { id: string } }) {
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

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
