import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

export const prisma = new PrismaClient();

// Seed test database with users
export async function seedTestDatabase() {
  try {
    // Set up the in-memory database
    process.env.DATABASE_URL = 'file::memory:?cache=shared';
    
    // Skip database operations in test mode and just mock the responses
    return {
      adminUser: {
        id: '1',
        email: 'admin@example.com',
        password_hash: await hash('admin123', 10),
      },
      clinicianUser: {
        id: '2',
        email: 'clinician@example.com',
        password_hash: await hash('clinician123', 10),
      },
    };
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase() {
  // No need to clean up since we're not actually using the database
  await prisma.$disconnect();
} 