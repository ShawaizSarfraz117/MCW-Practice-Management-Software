import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_group_id, text, note_date } = body;

    if (!client_group_id || !text || !note_date) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: client_group_id, text, and note_date are required.",
        },
        { status: 400 },
      );
    }

    // Optional: Validate if client_group_id exists
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: client_group_id },
    });

    if (!clientGroup) {
      return NextResponse.json(
        { message: "Invalid client_group_id. Client group not found." },
        { status: 400 },
      );
    }

    const newChartNote = await prisma.clientGroupChartNote.create({
      data: {
        client_group_id,
        text,
        note_date: new Date(note_date), // Assuming note_date is sent as ISO string
      },
    });

    logger.info(
      `Created new chart note with id: ${newChartNote.id} for client group: ${client_group_id}`,
    );
    return NextResponse.json(newChartNote, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Error creating client group chart note:");
    if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientGroupId = searchParams.get("clientGroupId");

    if (!clientGroupId) {
      return NextResponse.json(
        { message: "Missing clientGroupId query parameter." },
        { status: 400 },
      );
    }

    const chartNotes = await prisma.clientGroupChartNote.findMany({
      where: {
        client_group_id: clientGroupId,
      },
      orderBy: {
        note_date: "desc", // Optional: order by note date descending
      },
    });

    if (!chartNotes) {
      return NextResponse.json(
        {
          message:
            "No chart notes found for the given client group or client group does not exist.",
        },
        { status: 404 },
      );
    }

    logger.info(
      `Fetched ${chartNotes.length} chart notes for client group: ${clientGroupId}`,
    );
    return NextResponse.json(chartNotes, { status: 200 });
  } catch (error) {
    logger.error({ error }, "Error fetching client group chart notes:");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
