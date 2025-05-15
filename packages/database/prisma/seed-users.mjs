/* global console */
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

/**
 * Seeds users into the database
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 * @param {Object} roles - Object containing role references
 * @returns {Object} Created users
 */
export async function seedUsers(prisma, { adminRole, backOfficeRole }) {
  console.log('Seeding users...');
  
  // Create a test backoffice user with admin role
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

  console.log("Admin user created:", admin.email);

  // Create another test backoffice user with clinician role
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

  console.log("Clinician user created:", clinician.email);
  
  return { admin, clinician };
} 