/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Starting application with database migrations...");

// Run database migrations
try {
  console.log("Running database migrations...");

  // Check if Prisma directory exists
  const prismaDir = path.join(process.cwd(), "prisma");
  if (fs.existsSync(prismaDir)) {
    console.log("Found Prisma directory at:", prismaDir);

    // Run the migration
    console.log("Executing Prisma migrations...");
    execSync("npx prisma migrate deploy --schema=./prisma/schema.prisma", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("Database migrations completed successfully.");
  } else {
    console.warn("Prisma directory not found. Skipping migrations.");
  }
} catch (error) {
  console.error("Failed to run migrations:", error.message);
  // Continue with server startup even if migrations fail
  console.warn("Continuing with server startup despite migration failure");
}

// Start the Next.js server
console.log("Starting Next.js server...");
const server = require("./server.js");
