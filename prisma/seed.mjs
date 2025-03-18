import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create roles if they don't exist
  const backOfficeRole = await prisma.role.upsert({
    where: { name: 'BACKOFFICE' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'BACKOFFICE',
    },
  });

  console.log('Roles created:', backOfficeRole);

  // Create a test backoffice user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@example.com',
      password_hash: adminPassword,
      UserRole: {
        create: {
          role_id: backOfficeRole.id,
        },
      },
    },
  });

  console.log('BackOffice user created:', admin);

  // Create another test backoffice user (previously clinician)
  const clinicianPassword = await bcrypt.hash('clinician123', 10);
  const clinician = await prisma.user.upsert({
    where: { email: 'clinician@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'clinician@example.com',
      password_hash: clinicianPassword,
      UserRole: {
        create: {
          role_id: backOfficeRole.id,
        },
      },
    },
  });

  console.log('BackOffice user created:', clinician);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 