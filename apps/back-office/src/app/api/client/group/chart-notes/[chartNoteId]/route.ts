import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

interface ChartNoteUpdateParams {
  params: {
    chartNoteId: string;
  };
}

export async function PUT(
  request: NextRequest,
  { params }: ChartNoteUpdateParams,
) {
  try {
    const { chartNoteId } = params;
    const body = await request.json();
    const { text, note_date } = body;

    if (!text && !note_date) {
      return NextResponse.json(
        { message: "No fields to update. Provide text or note_date." },
        { status: 400 },
      );
    }

    const updateData: { text?: string; note_date?: Date } = {};
    if (text) {
      updateData.text = text;
    }
    if (note_date) {
      updateData.note_date = new Date(note_date);
    }

    const updatedChartNote = await prisma.clientGroupChartNote.update({
      where: { id: chartNoteId },
      data: updateData,
    });

    logger.info(`Updated chart note with id: ${updatedChartNote.id}`);
    return NextResponse.json(updatedChartNote, { status: 200 });
  } catch (error) {
    const typedError = error as Error & { code?: string };
    logger.error(
      { error: typedError },
      "Error updating client group chart note:",
    );
    if (typedError.code === "P2025") {
      // Prisma error code for record not found
      return NextResponse.json(
        { message: "Chart note not found." },
        { status: 404 },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: ChartNoteUpdateParams,
) {
  try {
    const { chartNoteId } = params;

    await prisma.clientGroupChartNote.delete({
      where: { id: chartNoteId },
    });

    logger.info(`Deleted chart note with id: ${chartNoteId}`);
    return NextResponse.json(
      { message: "Chart note deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    const typedError = error as Error & { code?: string };
    logger.error(
      { error: typedError },
      "Error deleting client group chart note:",
    );
    if (typedError.code === "P2025") {
      // Prisma error code for record not found
      return NextResponse.json(
        { message: "Chart note not found." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
