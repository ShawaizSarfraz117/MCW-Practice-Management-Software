/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function startup() {
  console.log("Running front-office startup script...");
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
        name: "front-office-runtime-deps",
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

      // Install only what's needed
      console.log("Running npm install for critical dependencies");
      execSync("npm install --omit=dev --no-package-lock", {
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

  // Start the Next.js application
  console.log("Starting Next.js application...");
  try {
    // Try the direct path first
    if (
      fs.existsSync(
        path.join(__dirname, "node_modules", "next", "dist", "bin", "next"),
      )
    ) {
      execSync("node ./node_modules/next/dist/bin/next start -p 8080", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });
    } else {
      // Fall back to npm start which uses the modified package.json
      execSync("npm start", {
        stdio: "inherit",
        cwd: __dirname,
        env: process.env,
      });
    }
  } catch (error) {
    console.error("Error starting Next.js:", error);

    // Ultimate fallback - try npx
    console.log("Attempting to start with npx next...");
    execSync("npx next start -p 8080", {
      stdio: "inherit",
      cwd: __dirname,
      env: process.env,
    });
  }
}

startup().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
