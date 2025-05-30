/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger, config } from "@mcw/logger";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { getClinicianInfo } from "@/utils/helpers";
import { PrismaClient } from "@prisma/client";

interface NotificationOptions {
  upcomingAppointments: {
    enabled: boolean;
    emailId: string | null;
    phoneId: string | null;
    method: string;
  };
  incompleteDocuments: {
    enabled: boolean;
    emailId: string | null;
    phoneId: string | null;
    method: string;
  };
  cancellations: {
    enabled: boolean;
    emailId: string | null;
    phoneId: string | null;
    method: string;
  };
}
interface ClientData {
  legalFirstName: string;
  legalLastName: string;
  preferredName?: string;
  dob?: string;
  status: string;
  addToWaitlist?: boolean;
  primaryClinicianId?: string;
  locationId?: string;
  emails: { value: string; type: string; permission: string }[];
  phones: { value: string; type: string; permission: string }[];
  notificationOptions: NotificationOptions;
  clientGroup: string;
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

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

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
      const statusArray = status?.split(",") || [];
      let whereCondition: Prisma.ClientWhereInput = {};

      // Add clinician filter if clientIds is available

      // Handle status filtering
      if (statusArray.length > 0 && !statusArray.includes("all")) {
        const statusCondition = {
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

        // Combine with existing clinician filter if any
        whereCondition = statusCondition;
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

        // Combine with existing conditions
        whereCondition =
          Object.keys(whereCondition).length > 0
            ? { AND: [whereCondition, searchCondition] }
            : searchCondition;
      }

      const clients = await prisma.client.findMany({
        where: {
          ...whereCondition,
          ClinicianClient: clinicianId
            ? {
                some: {
                  clinician_id: clinicianId,
                },
              }
            : {},
        },
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

// PUT - Update a client
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        ClientContact: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client basic info first
    await prisma.client.update({
      where: { id },
      data: {
        legal_first_name: data.legal_first_name,
        legal_last_name: data.legal_last_name,
        preferred_name: data.preferred_name,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      },
    });

    // Handle email contacts
    if (Array.isArray(data.emails)) {
      // Get existing email contacts
      const existingEmails = existingClient.ClientContact.filter(
        (contact: { contact_type: string }) => contact.contact_type === "EMAIL",
      );

      // Delete emails that are no longer in the new list
      const emailsToKeep = data.emails
        .filter((email: { id?: string }) => email.id)
        .map((email: { id?: string }) => email.id);

      // Delete emails not in the new list
      for (const existingEmail of existingEmails) {
        if (!emailsToKeep.includes(existingEmail.id)) {
          await prisma.clientContact.delete({
            where: { id: existingEmail.id },
          });
        }
      }

      // Update or create emails
      for (const email of data.emails) {
        if (email.id) {
          // Update existing email
          await prisma.clientContact.update({
            where: { id: email.id },
            data: {
              value: email.value,
              type: email.type,
              permission: email.permission,
            },
          });
        } else {
          // Create new email
          await prisma.clientContact.create({
            data: {
              client_id: id,
              contact_type: "EMAIL",
              value: email.value,
              type: email.type,
              permission: email.permission,
              is_primary: false, // Set primary status as needed
            },
          });
        }
      }
    }

    // Handle phone contacts
    if (Array.isArray(data.phones)) {
      // Get existing phone contacts
      const existingPhones = existingClient.ClientContact.filter(
        (contact: { contact_type: string }) => contact.contact_type === "PHONE",
      );

      // Get IDs of phones to keep
      const phonesToKeep = data.phones
        .filter((phone: { id?: string }) => phone.id)
        .map((phone: { id?: string }) => phone.id);

      // Delete phones not in the new list
      for (const existingPhone of existingPhones) {
        if (!phonesToKeep.includes(existingPhone.id)) {
          await prisma.clientContact.delete({
            where: { id: existingPhone.id },
          });
        }
      }

      // Update or create phones
      for (const phone of data.phones) {
        if (phone.id) {
          // Update existing phone
          await prisma.clientContact.update({
            where: { id: phone.id },
            data: {
              value: phone.value,
              type: phone.type,
              permission: phone.permission,
            },
          });
        } else {
          // Create new phone
          await prisma.clientContact.create({
            data: {
              client_id: id,
              contact_type: "PHONE",
              value: phone.value,
              type: phone.type,
              permission: phone.permission,
              is_primary: false, // Set primary status as needed
            },
          });
        }
      }
    }

    // Handle client profile data using Prisma functions
    // Update or create profile using upsert
    await prisma.clientProfile.upsert({
      where: { client_id: id },
      update: {
        middle_name: data.middle_name || null,
        gender: data.sex || null,
        gender_identity: data.gender_identity || null,
        relationship_status: data.relationship_status || null,
        employment_status: data.employment_status || null,
        race_ethnicity: Array.isArray(data.race_ethnicity)
          ? JSON.stringify(data.race_ethnicity)
          : null,
        race_ethnicity_details: data.race_ethnicity_details || null,
        preferred_language: data.preferred_language || null,
        notes: data.notes || null,
      },
      create: {
        client_id: id,
        middle_name: data.middle_name || null,
        gender: data.sex || null,
        gender_identity: data.gender_identity || null,
        relationship_status: data.relationship_status || null,
        employment_status: data.employment_status || null,
        race_ethnicity: Array.isArray(data.race_ethnicity)
          ? JSON.stringify(data.race_ethnicity)
          : null,
        race_ethnicity_details: data.race_ethnicity_details || null,
        preferred_language: data.preferred_language || null,
        notes: data.notes || null,
      },
    });

    // Handle addresses using Prisma functions
    if (Array.isArray(data.addresses)) {
      // Delete existing addresses
      await prisma.clientAdress.deleteMany({
        where: { client_id: id },
      });

      // Create new addresses
      for (const address of data.addresses) {
        if (address.street || address.city || address.state || address.zip) {
          await prisma.clientAdress.create({
            data: {
              client_id: id,
              address_line1: address.street || "",
              address_line2: "",
              city: address.city || "",
              state: address.state || "",
              zip_code: address.zip || "",
              country: "United States",
              is_primary: false,
            },
          });
        }
      }
    }

    // Get updated client with related data
    const updatedClient = await prisma.client.findUnique({
      where: { id },
      include: {
        ClientContact: true,
      },
    });

    return NextResponse.json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      {
        error: "Failed to update client",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Create new clients with contacts
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { clinicianId } = await getClinicianInfo();
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

    // Create all clients in a single transaction with increased timeout
    const results = await prisma.$transaction(async (tx) => {
      const createdClients = [];

      const clientGroup = await tx.clientGroup.create({
        data: {
          id: uuidv4(),
          name:
            requestData.clientGroup === "couple" ||
            requestData.clientGroup === "minor"
              ? `${clientDataArray[0].legalFirstName} & ${clientDataArray[1].legalFirstName}`
              : requestData.clientGroup === "family"
                ? `${clientDataArray[0].legalFirstName} Family`
                : `${clientDataArray[0].legalFirstName} ${clientDataArray[0].legalLastName}`,
          type: requestData.clientGroup,
          clinician_id: clinicianId || null,
        },
      });

      for (const data of clientDataArray) {
        let clientId: string;

        // Check if this is an existing client
        if (data.isExisting && data.clientId) {
          // Use existing client ID
          clientId = data.clientId;

          // Fetch existing client to check against later
          const existingClient = await tx.client.findUnique({
            where: { id: clientId },
            include: { ClientContact: true },
          });

          if (!existingClient) {
            throw new Error(`Existing client with ID ${clientId} not found`);
          }

          // Create ClientGroupMembership for the existing client
          await tx.clientGroupMembership.create({
            data: {
              client_group_id: clientGroup.id,
              client_id: clientId,
              role: requestData.clientGroup || null,
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
              await tx.clientContact.createMany({
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
              await tx.clientContact.createMany({
                data: phoneContacts,
              });
            }
          }
        } else {
          // Create a new client
          const client = await tx.client.create({
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
          await tx.clientGroupMembership.create({
            data: {
              client_group_id: clientGroup.id,
              client_id: clientId,
              role: requestData.clientGroup || null,
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
            await tx.clientContact.createMany({
              data: [...emailContacts, ...phoneContacts],
            });
          }
        }

        const { upcomingAppointments, incompleteDocuments, cancellations } =
          data.notificationOptions;

        if (upcomingAppointments.emailId || upcomingAppointments.phoneId) {
          await createClientReminderPreferences(
            tx,
            data.emails,
            data.phones,
            clientId,
            "UPCOMING_APPOINTMENTS",
            upcomingAppointments,
          );
        }
        if (incompleteDocuments.emailId || incompleteDocuments.phoneId) {
          await createClientReminderPreferences(
            tx,
            data.emails,
            data.phones,
            clientId,
            "INCOMPLETE_DOCUMENTS",
            incompleteDocuments,
          );
        }
        if (cancellations.emailId || cancellations.phoneId) {
          await createClientReminderPreferences(
            tx,
            data.emails,
            data.phones,
            clientId,
            "CANCELLATIONS",
            cancellations,
          );
        }

        // Get the created or updated client with all related data
        const resultClient = await tx.client.findUnique({
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
      if (error instanceof Error) {
        logger.error(error);
      } else {
        logger.error(new Error(String(error)));
      }
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

// PATCH - Update client status
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    if (status === undefined) {
      return NextResponse.json(
        { error: "Status is required" },
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

    // Update client status
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        is_active: status === "active",
      },
    });

    return NextResponse.json({
      message: "Client status updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error updating client status",
    );
    return NextResponse.json(
      { error: "Failed to update client status" },
      { status: 500 },
    );
  }
}

async function createClientReminderPreferences(
  prisma: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  emails: { value: string; type: string; permission: string }[],
  phones: { value: string; type: string; permission: string }[],
  clientId: string,
  type: string,
  notification: {
    emailId: string | null;
    phoneId: string | null;
    enabled: boolean;
    method: string;
  },
) {
  if (notification.emailId || notification.phoneId) {
    const clientReminderPreference: {
      client_id: string;
      contact_id: string;
      reminder_type: string;
      is_enabled: boolean;
      channel: string;
    }[] = [];

    if (notification.emailId && emails.length) {
      const emailIndex = parseInt(notification.emailId.split("-")[1], 10);
      if (!isNaN(emailIndex) && emailIndex < emails.length) {
        const email = emails[emailIndex];

        const clientContactEmail = await prisma.clientContact.findFirst({
          where: { value: email.value },
        });

        if (clientContactEmail?.id) {
          clientReminderPreference.push({
            client_id: clientId,
            reminder_type: type,
            is_enabled: notification.enabled,
            contact_id: clientContactEmail.id,
            channel: "email",
          });
        }
      }
    }

    if (notification.phoneId && phones.length) {
      const phoneIndex = parseInt(notification.phoneId.split("-")[1], 10);
      if (!isNaN(phoneIndex) && phoneIndex < phones.length) {
        const phone = phones[phoneIndex];

        const clientContactPhone = await prisma.clientContact.findFirst({
          where: { value: phone.value },
        });

        if (clientContactPhone?.id) {
          clientReminderPreference.push({
            client_id: clientId,
            reminder_type: type,
            is_enabled: notification.enabled,
            contact_id: clientContactPhone.id,
            channel: notification.method,
          });
        }
      }
    }

    if (clientReminderPreference.length > 0) {
      await prisma.clientReminderPreference.createMany({
        data: clientReminderPreference,
      });
    }
  }
}
config.setLevel("error");
