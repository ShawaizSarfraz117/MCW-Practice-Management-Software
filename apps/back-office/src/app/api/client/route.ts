import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger, config } from "@mcw/logger";

interface ClientData {
  legalFirstName: string;
  legalLastName: string;
  preferredName?: string;
  dob?: string;
  status: string;
  addToWaitlist?: boolean;
  primaryClinicianId?: string;
  locationId?: string;
  emails?: { value: string; type: string; permission: string }[];
  phones?: { value: string; type: string; permission: string }[];
  notificationOptions?: {
    upcomingAppointments?: boolean;
    incompleteDocuments?: boolean;
    cancellations?: boolean;
  };
  clientGroupId: string;
  isResponsibleForBilling?: boolean;
  role?: string;
  is_contact_only?: boolean;
}

// GET - Retrieve all clients or a specific client by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      logger.info("Retrieving specific client");
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          ClientContact: true,
          Clinician: true,
          Location: true,
          ClientGroupMembership: {
            include: {
              ClientGroup: true,
            },
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(client);
    } else {
      logger.info("Retrieving all clients");
      const clients = await prisma.client.findMany({
        include: {
          ClientContact: true,
          Clinician: true,
          Location: true,
          ClientGroupMembership: {
            include: {
              ClientGroup: true,
            },
          },
        },
      });

      return NextResponse.json(clients);
    }
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

