/* eslint-disable */
const path = require("path");
const fs = require("fs-extra");

// Paths
const appDir = path.resolve(__dirname);
const prismaDir = path.join(appDir, "../../packages/database/prisma");

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

  // Check if we need to create a simple package.json with just the essential dependencies
  const packageJsonPath = path.join(appDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Ensure the package has the most critical dependencies for standalone mode
      packageJson.dependencies = packageJson.dependencies || {};

      // Remove problematic private dependencies
      Object.keys(packageJson.dependencies).forEach((dep) => {
        if (dep.startsWith("@mcw/")) {
          delete packageJson.dependencies[dep];
        }
      });

      // Ensure essential dependencies for standalone
      const essentialDeps = {
        next: "^14.0.0",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      };

      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...essentialDeps,
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("Updated package.json for deployment");
    } catch (error) {
      console.error("Error updating package.json:", error);
    }
  }

  console.log("Back-office deployment preparation completed!");
}

// Run the function
prepareForDeployment().catch((error) => {
  console.error("Deployment preparation failed:", error);
  process.exit(1);
});
