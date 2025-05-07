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
  console.log("Back-office deployment preparation completed!");
}

// Run the function
prepareForDeployment().catch((error) => {
  console.error("Deployment preparation failed:", error);
  process.exit(1);
});
