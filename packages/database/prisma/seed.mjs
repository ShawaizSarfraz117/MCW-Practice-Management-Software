/* global console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import process from "process";

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

  console.log("Role created or found:", backOfficeRole);

  // Create a test backoffice user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: uuidv4(),
      email: "admin@example.com",
      password_hash: adminPassword,
      UserRole: {
        create: {
          role_id: adminRole.id,
        },
      },
      date_of_birth: new Date("1985-06-15"),
      phone: "+1 (555) 987-6543",
      profile_photo:
        "https://ui-avatars.com/api/?name=Clinician&background=2d8467&color=fff",
    },
  });

  console.log("BackOffice user created:", admin);

  // Create another test backoffice user (previously clinician)
  const clinicianPassword = await bcrypt.hash("clinician123", 10);
  const clinician = await prisma.user.upsert({
    where: { email: "clinician@example.com" },
    update: {},
    create: {
      id: uuidv4(),
      email: "clinician@example.com",
      password_hash: clinicianPassword,
      UserRole: {
        create: {
          role_id: backOfficeRole.id,
        },
      },
      date_of_birth: new Date("1985-06-15"),
      phone: "+1 (555) 987-6543",
      profile_photo:
        "https://ui-avatars.com/api/?name=Clinician&background=2d8467&color=fff",
    },
  });

  console.log("BackOffice user created:", clinician);

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

  console.log("Created sample audit entries");

  // Create email templates
  const emailTemplates = [
    {
      id: "62798300-50F5-4CEE-888C-1DF486A7C28A",
      name: "Reminder Template Name",
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
      created_by: "B10575A0-9F42-414A-AFB2-23A210A01396"
    },
    {
      id: "FDB356C0-930B-40D8-B159-35DD073E7BAB",
      name: "Reminder Template Name",
      subject: "Reminder Subject",
      content: "This is a reminder email content.",
      type: "billing",
      is_active: true,
      is_enabled: true,
      reminder_time: 48,
      include_attachments: false,
      send_to_client: true,
      send_to_clinician: false,
      send_to_practice: false,
      created_at: new Date("2025-05-06T18:37:23.203Z"),
      updated_at: new Date("2025-05-06T18:37:23.203Z"),
      created_by: "563BBE74-AD62-4627-91D4-6E746171116D"
    },
    {
      id: "E7C9CF28-4EF9-4A37-B0F2-7CD44DDDFC27",
      name: "Welcome",
      subject: "Welcome from {{client_full_name}}",
      content: "{{client_first_name}} offers a secure Client Portal to manage care with ease.\n\nBefore your visit, {{clinician_first_name}} would like you to complete practice documents. Sign in to your Client Portal to get started.\n\n{link}\n{{appointment_reminder_links}}",
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
      created_by: "DF9E840E-CAF9-40A4-9956-F4D233B84341"
    }
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template
    });
  }

  console.log("Created email templates");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
