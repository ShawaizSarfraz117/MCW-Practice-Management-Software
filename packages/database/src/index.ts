import { PrismaClient } from "@prisma/client";
import { logger } from "@mcw/logger";

// Create a database-specific logger
const dbLogger = logger.child({
  component: "prisma",
});

// Create the Prisma client with logging enabled
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
    {
      emit: "event",
      level: "error",
    },
  ],
});

// Set up global caching (keeping your existing pattern)
const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Map Prisma log events to your custom logger
prisma.$on("query", (e) => {
  const prismaLogLevel = process.env.LOG_LEVEL_PRISMA || 'info';
  if (prismaLogLevel === 'debug' || prismaLogLevel === 'trace') {
    dbLogger.debug({
      query: e.query,
    }, "DB Query");
  }
});

prisma.$on("info", (e) => {
  dbLogger.info(e.message);
});

prisma.$on("warn", (e) => {
  dbLogger.warn(e.message);
});

prisma.$on("error", (e) => {
  dbLogger.error(e.message);
});

export { prisma };
export * from "@prisma/client";