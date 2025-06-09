import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../../../../auth/[...nextauth]/auth-options";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

interface AdministrativeNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  authorName: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientGroupId, noteId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
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
        return NextResponse.json(
          { error: "Invalid notes data" },
          { status: 500 },
        );
      }
    }

    // Find the note to update
    const noteIndex = existingNotes.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update the note content (keep other fields the same)
    existingNotes[noteIndex] = {
      ...existingNotes[noteIndex],
      content: content.trim(),
    };

    // Update the client group with the updated notes
    await prisma.clientGroup.update({
      where: { id: clientGroupId },
      data: {
        administrative_notes: JSON.stringify(existingNotes),
      },
    });

    logger.info(
      { clientGroupId, noteId, userId: session.user.id },
      "Administrative note updated",
    );

    return NextResponse.json({
      success: true,
      note: existingNotes[noteIndex],
    });
  } catch (error) {
    logger.error({ error }, "Failed to update administrative note");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientGroupId, noteId } = params;

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
        return NextResponse.json(
          { error: "Invalid notes data" },
          { status: 500 },
        );
      }
    }

    // Find the note to delete
    const noteToDelete = existingNotes.find((note) => note.id === noteId);
    if (!noteToDelete) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if user is authorized to delete this note (owner or admin)
    // For now, we'll allow anyone to delete any note, but you might want to restrict this

    // Remove the note from the array
    const updatedNotes = existingNotes.filter((note) => note.id !== noteId);

    // Update the client group with the updated notes
    await prisma.clientGroup.update({
      where: { id: clientGroupId },
      data: {
        administrative_notes: JSON.stringify(updatedNotes),
      },
    });

    logger.info(
      { clientGroupId, noteId, userId: session.user.id },
      "Administrative note deleted",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete administrative note");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
