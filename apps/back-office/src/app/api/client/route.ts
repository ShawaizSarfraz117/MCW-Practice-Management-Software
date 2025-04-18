/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger, config } from "@mcw/logger";
import { Prisma } from "@prisma/client";

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
  isExisting?: boolean;
  clientId?: string;
}

// GET - Retrieve all clients or a specific client by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "legal_last_name";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

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

      const statusArray = status?.split(",") || [];
      let whereCondition: Prisma.ClientWhereInput = {};

      // Handle status filtering
      if (statusArray.length > 0 && !statusArray.includes("all")) {
        whereCondition = {
          OR: statusArray.map((status) => {
            switch (status) {
              case "active":
                return { is_active: true };
              case "inactive":
                return { is_active: false };
              case "waitlist":
                return { is_waitlist: true };
              case "contacts":
                return {
                  ClientGroupMembership: {
                    some: {
                      is_contact_only: true,
                    },
                  },
                };
              default:
                return {};
            }
          }),
        };
      }

      // Add search condition if search query exists
      if (search) {
        const searchTerm = search.toLowerCase();
        const searchCondition = {
          OR: [
            { legal_first_name: { contains: searchTerm } },
            { legal_last_name: { contains: searchTerm } },
          ],
        };

        // Combine with existing conditions if they exist
        whereCondition =
          statusArray.length > 0 && !statusArray.includes("all")
            ? { AND: [whereCondition, searchCondition] }
            : searchCondition;
      }

      const clients = await prisma.client.findMany({
        where: whereCondition,
        orderBy: {
          [sortBy]: "asc",
        },
        skip: skip,
        take: limit,
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

      return NextResponse.json({
        data: clients,
        pagination: {
          page,
          limit,
          total: await prisma.client.count({ where: whereCondition }),
        },
      });
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
        let clientId: string;

        // Check if this is an existing client
        if (data.isExisting && data.clientId) {
          // Use existing client ID
          clientId = data.clientId;

          // Fetch existing client to check against later
          const existingClient = await prisma.client.findUnique({
            where: { id: clientId },
            include: { ClientContact: true },
          });

          if (!existingClient) {
            throw new Error(`Existing client with ID ${clientId} not found`);
          }

          // Create ClientGroupMembership for the existing client
          await prisma.clientGroupMembership.create({
            data: {
              client_group_id: requestData.clientGroupId,
              client_id: clientId,
              role: data.role || null,
              is_contact_only: data.is_contact_only || false,
              is_responsible_for_billing: data.isResponsibleForBilling || false,
            },
          });

          // For existing clients, only create contacts that don't exist yet
          if (data.emails && data.emails.length > 0) {
            // Filter out emails that already exist for this client
            const existingEmailValues = existingClient.ClientContact.filter(
              (contact) => contact.contact_type === "EMAIL",
            ).map((contact) => contact.value.toLowerCase());

            const newEmails = data.emails.filter(
              (email) =>
                !existingEmailValues.includes(email.value.toLowerCase()),
            );

            // Create new email contacts
            const emailContacts = newEmails.map((email, index) => ({
              client_id: clientId,
              contact_type: "EMAIL",
              type: email.type,
              value: email.value,
              permission: email.permission,
              is_primary: index === 0 && existingEmailValues.length === 0, // Only set primary if no existing emails
            }));

            // Create new email contacts if any
            if (emailContacts.length > 0) {
              await prisma.clientContact.createMany({
                data: emailContacts,
              });
            }
          }

          // Handle phone contacts for existing client
          if (data.phones && data.phones.length > 0) {
            // Filter out phones that already exist for this client
            const existingPhoneValues = existingClient.ClientContact.filter(
              (contact) => contact.contact_type === "PHONE",
            ).map((contact) => contact.value.replace(/\D/g, "")); // Strip non-digits for comparison

            const newPhones = data.phones.filter(
              (phone) =>
                !existingPhoneValues.includes(phone.value.replace(/\D/g, "")),
            );

            // Create new phone contacts
            const phoneContacts = newPhones.map((phone, index) => ({
              client_id: clientId,
              contact_type: "PHONE",
              type: phone.type,
              value: phone.value,
              permission: phone.permission,
              is_primary: index === 0 && existingPhoneValues.length === 0, // Only set primary if no existing phones
            }));

            // Create new phone contacts if any
            if (phoneContacts.length > 0) {
              await prisma.clientContact.createMany({
                data: phoneContacts,
              });
            }
          }
        } else {
          // Create a new client
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

          clientId = client.id;

          // Create ClientGroupMembership
          await prisma.clientGroupMembership.create({
            data: {
              client_group_id: requestData.clientGroupId,
              client_id: clientId,
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
            await prisma.clientContact.createMany({
              data: [...emailContacts, ...phoneContacts],
            });
          }
        }

        // Create reminder preferences if provided (for both new and existing clients)
        if (data.notificationOptions) {
          // First check if reminder preferences already exist for this client
          const existingPreferences =
            await prisma.clientReminderPreference.findMany({
              where: { client_id: clientId },
            });

          // Only create if none exist
          if (existingPreferences.length === 0) {
            const reminderPreferences = [];
            if (data.notificationOptions.upcomingAppointments !== undefined) {
              reminderPreferences.push({
                client_id: clientId,
                reminder_type: "UPCOMING_APPOINTMENTS",
                is_enabled: data.notificationOptions.upcomingAppointments,
              });
            }
            if (data.notificationOptions.incompleteDocuments !== undefined) {
              reminderPreferences.push({
                client_id: clientId,
                reminder_type: "INCOMPLETE_DOCUMENTS",
                is_enabled: data.notificationOptions.incompleteDocuments,
              });
            }
            if (data.notificationOptions.cancellations !== undefined) {
              reminderPreferences.push({
                client_id: clientId,
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
        }

        // Get the created or updated client with all related data
        const resultClient = await prisma.client.findUnique({
          where: { id: clientId },
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

        if (resultClient) {
          createdClients.push(resultClient);
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
      {
        error: "Failed to create clients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
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
