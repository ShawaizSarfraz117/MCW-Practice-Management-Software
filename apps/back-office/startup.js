/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running back-office startup script...");

  const packageJsonPath = path.join(__dirname, "package.json");
  console.log(`Updating start script in ${packageJsonPath}`);

  try {
    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Store the original start script for logging
    const originalStartScript = packageJson.scripts.start;
    console.log(`Original start script: ${originalStartScript}`);

    // Update the start script to not use cross-env
    packageJson.scripts.start = "next start -p 8080";
    console.log(`Updated start script to: ${packageJson.scripts.start}`);

    // Write the modified package.json back to disk
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("Successfully updated package.json");

    const dbDir = path.join(__dirname, "packages/database");

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
    console.log("Starting Next.js application using npm start...");
    execSync("npm start", {
      stdio: "inherit",
      cwd: __dirname,
      env: process.env,
    });
  } catch (error) {
    console.error("Error in startup script:", error);
    console.log("Attempting to start directly with npx next...");

    // Fallback to direct next start if anything fails
    try {
      execSync("npx next start -p 8080", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });
    } catch (fallbackError) {
      console.error("Failed to start with fallback method:", fallbackError);
      process.exit(1);
    }
  }
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
