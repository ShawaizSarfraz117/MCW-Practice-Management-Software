import { mockDeep } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

// Create a mock PrismaClient instance before any tests run
const mockPrisma = mockDeep<PrismaClient>();

// Mock the entire @mcw/database module
vi.mock('@mcw/database', () => ({
  prisma: mockPrisma
}));

// Add the mocked Prisma client to the global object for easier access in tests
globalThis.__prisma_mock__ = mockPrisma; 