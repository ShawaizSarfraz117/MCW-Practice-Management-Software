import mockPrisma from '@mcw/database/mock';
import { vi } from 'vitest';

// Mock the entire @mcw/database module
vi.mock('@mcw/database', async () => ({
  ...(await vi.importActual('@mcw/database')),
  prisma: mockPrisma,
}));