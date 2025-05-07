/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running back-office startup script...");
  console.log("Current directory:", process.cwd());
  console.log("Directory contents:", fs.readdirSync(__dirname));

  // Check for .next directory
  if (!fs.existsSync(path.join(__dirname, ".next"))) {
    console.error(
      "ERROR: .next directory not found! Application cannot start.",
    );
    console.log("Creating an empty .next directory for troubleshooting");
    fs.mkdirSync(path.join(__dirname, ".next"), { recursive: true });
  } else {
    console.log(
      ".next directory found:",
      fs.readdirSync(path.join(__dirname, ".next")),
    );
  }

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

    // Check for next executable paths
    try {
      console.log("Checking next executable path...");
      console.log(
        "Node modules directory:",
        fs.readdirSync(path.join(__dirname, "node_modules")),
      );

      if (fs.existsSync(path.join(__dirname, "node_modules", ".bin", "next"))) {
        console.log("Found next in node_modules/.bin");
      } else {
        console.log("next not found in .bin, checking in next/dist/bin");
        if (
          fs.existsSync(
            path.join(__dirname, "node_modules", "next", "dist", "bin"),
          )
        ) {
          console.log("Found next/dist/bin directory");
        } else {
          console.log("Could not find next executable!");
        }
      }
    } catch (error) {
      console.error("Error checking next paths:", error);
    }

    // Start the Next.js application
    console.log("Starting Next.js application using npm start...");
    try {
      execSync("npm start", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });
    } catch (npmError) {
      console.error("npm start failed:", npmError.message);

      // Try direct next binary
      console.log("Trying direct next binary...");
      execSync("node ./node_modules/next/dist/bin/next start -p 8080", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });
    }
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

      // Ultimate fallback - direct node command
      try {
        console.log("Trying ultimate fallback - direct node command...");
        const nextServerPath = path.join(
          __dirname,
          "node_modules",
          "next",
          "dist",
          "server",
          "next-server.js",
        );
        if (fs.existsSync(nextServerPath)) {
          execSync(`node ${nextServerPath} start -p 8080`, {
            stdio: "inherit",
            cwd: __dirname,
            env: process.env,
          });
        } else {
          console.error("Could not find next-server.js");
          process.exit(1);
        }
      } catch (ultimateError) {
        console.error("All start methods failed:", ultimateError);
        process.exit(1);
      }
    }
  }
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
