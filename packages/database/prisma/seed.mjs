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
    },
  });

  console.log("BackOffice user created:", clinician);

  // Create sample audit entries
  const auditEntries = [
    {
      id: uuidv4(),
      event_type: "LOGIN",
      event_text: "User logged into the system",
      is_hipaa: false,
      datetime: new Date(),
      user_id: admin.id, // Link to admin user
    },
    {
      id: uuidv4(),
      event_type: "VIEW",
      event_text: "Viewed client medical records",
      is_hipaa: true,
      datetime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      user_id: clinician.id, // Link to clinician user
    },
    {
      id: uuidv4(),
      event_type: "UPDATE",
      event_text: "Updated appointment details",
      is_hipaa: false,
      datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      user_id: admin.id,
    },
    {
      id: uuidv4(),
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
