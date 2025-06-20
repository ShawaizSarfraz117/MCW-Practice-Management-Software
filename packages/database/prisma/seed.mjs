/* global console */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import process from "process";
import { seedPermissions } from "./seed-permissions.mjs";
import { seedUsers } from "./seed-users.mjs";
import { seedSurveys } from "./seed-surveys.mjs";
import { seedTags } from "./seed-tags.mjs";

const prisma = new PrismaClient();

async function main() {
  // Define all roles to be seeded
  const rolesToSeed = [
    // Base roles (kept for backward compatibility)
    { name: "CLINICIAN", description: "Base clinician role" },
    { name: "ADMIN", description: "Base admin role" },
    // Specific roles with category.subcategory format
    {
      name: "CLINICIAN.BASIC",
      description:
        "Basic clinician - can schedule and add documentation for their clients",
    },
    {
      name: "CLINICIAN.BILLING",
      description:
        "Billing clinician - can bill, schedule, and add documentation for their clients",
    },
    {
      name: "CLINICIAN.FULL-CLIENT-LIST",
      description:
        "Full client list clinician - can see profiles and appointments for all clients",
    },
    {
      name: "CLINICIAN.ENTIRE-PRACTICE",
      description:
        "Entire practice clinician - can see most reports and practice settings",
    },
    {
      name: "CLINICIAN.SUPERVISOR",
      description:
        "Supervisor - for team members who supervise a pre-licensed clinician",
    },
    {
      name: "ADMIN.PRACTICE-MANAGER",
      description:
        "Practice manager - makes administrative decisions for the practice",
    },
    {
      name: "ADMIN.PRACTICE-BILLER",
      description: "Practice biller - handles client payments and insurance",
    },
    // Additional roles used in the UI
    {
      name: "Clinician",
      description: "For team members who treat clients",
    },
  ];

  // Create or update all roles
  console.log("Seeding roles...");
  const createdRoles = {};

  for (const roleData of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: {
        id: uuidv4(),
        name: roleData.name,
        description: roleData.description,
      },
    });
    createdRoles[roleData.name] = role;
    console.log(`Role seeded: ${role.name}`);
  }

  // Get base roles for backward compatibility
  const backOfficeRole = createdRoles["CLINICIAN"];
  const adminRole = createdRoles["ADMIN"];

  console.log("All roles seeded successfully");

  // Seed users
  const { admin, clinician, clinicianRecord, adminClinicianRecord } =
    await seedUsers(prisma, { adminRole, backOfficeRole });

  // Create locations
  console.log("Seeding locations...");
  const mainLocationId = uuidv4();
  const satelliteLocationId = uuidv4();

  const mainLocation = await prisma.location.upsert({
    where: { id: mainLocationId },
    update: {},
    create: {
      id: mainLocationId,
      name: "Main Clinic",
      address: "123 Medical Center Drive, Suite 200, Boston, MA 02115",
      street: "123 Medical Center Drive",
      city: "Boston",
      state: "MA",
      zip: "02115",
      is_active: true,
      color: "#2d8467",
    },
  });

  const satelliteLocation = await prisma.location.upsert({
    where: { id: satelliteLocationId },
    update: {},
    create: {
      id: satelliteLocationId,
      name: "Satellite Office",
      address: "456 Healthcare Plaza, Floor 3, Boston, MA 02116",
      street: "456 Healthcare Plaza",
      city: "Boston",
      state: "MA",
      zip: "02116",
      is_active: true,
      color: "#4f46e5",
    },
  });

  console.log("Locations created");

  // Create practice services
  console.log("Seeding practice services...");
  const services = [
    {
      id: uuidv4(),
      type: "Individual Therapy",
      rate: 150.0,
      code: "90834",
      description: "Individual psychotherapy, 45 minutes",
      duration: 45,
      color: "#10b981",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: true,
    },
    {
      id: uuidv4(),
      type: "Initial Evaluation",
      rate: 200.0,
      code: "90791",
      description: "Psychiatric diagnostic evaluation",
      duration: 60,
      color: "#f59e0b",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: false,
    },
    {
      id: uuidv4(),
      type: "Group Therapy",
      rate: 75.0,
      code: "90853",
      description: "Group psychotherapy",
      duration: 90,
      color: "#8b5cf6",
      allow_new_clients: false,
      available_online: false,
      bill_in_units: false,
      is_default: false,
    },
    {
      id: uuidv4(),
      type: "Family Therapy",
      rate: 175.0,
      code: "90847",
      description: "Family psychotherapy with patient present",
      duration: 50,
      color: "#ef4444",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: false,
    },
  ];

  const createdServices = [];
  for (const service of services) {
    const created = await prisma.practiceService.upsert({
      where: { id: service.id },
      update: {},
      create: service,
    });
    createdServices.push(created);
  }
  console.log("Practice services created");

  // Link clinicians to locations
  console.log("Linking clinicians to locations...");
  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: clinicianRecord.id,
        location_id: mainLocation.id,
      },
    },
    update: {},
    create: {
      clinician_id: clinicianRecord.id,
      location_id: mainLocation.id,
      is_primary: true,
    },
  });

  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: adminClinicianRecord.id,
        location_id: mainLocation.id,
      },
    },
    update: {},
    create: {
      clinician_id: adminClinicianRecord.id,
      location_id: mainLocation.id,
      is_primary: true,
    },
  });

  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: adminClinicianRecord.id,
        location_id: satelliteLocation.id,
      },
    },
    update: {},
    create: {
      clinician_id: adminClinicianRecord.id,
      location_id: satelliteLocation.id,
      is_primary: false,
    },
  });
  console.log("Clinician locations linked");

  // Link clinicians to services
  console.log("Linking clinicians to services...");
  for (const service of createdServices) {
    // Clinician offers all services
    await prisma.clinicianServices.upsert({
      where: {
        clinician_id_service_id: {
          clinician_id: clinicianRecord.id,
          service_id: service.id,
        },
      },
      update: {},
      create: {
        clinician_id: clinicianRecord.id,
        service_id: service.id,
        is_active: true,
      },
    });

    // Admin offers only individual and evaluation services
    if (
      service.type === "Individual Therapy" ||
      service.type === "Initial Evaluation"
    ) {
      await prisma.clinicianServices.upsert({
        where: {
          clinician_id_service_id: {
            clinician_id: adminClinicianRecord.id,
            service_id: service.id,
          },
        },
        update: {},
        create: {
          clinician_id: adminClinicianRecord.id,
          service_id: service.id,
          is_active: true,
        },
      });
    }
  }
  console.log("Clinician services linked");

  // Create licenses for clinicians
  console.log("Creating licenses for clinicians...");
  const clinicianLicenseId = uuidv4();
  const adminLicenseId = uuidv4();

  await prisma.license.upsert({
    where: { id: clinicianLicenseId },
    update: {},
    create: {
      id: clinicianLicenseId,
      clinician_id: clinicianRecord.id,
      license_type: "LCSW",
      license_number: "LCSW-123456",
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      state: "MA",
    },
  });

  await prisma.license.upsert({
    where: { id: adminLicenseId },
    update: {},
    create: {
      id: adminLicenseId,
      clinician_id: adminClinicianRecord.id,
      license_type: "PSYCHOLOGIST",
      license_number: "PSY-789012",
      expiration_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
      state: "MA",
    },
  });
  console.log("Licenses created");

  // Create sample audit entries
  const auditEntries = [
    {
      event_type: "LOGIN",
      event_text: "User logged into the system",
      is_hipaa: false,
      datetime: new Date(),
      user_id: admin.id, // Link to admin user
    },
    {
      event_type: "VIEW",
      event_text: "Viewed client medical records",
      is_hipaa: true,
      datetime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      user_id: clinician.id, // Link to clinician user
    },
    {
      event_type: "UPDATE",
      event_text: "Updated appointment details",
      is_hipaa: false,
      datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      user_id: admin.id,
    },
    {
      event_type: "ACCESS",
      event_text: "Accessed billing information",
      is_hipaa: true,
      datetime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      user_id: clinician.id,
    },
  ];

  for (const entry of auditEntries) {
    await prisma.audit.create({
      data: entry,
    });
  }

  // Create email templates
  const emailTemplates = [
    {
      id: uuidv4(),
      name: "Appointment Reminder",
      subject: "Appointment Reminder for {client_full_name}",
      content:
        "Hi {client_first_name},\n\nThis is a reminder that you have an appointment with {practice_full_name} at {appointment_time} on {appointment_date}.\n\nAdd to your Calendar:\n{appointment_reminder_links}\n\n{practice_full_name}\n\n{practice_address_line1}\n{practice_address_line2}\n{practice_map_link}\n\nPlease contact our office with any questions or changes.\n\n{practice_phone_number}",
      type: "reminder",
      created_at: new Date("2025-05-06T18:34:05.860Z"),
      updated_at: new Date("2025-05-09T08:00:48.505Z"),
      created_by: admin.id,
      email_type: "appointment_reminder",
    },
    {
      id: uuidv4(),
      name: "Default Invoice Emails",
      subject:
        "Your invoice(s) for {{client_first_appointment_date}} {{client_first_appointment_time}}",
      content:
        "Hi {{client_full_name}},\n\nYour invoice(s) for {{client_first_appointment_date}} are attached.\n\nThank you.\n{{clinician_first_name}}\nalam@mcnultycw.com\n{{practice_phone_number}}",
      type: "billing",
      created_at: new Date("2025-05-06T18:37:23.203Z"),
      updated_at: new Date("2025-05-06T18:37:23.203Z"),
      created_by: admin.id,
    },
    {
      id: uuidv4(),
      name: "Welcome",
      subject: "Welcome from {{client_full_name}}",
      content:
        "{{client_first_name}} offers a secure Client Portal to manage care with ease.\n\nBefore your visit, {{clinician_first_name}} would like you to complete practice documents. Sign in to your Client Portal to get started.\n\n{link}",
      type: "automated",
      created_at: new Date("2025-05-06T18:19:22.490Z"),
      updated_at: new Date("2025-05-11T10:12:06.733Z"),
      created_by: admin.id,
    },
    {
      id: uuidv4(),
      name: "Document reminder",
      subject: "Document reminder",
      content:
        "This is a reminder that you have documents to complete before your appointment on {appointment_date} at {appointment_time} with {clinician_full_name}.\n\nThe documents include:\n\n{client_document_request_names}\n\nSign in to your Client Portal to get started.\n\n{practice_client_portal_login_link}",
      type: "reminder",
      created_at: new Date("2025-05-06T18:34:05.860Z"),
      updated_at: new Date("2025-05-09T08:00:48.505Z"),
      created_by: admin.id,
      email_type: "document_reminder",
    },
  ];

  try {
    for (const template of emailTemplates) {
      const result = await prisma.emailTemplate.upsert({
        where: { id: template.id },
        update: template,
        create: template,
      });
      console.log(`Created/Updated email template: ${result.name}`);
    }
    console.log("Successfully created all email templates");
  } catch (error) {
    console.error("Error creating email templates:", error);
    throw error;
  }

  // Seed permissions
  await seedPermissions(prisma);

  // Connect permissions to ADMIN role
  try {
    const permissions = await prisma.permission.findMany();

    // Assign all permissions to the admin role
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: adminRole.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });
    }
    console.log("Role permissions assigned successfully");
  } catch (error) {
    console.error("Error assigning permissions to roles:", error);
    throw error;
  }

  // Seed survey templates
  await seedSurveys(prisma);

  // Seed tags
  const { tags: createdTags } = await seedTags(prisma);

  // Create sample appointments with tags
  console.log("Creating sample appointments with tags...");

  // Get some clients first
  const sampleClients = await prisma.client.findMany({ take: 3 });

  if (sampleClients.length > 0) {
    // Create client groups for the sample clients
    const clientGroups = [];
    for (const client of sampleClients) {
      const groupId = uuidv4();
      const group = await prisma.clientGroup.create({
        data: {
          id: groupId,
          type: "individual",
          name: `${client.legal_first_name} ${client.legal_last_name}`,
          clinician_id: clinicianRecord.id,
          is_active: true,
          ClientGroupMembership: {
            create: {
              client_id: client.id,
              role: "PRIMARY",
              is_responsible_for_billing: true,
            },
          },
        },
      });
      clientGroups.push(group);
    }

    // Create appointments with tags
    const appointments = [
      {
        id: uuidv4(),
        type: "APPOINTMENT",
        title: "Individual Therapy Session",
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // Tomorrow + 45 mins
        location_id: mainLocation.id,
        created_by: admin.id,
        status: "SHOW",
        clinician_id: clinicianRecord.id,
        appointment_fee: 150.0,
        service_id: createdServices.find((s) => s.type === "Individual Therapy")
          .id,
        client_group_id: clientGroups[0].id,
        is_new_client: false, // Existing client
      },
      {
        id: uuidv4(),
        type: "APPOINTMENT",
        title: "Initial Evaluation",
        start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        end_date: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        ), // Day after tomorrow + 60 mins
        location_id: mainLocation.id,
        created_by: admin.id,
        status: "SCHEDULED",
        clinician_id: adminClinicianRecord.id,
        appointment_fee: 200.0,
        service_id: createdServices.find((s) => s.type === "Initial Evaluation")
          .id,
        client_group_id: clientGroups[1]
          ? clientGroups[1].id
          : clientGroups[0].id,
        is_new_client: true, // New client
      },
    ];

    // Find the tags we need
    const unpaidTag = createdTags.find((t) => t.name === "Appointment Unpaid");
    const newClientTag = createdTags.find((t) => t.name === "New Client");
    const noNoteTag = createdTags.find((t) => t.name === "No Note");

    for (let i = 0; i < appointments.length; i++) {
      const appointmentData = { ...appointments[i] };
      const isNewClient = appointmentData.is_new_client;
      delete appointmentData.is_new_client; // Remove this field as it's not in the schema

      const appointment = await prisma.appointment.create({
        data: appointmentData,
      });

      // Add tags based on business logic
      const tagsToAdd = [];

      // All appointments start as unpaid
      tagsToAdd.push({ appointment_id: appointment.id, tag_id: unpaidTag.id });

      // All appointments start with no note
      tagsToAdd.push({ appointment_id: appointment.id, tag_id: noNoteTag.id });

      // If it's a new client (first appointment), add the New Client tag
      if (isNewClient) {
        tagsToAdd.push({
          appointment_id: appointment.id,
          tag_id: newClientTag.id,
        });
      }

      // Create appointment tags
      for (const tagData of tagsToAdd) {
        await prisma.appointmentTag.create({
          data: tagData,
        });
      }

      console.log(`Created appointment ${i + 1} with tags`);
    }

    console.log("Successfully created sample appointments with tags");
  } else {
    console.log(
      "No clients found to create appointments. Run seed-users first.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
