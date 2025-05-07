/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running back-office startup script...");
  console.log("Current directory:", process.cwd());
  console.log("Directory contents:", fs.readdirSync(__dirname));

  // Ensure .next directory exists
  if (!fs.existsSync(path.join(__dirname, ".next"))) {
    console.error(
      "ERROR: .next directory not found! App may not start correctly.",
    );
  } else {
    console.log(".next directory exists");
  }

  // Setup Prisma schema for migrations
  const dbDir = path.join(__dirname, "packages/database");
  if (!fs.existsSync(path.join(dbDir, "prisma"))) {
    console.warn(
      "Prisma directory not found. Migrations may not run correctly.",
    );
  }

  // Run Prisma migrations if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    console.log("Running database migrations...");
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        cwd: dbDir,
        env: process.env,
      });
      console.log("Database migrations completed successfully!");
    } catch (error) {
      console.error("Failed to run migrations:", error.message);
      console.log(
        "Continuing with application startup despite migration issues...",
      );
    }
  } else {
    console.warn(
      "Warning: DATABASE_URL environment variable not found. Skipping database migrations.",
    );
  }

  // Start the Next.js application
  console.log("Starting Next.js application...");
  try {
    execSync("npx next start -p 8080", {
      stdio: "inherit",
      cwd: __dirname,
      env: process.env,
    });
  } catch (error) {
    console.error("Error starting Next.js application:", error);
    process.exit(1);
  }
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
