import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET - Retrieve all email templates with optional type filtering
 * @param request - The NextRequest object
 * @returns - JSON response with email templates data or error
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const templates = await prisma.emailTemplate.findMany({
      where: type ? { type } : undefined,
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to fetch email templates: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.subject || !data.content || !data.type) {
      return NextResponse.json(
        { error: "Name, subject, content, and type are required fields" },
        { status: 400 },
      );
    }

    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 },
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        type: data.type,
        email_type: data.email_type,
        created_by: userId,
      },
    });

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!data.name || !data.subject || !data.content || !data.type) {
      return NextResponse.json(
        { error: "Name, subject, content, and type are required fields" },
        { status: 400 },
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        type: data.type,
        email_type: data.email_type,
      },
    });

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 },
    );
  }
}
