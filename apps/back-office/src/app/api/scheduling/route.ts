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
        { error: "Invalid message ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    if (!body.content || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updatedMessage = await prisma.schedulingMessage.update({
      where: { id },
      data: {
        content: body.content,
        type: body.type,
        is_active: body.isActive ?? true,
      },
    });

    return NextResponse.json({ data: updatedMessage });
  } catch (error) {
    console.error("Error updating scheduling message:", error);
    return NextResponse.json(
      { error: "Failed to update scheduling message" },
      { status: 500 },
    );
  }
}

export async function GET({ params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 },
      );
    }

    const message = await prisma.schedulingMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ data: message });
  } catch (error) {
    console.error("Error fetching scheduling message:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduling message" },
      { status: 500 },
    );
  }
}
