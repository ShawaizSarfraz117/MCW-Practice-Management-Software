/* eslint-disable */
const path = require("path");
const fs = require("fs-extra");

// Paths
const appDir = path.resolve(__dirname);
const prismaDir = path.join(appDir, "../../packages/database/prisma");
const rootDir = path.join(appDir, "../..");

// Main function
async function prepareForDeployment() {
  console.log("Preparing back-office for deployment...");

  // Copy Prisma directory for database access
  if (fs.existsSync(prismaDir)) {
    const destPrismaDir = path.join(appDir, "packages/database/prisma");
    fs.ensureDirSync(path.dirname(destPrismaDir));
    fs.copySync(prismaDir, destPrismaDir);
    console.log("Copied Prisma directory for deployment");
  }

  // Update package.json start script
  const packageJsonPath = path.join(appDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Simply update the start script to use Next.js directly
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.start = "next start -p 8080";

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("Updated package.json start script to: next start -p 8080");
    } catch (error) {
      console.error("Error updating package.json:", error);
    }
  }

  // Copy node_modules from root to app directory
  const rootNodeModules = path.join(rootDir, "node_modules");
  const appNodeModules = path.join(appDir, "node_modules");

  if (fs.existsSync(rootNodeModules)) {
    console.log("Copying node_modules to deployment directory...");
    try {
      // Ensure target directory exists and is empty
      fs.ensureDirSync(appNodeModules);

      // Copy node_modules
      fs.copySync(rootNodeModules, appNodeModules);
      console.log("Successfully copied node_modules to deployment directory");
    } catch (error) {
      console.error("Error copying node_modules:", error);
    }
  } else {
    console.warn(
      "Root node_modules directory not found, cannot copy dependencies",
    );
  }

  console.log("Back-office deployment preparation completed!");
}

// Run the function
prepareForDeployment().catch((error) => {
  console.error("Deployment preparation failed:", error);
  process.exit(1);
});
