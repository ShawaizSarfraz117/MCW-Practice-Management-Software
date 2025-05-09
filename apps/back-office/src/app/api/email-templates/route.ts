import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";

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

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
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
    if (!data.subject || !data.body || !data.type) {
      return NextResponse.json(
        { error: "Subject, body, and type are required fields" },
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
        ...data,
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

    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
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
