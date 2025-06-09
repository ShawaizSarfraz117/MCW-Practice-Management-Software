/* global console */

/**
 * Seeds permissions into the database
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 */
export async function seedPermissions(prisma) {
  console.log('Seeding permissions...');
  
  const permissions = [
    {
      name: 'View and create chart notes',
      slug: 'chart-notes-manage'
    },
    {
      name: 'View completed questionnaires and scored measures',
      slug: 'questionnaires-view'
    },
    {
      name: 'View and manage client documents',
      slug: 'client-documents-manage'
    },
    {
      name: 'View and manage intake documents',
      slug: 'intake-documents-manage'
    },
    {
      name: 'Access to all client records',
      slug: 'client-records-access'
    }
  ];

  // Create permissions if they don't exist
  for (const permission of permissions) {
    const result = await prisma.permission.upsert({
      where: { slug: permission.slug },
      update: {},
      create: {
        name: permission.name,
        slug: permission.slug
      }
    });
    console.log(`Created/Updated permission: ${result.name}`);
  }

  console.log('Permissions seeded successfully');
} 