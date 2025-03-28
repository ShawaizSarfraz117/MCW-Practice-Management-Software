import { PrismaClient } from "@prisma/client";
import { getDbLogger } from "@mcw/logger";
import { initialize } from "../generated/fabbrica/index.js";

const dbLogger = getDbLogger("prisma", "client");

const createPrismaClient = () => {
  return new PrismaClient({
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
};

// Set up global caching for development
const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};
// Create the Prisma client with logging enabled
const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Map Prisma log events to custom logger
prisma.$on("query", (e) => {
  try {
    dbLogger.debug(
      {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      },
      "Database query executed",
    );
  } catch {
    // Fallback to console if logger fails
    console.debug("Database query executed:", e.query);
  }
});

prisma.$on("info", (e) => {
  try {
    dbLogger.info(
      {
        message: e.message,
        target: e.target,
      },
      "Prisma info",
    );
  } catch {
    console.info("Prisma info:", e.message);
  }
});

prisma.$on("warn", (e) => {
  try {
    dbLogger.warn(
      {
        message: e.message,
        target: e.target,
      },
      "Prisma warning",
    );
  } catch {
    console.warn("Prisma warning:", e.message);
  }
});

prisma.$on("error", (e) => {
  try {
    dbLogger.error(
      {
        message: e.message,
        target: e.target,
      },
      "Prisma error",
    );
  } catch {
    console.error("Prisma error:", e.message);
  }
});

initialize({ prisma });

export { prisma };
export * from "@prisma/client";
