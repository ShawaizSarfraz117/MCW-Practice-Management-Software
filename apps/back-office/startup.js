/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running back-office startup script...");
  console.log("Current directory:", process.cwd());
  console.log("Directory contents:", fs.readdirSync(__dirname));

  // Check for critical dependencies
  const hasNext = fs.existsSync(path.join(__dirname, "node_modules", "next"));
  const hasReact = fs.existsSync(path.join(__dirname, "node_modules", "react"));
  const hasReactDom = fs.existsSync(
    path.join(__dirname, "node_modules", "react-dom"),
  );
  console.log(
    `Dependencies check - Next.js: ${hasNext}, React: ${hasReact}, ReactDOM: ${hasReactDom}`,
  );

  // Install critical dependencies if missing
  if (!hasNext || !hasReact || !hasReactDom) {
    console.log("Installing critical dependencies...");
    try {
      // Create a minimal package.json for installation
      const tempPackageJson = {
        name: "back-office-runtime-deps",
        private: true,
        dependencies: {
          next: "^14.2.25",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
      };

      // Write temporary package.json for npm install
      const tempPackagePath = path.join(__dirname, "temp-package.json");
      fs.writeFileSync(
        tempPackagePath,
        JSON.stringify(tempPackageJson, null, 2),
      );

      // Install only what's needed (excluding private @mcw/* packages)
      console.log("Running npm install for critical dependencies");
      execSync("npm install --no-package-lock --no-save next react react-dom", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });

      // Clean up
      fs.unlinkSync(tempPackagePath);
      console.log("Dependency installation complete");
    } catch (error) {
      console.error("Failed to install dependencies:", error);
      // Continue anyway, we'll try to run with what we have
    }
  }

  // Ensure .next directory exists
  if (!fs.existsSync(path.join(__dirname, ".next"))) {
    console.error(
      "ERROR: .next directory not found! App may not start correctly.",
    );
  } else {
    console.log(".next directory exists");
  }

  // Update package.json start script
  const packageJsonPath = path.join(__dirname, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      // Read the package.json file
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Update the start script to not use cross-env
      packageJson.scripts.start = "next start -p 8080";
      console.log(`Updated start script to: ${packageJson.scripts.start}`);

      // Write the modified package.json back to disk
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("Successfully updated package.json");
    } catch (error) {
      console.error("Error updating package.json:", error);
      // Continue anyway
    }
  } else {
    console.warn("package.json not found, skipping update");
  }

  // Setup Prisma schema for migrations
  const dbDir = path.join(__dirname, "packages/database");
  if (!fs.existsSync(path.join(dbDir, "prisma"))) {
    try {
      console.log("Creating Prisma schema directory");
      fs.mkdirSync(path.join(dbDir, "prisma"), { recursive: true });

      // Copy schema.prisma file if found in parent directories
      const possibleSchemaLocations = [
        path.join(
          __dirname,
          "..",
          "..",
          "packages",
          "database",
          "prisma",
          "schema.prisma",
        ),
        path.join(
          __dirname,
          "..",
          "packages",
          "database",
          "prisma",
          "schema.prisma",
        ),
      ];

      for (const schemaPath of possibleSchemaLocations) {
        if (fs.existsSync(schemaPath)) {
          console.log(`Found schema at ${schemaPath}, copying to deployment`);
          fs.copyFileSync(
            schemaPath,
            path.join(dbDir, "prisma", "schema.prisma"),
          );
          break;
        }
      }
    } catch (error) {
      console.error("Error setting up Prisma schema:", error);
    }
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

  // Start the Next.js application with appropriate method
  console.log("Starting Next.js application...");
  try {
    // Try using npx next
    execSync("npx next start -p 8080", {
      stdio: "inherit",
      cwd: __dirname,
      env: process.env,
    });
  } catch (error) {
    console.error("Error starting Next.js:", error);

    // Try local next binary
    try {
      if (fs.existsSync(path.join(__dirname, "node_modules", ".bin", "next"))) {
        execSync("node ./node_modules/.bin/next start -p 8080", {
          stdio: "inherit",
          cwd: __dirname,
          env: process.env,
        });
      } else {
        console.error("Cannot find next binary. Exiting.");
        process.exit(1);
      }
    } catch (finalError) {
      console.error("All start attempts failed:", finalError);
      process.exit(1);
    }
  }
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
