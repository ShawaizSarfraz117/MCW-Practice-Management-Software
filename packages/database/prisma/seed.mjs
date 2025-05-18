/* global console */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import process from "process";
import { seedPermissions } from "./seed-permissions.mjs";
import { seedUsers } from "./seed-users.mjs";

const prisma = new PrismaClient();

async function main() {
  // First try to find the existing role
  let backOfficeRole = await prisma.role.findUnique({
    where: { name: "CLINICIAN" },
  });

  let adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  // If it doesn't exist, create it
  if (!backOfficeRole) {
    backOfficeRole = await prisma.role.create({
      data: {
        id: uuidv4(),
        name: "CLINICIAN",
      },
    });
  }
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: uuidv4(),
        name: "ADMIN",
      },
    });
  }

  console.log("Roles created or found:", { admin: adminRole.name, clinician: backOfficeRole.name });

  // Seed users
  const { admin, clinician } = await seedUsers(prisma, { adminRole, backOfficeRole });

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
      subject: "Appointment Reminder for {{client_full_name}}",
      content: "Hi {client_first_name},\n\nThis is a reminder that you have an appointment with {practice_full_name} at {appointment_time} on {appointment_date}.\n\nAdd to your Calendar:\n{appointment_reminder_links}\n",
      type: "reminder",
      is_active: true,
      is_enabled: true,
      reminder_time: 48,
      include_attachments: false,
      send_to_client: true,
      send_to_clinician: false,
      send_to_practice: false,
      created_at: new Date("2025-05-06T18:34:05.860Z"),
      updated_at: new Date("2025-05-09T08:00:48.505Z"),
      created_by: admin.id
    },
    {
      id: uuidv4(),
      name: "Default Invoice Emails",
      subject: "Your invoice(s) for {{client_first_appointment_date}} {{client_first_appointment_time}}",
      content: "Hi {{client_full_name}},\n\nYour invoice(s) for {{client_first_appointment_date}} are attached.\n\nThank you.\n{{clinician_first_name}}\nalam@mcnultycw.com\n{{practice_phone_number}}",
      type: "billing",
      is_active: true,
      is_enabled: true,
      reminder_time: 48,
      include_attachments: true,
      send_to_client: true,
      send_to_clinician: false,
      send_to_practice: false,
      created_at: new Date("2025-05-06T18:37:23.203Z"),
      updated_at: new Date("2025-05-06T18:37:23.203Z"),
      created_by: admin.id
    },
    {
      id: uuidv4(),
      name: "Welcome",
      subject: "Welcome from {{client_full_name}}",
      content: "{{client_first_name}} offers a secure Client Portal to manage care with ease.\n\nBefore your visit, {{clinician_first_name}} would like you to complete practice documents. Sign in to your Client Portal to get started.\n\n{link}",
      type: "automated",
      is_active: true,
      is_enabled: true,
      reminder_time: 0,
      include_attachments: false,
      send_to_client: true,
      send_to_clinician: true,
      send_to_practice: true,
      created_at: new Date("2025-05-06T18:19:22.490Z"),
      updated_at: new Date("2025-05-11T10:12:06.733Z"),
      created_by: admin.id
    }
  ];

  try {
    for (const template of emailTemplates) {
      const result = await prisma.emailTemplate.upsert({
        where: { id: template.id },
        update: template,
        create: template
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
            permission_id: permission.id
          }
        },
        update: {},
        create: {
          role_id: adminRole.id,
          permission_id: permission.id
        }
      });
    }
    console.log("Role permissions assigned successfully");
  } catch (error) {
    console.error("Error assigning permissions to roles:", error);
    throw error;
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
