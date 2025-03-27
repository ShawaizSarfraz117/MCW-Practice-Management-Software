import { PrismaClient } from "@prisma/client";
import { getDbLogger } from "@mcw/logger";



// Define the event payload types
interface QueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface LogEvent {
  message: string;
  target: string;
  stack?: string;
}

const dbLogger = getDbLogger("prisma", "client");

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

// Set up global caching for development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prismaClient = globalForPrisma.prisma || prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

// Map Prisma log events to custom logger
(prismaClient as any).$on('query', (e: QueryEvent) => {
  try {
    dbLogger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target
    }, "Database query executed");
  } catch (err) {
    // Fallback to console if logger fails
    console.debug("Database query executed:", e.query);
  }
});

(prismaClient as any).$on('info', (e: LogEvent) => {
  try {
    dbLogger.info({
      message: e.message,
      target: e.target
    }, "Prisma info");
  } catch (err) {
    console.info("Prisma info:", e.message);
  }
});

(prismaClient as any).$on('warn', (e: LogEvent) => {
  try {
    dbLogger.warn({
      message: e.message,
      target: e.target
    }, "Prisma warning");
  } catch (err) {
    console.warn("Prisma warning:", e.message);
  }
});

(prismaClient as any).$on('error', (e: LogEvent) => {
  try {
    dbLogger.error({
      message: e.message,
      target: e.target,
      stack: e.stack
    }, "Prisma error");
  } catch (err) {
    console.error("Prisma error:", e.message, e.stack);
  }
});

export { prismaClient as prisma };
export * from "@prisma/client";