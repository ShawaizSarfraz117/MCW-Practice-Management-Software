import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET - Retrieve all client contacts with reminder preferences for a specific client
 * @param request - The NextRequest object
 * @returns - JSON response with client contacts data or error
 */
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    logger.info(
      { clientId },
      "Retrieving client contacts with reminder preferences",
    );

    const clientContacts = await prisma.clientContact.findMany({
      where: {
        client_id: clientId,
      },
      include: {
        ClientReminderPreference: true,
      },
    });

    if (!clientContacts || clientContacts.length === 0) {
      return NextResponse.json(
        { message: "No contacts found for this client", data: [] },
        { status: 200 },
      );
    }

    return NextResponse.json({ data: clientContacts });
  } catch (error) {
    logger.error(
      { error },
      "Error fetching client contacts with reminder preferences",
    );
    return NextResponse.json(
      { error: "Failed to fetch client contacts" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.length) {
      return NextResponse.json({ error: "data is required" }, { status: 400 });
    }
    const results = await prisma.$transaction(async (tx) => {
      await tx.clientReminderPreference.deleteMany({
        where: { client_id: data[0].client_id },
      });

      const res = await tx.clientReminderPreference.createMany({
        data: data,
      });
      return res;
    });
    return NextResponse.json({ data: results });
  } catch (error) {
    logger.error(
      { error },
      "Error fetching client contacts with reminder preferences",
    );
    return NextResponse.json(
      { error: "Failed to fetch client contacts" },
      { status: 500 },
    );
  }
}
