import mockPrisma from "@mcw/database/mock";
import { vi } from "vitest";

// Mock the entire @mcw/database module
vi.mock("@mcw/database", async () => ({
  ...(await vi.importActual("@mcw/database")),
  prisma: mockPrisma,
}));

// Mock the @mcw/logger module
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
  __esModule: true,
}));
