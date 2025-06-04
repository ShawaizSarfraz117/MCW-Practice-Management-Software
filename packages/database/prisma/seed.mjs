/* global console */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import process from "process";
import { seedPermissions } from "./seed-permissions.mjs";
import { seedUsers } from "./seed-users.mjs";
import { seedSurveys } from "./seed-surveys.mjs";

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
  const { admin, clinician, clinicianRecord, adminClinicianRecord } = await seedUsers(prisma, { adminRole, backOfficeRole });

  // Create locations
  console.log('Seeding locations...');
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
      color: "#2d8467"
    }
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
      color: "#4f46e5"
    }
  });
  console.log("Locations created");

  // Create practice services
  console.log('Seeding practice services...');
  const services = [
    {
      id: uuidv4(),
      type: "Individual Therapy",
      rate: 150.00,
      code: "90834",
      description: "Individual psychotherapy, 45 minutes",
      duration: 45,
      color: "#10b981",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: true
    },
    {
      id: uuidv4(),
      type: "Initial Evaluation",
      rate: 200.00,
      code: "90791",
      description: "Psychiatric diagnostic evaluation",
      duration: 60,
      color: "#f59e0b",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: false
    },
    {
      id: uuidv4(),
      type: "Group Therapy",
      rate: 75.00,
      code: "90853",
      description: "Group psychotherapy",
      duration: 90,
      color: "#8b5cf6",
      allow_new_clients: false,
      available_online: false,
      bill_in_units: false,
      is_default: false
    },
    {
      id: uuidv4(),
      type: "Family Therapy",
      rate: 175.00,
      code: "90847",
      description: "Family psychotherapy with patient present",
      duration: 50,
      color: "#ef4444",
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
      is_default: false
    }
  ];

  const createdServices = [];
  for (const service of services) {
    const created = await prisma.practiceService.upsert({
      where: { id: service.id },
      update: {},
      create: service
    });
    createdServices.push(created);
  }
  console.log("Practice services created");

  // Link clinicians to locations
  console.log('Linking clinicians to locations...');
  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: clinicianRecord.id,
        location_id: mainLocation.id
      }
    },
    update: {},
    create: {
      clinician_id: clinicianRecord.id,
      location_id: mainLocation.id,
      is_primary: true
    }
  });

  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: adminClinicianRecord.id,
        location_id: mainLocation.id
      }
    },
    update: {},
    create: {
      clinician_id: adminClinicianRecord.id,
      location_id: mainLocation.id,
      is_primary: true
    }
  });

  await prisma.clinicianLocation.upsert({
    where: {
      clinician_id_location_id: {
        clinician_id: adminClinicianRecord.id,
        location_id: satelliteLocation.id
      }
    },
    update: {},
    create: {
      clinician_id: adminClinicianRecord.id,
      location_id: satelliteLocation.id,
      is_primary: false
    }
  });
  console.log("Clinician locations linked");

  // Link clinicians to services
  console.log('Linking clinicians to services...');
  for (const service of createdServices) {
    // Clinician offers all services
    await prisma.clinicianServices.upsert({
      where: {
        clinician_id_service_id: {
          clinician_id: clinicianRecord.id,
          service_id: service.id
        }
      },
      update: {},
      create: {
        clinician_id: clinicianRecord.id,
        service_id: service.id,
        is_active: true
      }
    });

    // Admin offers only individual and evaluation services
    if (service.type === "Individual Therapy" || service.type === "Initial Evaluation") {
      await prisma.clinicianServices.upsert({
        where: {
          clinician_id_service_id: {
            clinician_id: adminClinicianRecord.id,
            service_id: service.id
          }
        },
        update: {},
        create: {
          clinician_id: adminClinicianRecord.id,
          service_id: service.id,
          is_active: true
        }
      });
    }
  }
  console.log("Clinician services linked");

  // Create licenses for clinicians
  console.log('Creating licenses for clinicians...');
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
      state: "MA"
    }
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
      state: "MA"
    }
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
      subject: "Appointment Reminder for {{client_full_name}}",
      content: "Hi {client_first_name},\n\nThis is a reminder that you have an appointment with {practice_full_name} at {appointment_time} on {appointment_date}.\n\nAdd to your Calendar:\n{appointment_reminder_links}\n",
      type: "reminder",
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

  // Seed survey templates
  await seedSurveys(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
