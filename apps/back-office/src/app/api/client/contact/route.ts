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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { clientGroupId, relationship_type, is_emergency_contact } = data;

    let clientId = data.client_id;
    const results = await prisma.$transaction(async (tx) => {
      if (!clientId) {
        const client = await tx.client.create({
          data: {
            legal_first_name: data.legal_first_name,
            legal_last_name: data.legal_last_name,
            preferred_name: data.preferred_name,
          },
        });
        clientId = client.id;

        if (data.middle_name || data.notes) {
          await tx.clientProfile.create({
            data: {
              client_id: clientId,
              middle_name: data.middle_name,
              notes: data.notes,
            },
          });
        }
      }

      const res = await tx.clientGroupMembership.create({
        data: {
          client_group_id: clientGroupId,
          client_id: clientId,
          is_contact_only: true,
          is_emergency_contact: is_emergency_contact === "true",
          role: relationship_type,
        },
      });

      const emailContacts = (data.emails || []).map(
        (
          email: { value: string; type: string; permission: string },
          index: number,
        ) => ({
          client_id: clientId,
          contact_type: "EMAIL",
          type: email.type,
          value: email.value,
          permission: email.permission,
          is_primary: index === 0,
        }),
      );

      // Create phone contacts
      const phoneContacts = (data.phones || []).map(
        (
          phone: { value: string; type: string; permission: string },
          index: number,
        ) => ({
          client_id: clientId,
          contact_type: "PHONE",
          type: phone.type,
          value: phone.value,
          permission: phone.permission,
          is_primary: index === 0,
        }),
      );

      // Create all contacts
      if (emailContacts.length > 0 || phoneContacts.length > 0) {
        await tx.clientContact.createMany({
          data: [...emailContacts, ...phoneContacts],
        });
      }

      if (Array.isArray(data?.addresses) && data?.addresses.length > 0) {
        for (const address of data.addresses) {
          if (address.street || address.city || address.state || address.zip) {
            await prisma.clientAdress.create({
              data: {
                client_id: clientId,
                address_line1: address.street || "",
                address_line2: "",
                city: address.city || "",
                state: address.state || "",
                zip_code: address.zip || "",
                country: "United States",
                is_primary: true,
              },
            });
          }
        }
      }

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

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const client_group_id = data.client_group_id;
    const client_id = data.client_id;

    if (!client_group_id || !client_id) {
      return NextResponse.json(
        { error: "clientGroupMembership ID is required" },
        { status: 400 },
      );
    }

    await prisma.clientGroupMembership.delete({
      where: {
        client_group_id_client_id: {
          client_group_id: client_group_id,
          client_id: client_id,
        },
      },
    });

    return NextResponse.json({
      message: "Client deactivated successfully",
      client: null,
    });
  } catch (error) {
    console.error("Error deactivating client:", error);
    return NextResponse.json(
      { error: "Failed to deactivate client" },
      { status: 500 },
    );
  }
}
