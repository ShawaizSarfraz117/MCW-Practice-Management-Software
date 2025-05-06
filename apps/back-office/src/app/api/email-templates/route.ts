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

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const template = await prisma.emailTemplate.create({
      data: {
        ...data,
        created_by: request.headers.get("user-id") || "", // Assuming user-id is set in middleware
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
