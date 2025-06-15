import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "@/api/auth/[...nextauth]/auth-options";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

interface AdministrativeNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  authorName: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    const clientGroupId = params.id;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Get current administrative notes
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: clientGroupId },
      select: {
        administrative_notes: true,
      },
    });

    if (!clientGroup) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse existing notes
    let existingNotes: AdministrativeNote[] = [];
    if (clientGroup.administrative_notes) {
      try {
        const parsed = JSON.parse(clientGroup.administrative_notes);
        existingNotes = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        logger.error(
          { error },
          "Failed to parse existing administrative notes",
        );
        existingNotes = [];
      }
    }

    // Get user name for the note
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
      },
    });

    const authorName = user?.email?.split("@")[0] || "Unknown User";

    // Create new note
    const newNote: AdministrativeNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdBy: session.user.id,
      createdAt: new Date(),
      authorName,
    };

    // Add new note to the beginning of the array
    const updatedNotes = [newNote, ...existingNotes];

    // Update the client group with the new notes
    await prisma.clientGroup.update({
      where: { id: clientGroupId },
      data: {
        administrative_notes: JSON.stringify(updatedNotes),
      },
    });

    logger.info(
      { clientGroupId, userId: session.user.id },
      "Administrative note created",
    );

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create administrative note");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