// POST - Create new clients with contacts
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    // Extract client data from numbered keys (client1, client2, etc.)
    const clientDataArray = Object.entries(requestData)
      .filter(
        ([key, value]) => key.startsWith("client") && typeof value === "object",
      )
      .map(([_, value]) => value as ClientData);

    if (clientDataArray.length === 0) {
      return NextResponse.json(
        { error: "No client data provided" },
        { status: 400 },
      );
    }

    // Create all clients in a single transaction
    const results = await prisma.$transaction(async (prisma) => {
      const createdClients = [];

      for (const data of clientDataArray) {
        // Create the client
        const client = await prisma.client.create({
          data: {
            legal_first_name: data.legalFirstName,
            legal_last_name: data.legalLastName,
            preferred_name: data.preferredName,
            date_of_birth: data.dob ? new Date(data.dob) : null,
            is_waitlist: data.addToWaitlist || false,
            primary_clinician_id: data.primaryClinicianId || null,
            primary_location_id: data.locationId || null,
            is_active: data.status === "active",
          },
        });

        // Create ClientGroupMembership
        await prisma.clientGroupMembership.create({
          data: {
            client_group_id: requestData.clientGroupId,
            client_id: client.id,
            role: data.role || null,
            is_contact_only: data.is_contact_only || false,
            is_responsible_for_billing: data.isResponsibleForBilling || false,
          },
        });

        // Create email contacts
        const emailContacts = (data.emails || []).map(
          (
            email: { value: string; type: string; permission: string },
            index: number,
          ) => ({
            client_id: client.id,
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
            client_id: client.id,
            contact_type: "PHONE",
            type: phone.type,
            value: phone.value,
            permission: phone.permission,
            is_primary: index === 0,
          }),
        );

        // Create all contacts
        if (emailContacts.length > 0 || phoneContacts.length > 0) {
          await prisma.clientContact.createMany({
            data: [...emailContacts, ...phoneContacts],
          });
        }

        // Create reminder preferences if provided
        if (data.notificationOptions) {
          const reminderPreferences = [];
          if (data.notificationOptions.upcomingAppointments !== undefined) {
            reminderPreferences.push({
              client_id: client.id,
              reminder_type: "UPCOMING_APPOINTMENTS",
              is_enabled: data.notificationOptions.upcomingAppointments,
            });
          }
          if (data.notificationOptions.incompleteDocuments !== undefined) {
            reminderPreferences.push({
              client_id: client.id,
              reminder_type: "INCOMPLETE_DOCUMENTS",
              is_enabled: data.notificationOptions.incompleteDocuments,
            });
          }
          if (data.notificationOptions.cancellations !== undefined) {
            reminderPreferences.push({
              client_id: client.id,
              reminder_type: "CANCELLATIONS",
              is_enabled: data.notificationOptions.cancellations,
            });
          }

          if (reminderPreferences.length > 0) {
            await prisma.clientReminderPreference.createMany({
              data: reminderPreferences,
            });
          }
        }

        // Get the created client with all related data
        const createdClient = await prisma.client.findUnique({
          where: { id: client.id },
          include: {
            ClientContact: true,
            ClientReminderPreference: true,
            Clinician: true,
            Location: true,
            ClientGroupMembership: {
              include: {
                ClientGroup: true,
              },
            },
          },
        });

        if (createdClient) {
          createdClients.push(createdClient);
        }
      }

      return createdClients;
    });

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    // Only log non-validation errors
    if (
      !(error instanceof Error) ||
      !error.message.includes("Conversion failed")
    ) {
      console.error("Error creating clients:", error);
    }
    return NextResponse.json(
      { error: "Failed to create clients" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing client
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: data.id },
      include: {
        ClientGroupMembership: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client and contacts in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update client
      await prisma.client.update({
        where: { id: data.id },
        data: {
          legal_first_name: data.legalFirstName,
          legal_last_name: data.legalLastName,
          preferred_name: data.preferredName,
          date_of_birth: data.dob ? new Date(data.dob) : null,
          is_waitlist: data.addToWaitlist,
          primary_clinician_id: data.primaryClinicianId,
          primary_location_id: data.locationId,
          is_active: data.status === "active",
        },
      });

      // Update ClientGroupMembership if provided
      if (data.clientGroupId) {
        // Delete existing membership if it exists
        if (existingClient.ClientGroupMembership.length > 0) {
          await prisma.clientGroupMembership.deleteMany({
            where: { client_id: data.id },
          });
        }

        // Create new membership
        await prisma.clientGroupMembership.create({
          data: {
            client_group_id: data.clientGroupId,
            client_id: data.id,
            role: data.role,
            is_contact_only: data.is_contact_only,
            is_responsible_for_billing: data.isResponsibleForBilling || false,
          },
        });
      }

      // Update contacts if provided
      if (data.emails || data.phones) {
        // Delete existing contacts
        await prisma.clientContact.deleteMany({
          where: { client_id: data.id },
        });

        // Create new contacts
        let emailContacts = (data.emails || []).map(
          (
            email: { value: string; type: string; permission: string },
            index: number,
          ) => ({
            client_id: data.id,
            contact_type: "EMAIL",
            type: email.type,
            value: email.value,
            permission: email.permission,
            is_primary: index === 0,
          }),
        );
        emailContacts = [...emailContacts].filter(
          (email: { value: string }) => email.value !== "",
        );

        let phoneContacts = (data.phones || []).map(
          (
            phone: { value: string; type: string; permission: string },
            index: number,
          ) => ({
            client_id: data.id,
            contact_type: "PHONE",
            type: phone.type,
            value: phone.value,
            permission: phone.permission,
            is_primary: index === 0,
          }),
        );
        phoneContacts = [...phoneContacts].filter(
          (phone: { value: string }) => phone.value !== "",
        );
        if (emailContacts.length > 0 || phoneContacts.length > 0) {
          await prisma.clientContact.createMany({
            data: [...emailContacts, ...phoneContacts],
          });
        }
      }

      // Update reminder preferences if provided
      if (data.notificationOptions) {
        await prisma.clientReminderPreference.deleteMany({
          where: { client_id: data.id },
        });

        const reminderPreferences = [];
        if (data.notificationOptions.upcomingAppointments !== undefined) {
          reminderPreferences.push({
            client_id: data.id,
            reminder_type: "UPCOMING_APPOINTMENTS",
            is_enabled: data.notificationOptions.upcomingAppointments,
          });
        }
        if (data.notificationOptions.incompleteDocuments !== undefined) {
          reminderPreferences.push({
            client_id: data.id,
            reminder_type: "INCOMPLETE_DOCUMENTS",
            is_enabled: data.notificationOptions.incompleteDocuments,
          });
        }
        if (data.notificationOptions.cancellations !== undefined) {
          reminderPreferences.push({
            client_id: data.id,
            reminder_type: "CANCELLATIONS",
            is_enabled: data.notificationOptions.cancellations,
          });
        }

        if (reminderPreferences.length > 0) {
          await prisma.clientReminderPreference.createMany({
            data: reminderPreferences,
          });
        }
      }

      return prisma.client.findUnique({
        where: { id: data.id },
        include: {
          ClientContact: true,
          ClientReminderPreference: true,
          Clinician: true,
          Location: true,
          ClientGroupMembership: {
            include: {
              ClientGroup: true,
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

// DELETE - Deactivate a client instead of deleting
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Instead of deleting, set is_active to false
    const deactivatedClient = await prisma.client.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({
      message: "Client deactivated successfully",
      client: deactivatedClient,
    });
  } catch (error) {
    console.error("Error deactivating client:", error);
    return NextResponse.json(
      { error: "Failed to deactivate client" },
      { status: 500 },
    );
  }
}

config.setLevel("error");
