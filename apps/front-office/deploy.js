/* eslint-disable */
const path = require("path");
const fs = require("fs-extra");

// Paths
const appDir = path.resolve(__dirname);
const buildDir = path.join(appDir, ".next");
const publicDir = path.join(appDir, "public");
const deployDir = path.join(appDir, "deploy");

// Create and clean deploy directory
console.log("Creating deployment package...");
fs.ensureDirSync(deployDir);
fs.emptyDirSync(deployDir);

// Copy Next.js build directory
if (fs.existsSync(buildDir)) {
  fs.copySync(buildDir, path.join(deployDir, ".next"));
  console.log("Copied Next.js build directory");
} else {
  console.error("Build directory not found! Run 'npm run build' first.");
  process.exit(1);
}

// Copy public folder if it exists
if (fs.existsSync(publicDir)) {
  fs.copySync(publicDir, path.join(deployDir, "public"));
  console.log("Copied public directory");
}

// Copy web.config
if (fs.existsSync(path.join(appDir, "web.config"))) {
  fs.copySync(
    path.join(appDir, "web.config"),
    path.join(deployDir, "web.config"),
  );
  console.log("Copied web.config");
} else {
  console.warn("web.config not found in app directory!");
}

// Copy package.json (required for npm start and dependencies)
if (fs.existsSync(path.join(appDir, "package.json"))) {
  fs.copySync(
    path.join(appDir, "package.json"),
    path.join(deployDir, "package.json"),
  );
  console.log("Copied package.json");

  // Modify package.json to remove cross-env dependency
  const packagePath = path.join(deployDir, "package.json");
  const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Update the start script to not use cross-env
  if (
    packageData.scripts &&
    packageData.scripts.start &&
    packageData.scripts.start.includes("cross-env")
  ) {
    packageData.scripts.start = "next start";
    console.log("Updated start script to remove cross-env dependency");
  }

  // Write the updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
} else {
  console.warn("package.json not found!");
}

// Copy next.config.js if it exists
if (fs.existsSync(path.join(appDir, "next.config.js"))) {
  fs.copySync(
    path.join(appDir, "next.config.js"),
    path.join(deployDir, "next.config.js"),
  );
  console.log("Copied next.config.js");
} else if (fs.existsSync(path.join(appDir, "next.config.mjs"))) {
  fs.copySync(
    path.join(appDir, "next.config.mjs"),
    path.join(deployDir, "next.config.mjs"),
  );
  console.log("Copied next.config.mjs");
}

// Create a .deployment file for Azure
fs.writeFileSync(
  path.join(deployDir, ".deployment"),
  `[config]\nSCM_DO_BUILD_DURING_DEPLOYMENT=false`,
);
console.log(
  "Created .deployment file to prevent Azure from rebuilding the app.",
);

console.log(`Deployment package created at: ${deployDir}`);
console.log("Set startup command in Azure to: npm start -- -p 8080");
