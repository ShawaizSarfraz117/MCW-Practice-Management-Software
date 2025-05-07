/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running back-office startup script...");

  const dbDir = path.join(__dirname, "packages/database");

  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.warn(
        "Warning: DATABASE_URL environment variable not found. Skipping database migrations.",
      );
    } else {
      console.log("Running database migrations...");
      // Run migrations if DATABASE_URL is available
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        cwd: dbDir,
        env: process.env,
      });
      console.log("Database migrations completed successfully!");
    }
  } catch (error) {
    console.error("Failed to run migrations:", error.message);
    console.log(
      "Continuing with application startup despite migration issues...",
    );
  }

  // Start the Next.js application
  console.log("Starting Next.js application...");
  execSync("npx next start -p 8080", {
    stdio: "inherit",
    cwd: __dirname,
    env: process.env,
  });
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
