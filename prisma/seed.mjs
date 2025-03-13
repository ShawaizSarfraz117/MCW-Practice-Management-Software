import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create roles if they don't exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'ADMIN',
    },
  });

  const clinicianRole = await prisma.role.upsert({
    where: { name: 'CLINICIAN' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'CLINICIAN',
    },
  });

  console.log('Roles created:', adminRole, clinicianRole);

  // Create a test admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@example.com',
      password_hash: adminPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: {
        create: {
          role_id: adminRole.id,
        },
      },
    },
  });

  console.log('Admin user created:', admin);

  // Create a test clinician user
  const clinicianPassword = await bcrypt.hash('clinician123', 10);
  const clinician = await prisma.user.upsert({
    where: { email: 'clinician@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'clinician@example.com',
      password_hash: clinicianPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: {
        create: {
          role_id: clinicianRole.id,
        },
      },
    },
  });

  console.log('Clinician user created:', clinician);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 