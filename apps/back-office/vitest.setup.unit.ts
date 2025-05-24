import mockPrisma from "@mcw/database/mock";
import { vi } from "vitest";

// Mock the entire @mcw/database module
vi.mock("@mcw/database", async () => ({
  ...(await vi.importActual("@mcw/database")),
  prisma: mockPrisma,
}));

// Partially mock @mcw/logger to provide getDbLogger
vi.mock("@mcw/logger", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getDbLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  };
});
