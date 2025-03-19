const { PrismaClient } = require('@prisma/client');
// Set environment variables for testing
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test'; 

// jest.setup.js

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set the database URL to an in-memory SQLite database
  process.env.DATABASE_URL = 'file:memory:';

  // Initialize the database (Prisma will apply migrations automatically)
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect the Prisma client after all tests
  await prisma.$disconnect();
});

afterEach(async () => {
});