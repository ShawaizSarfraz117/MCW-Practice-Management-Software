/* global console */
import bcrypt from "bcryptjs";
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

  // Create Clinician record for the clinician user
  const clinicianRecord = await prisma.clinician.upsert({
    where: { user_id: clinician.id },
    update: {},
    create: {
      id: uuidv4(),
      user_id: clinician.id,
      first_name: "Test",
      last_name: "Clinician",
      address: "123 Medical Center Drive, Suite 200, Boston, MA 02115",
      percentage_split: 70,
      is_active: true,
      speciality: "General Practice",
      NPI_number: "1234567890",
      taxonomy_code: "207Q00000X"
    }
  });

  console.log("Clinician record created for:", clinician.email);

  // Also create a Clinician record for the admin user (since admins are also clinicians)
  const adminClinicianRecord = await prisma.clinician.upsert({
    where: { user_id: admin.id },
    update: {},
    create: {
      id: uuidv4(),
      user_id: admin.id,
      first_name: "Admin",
      last_name: "User",
      address: "456 Healthcare Plaza, Floor 3, Boston, MA 02116",
      percentage_split: 100,
      is_active: true,
      speciality: "Practice Administrator",
      NPI_number: "9876543210",
      taxonomy_code: "363LF0000X"
    }
  });

  console.log("Clinician record created for admin:", admin.email);
  
  return { admin, clinician, clinicianRecord, adminClinicianRecord };
} 