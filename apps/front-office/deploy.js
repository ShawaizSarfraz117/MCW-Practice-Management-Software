/* eslint-disable */
const path = require("path");
const fs = require("fs-extra");

// Paths
const appDir = path.resolve(__dirname);

// Main function
async function prepareForDeployment() {
  console.log("Preparing front-office for deployment...");

  // No need to create web.config or .deployment files anymore
  // as they are already in the repository

  console.log("Front-office deployment preparation completed!");
}

// Run the function
prepareForDeployment().catch((error) => {
  console.error("Deployment preparation failed:", error);
  process.exit(1);
});
