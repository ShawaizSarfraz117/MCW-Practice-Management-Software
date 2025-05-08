/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

// Paths
const nextAppDir = path.resolve(__dirname);
const standaloneBuildDir = path.join(nextAppDir, ".next/standalone");
const staticDir = path.join(nextAppDir, ".next/static");
const publicDir = path.join(nextAppDir, "public");
const rootDir = path.resolve(nextAppDir, "../..");
const databaseDir = path.join(rootDir, "packages/database");
const prismaDir = path.join(databaseDir, "prisma");
const webConfigPath = path.join(nextAppDir, "web.config");
const startupJsPath = path.join(nextAppDir, "startup.js");

// Check if output: 'standalone' is set in next.config.js
console.log("Checking Next.js config...");
const configFile = fs.existsSync("next.config.js")
  ? "next.config.js"
  : "next.config.mjs";
const configContent = fs.readFileSync(configFile, "utf8");
if (
  !configContent.includes("output: 'standalone'") &&
  !configContent.includes('output: "standalone"')
) {
  console.log("Warning: output: 'standalone' is not set in next.config.js.");
  console.log("Please add it to your configuration for proper deployment.");
  process.exit(1);
}

// Build the Next.js app with standalone output
console.log("Building Next.js app in standalone mode...");
try {
  // Using npm instead of pnpm
  execSync("npm run build", { stdio: "inherit", cwd: nextAppDir });
  console.log("Build completed successfully.");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}

// Create deployment package
console.log("Creating deployment package...");
const deployDir = path.join(nextAppDir, "deploy");
fs.ensureDirSync(deployDir);
fs.emptyDirSync(deployDir);

// Copy files directly from standalone to root level
console.log("Copying standalone build files to root level...");
if (fs.existsSync(standaloneBuildDir)) {
  // Copy files from standalone dir to root of deploy dir
  const standaloneFiles = fs.readdirSync(standaloneBuildDir);
  for (const file of standaloneFiles) {
    const srcPath = path.join(standaloneBuildDir, file);

    // Skip the packages or apps directory to prevent nesting
    if (file === "packages" || file === "apps") {
      console.log(`Skipping nested directory: ${file}`);
      continue;
    }

    const destPath = path.join(deployDir, file);
    fs.copySync(srcPath, destPath, { overwrite: true });
    console.log(`Copied ${file} to root level`);
  }

  // If there's a nested app directory in standalone with our app
  const appPath = path.join(standaloneBuildDir, "apps", "back-office");
  if (fs.existsSync(appPath)) {
    const appFiles = fs.readdirSync(appPath);
    for (const file of appFiles) {
      const srcPath = path.join(appPath, file);
      const destPath = path.join(deployDir, file);
      fs.copySync(srcPath, destPath, { overwrite: true });
      console.log(`Copied nested app file ${file} to root level`);
    }
  }

  console.log("Copied standalone build to root level.");
} else {
  console.error(
    'Standalone build directory not found. Make sure your next.config.js includes output: "standalone"',
  );
  process.exit(1);
}

// Copy static assets to the correct locations
console.log("Copying static assets to correct locations...");

// 1. Copy to the standard Next.js location
fs.copySync(staticDir, path.join(deployDir, ".next/static"), {
  overwrite: true,
});

// 2. Copy to a root level _next/static folder for absolute paths
fs.copySync(staticDir, path.join(deployDir, "_next/static"), {
  overwrite: true,
});

console.log(
  "Copied static assets to multiple locations for better compatibility.",
);

// Copy public folder to deployment package
if (fs.existsSync(publicDir)) {
  fs.copySync(publicDir, path.join(deployDir, "public"), { overwrite: true });
  console.log("Copied public directory.");

  // Also copy public files to root for absolute path references
  const files = fs.readdirSync(publicDir);
  files.forEach((file) => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(deployDir, file);
    if (fs.lstatSync(srcPath).isFile()) {
      fs.copySync(srcPath, destPath, { overwrite: true });
    }
  });
}

// Copy Prisma directory to deployment package
if (fs.existsSync(prismaDir)) {
  // Create the database package structure in the deployment directory
  const deployPrismaDir = path.join(deployDir, "prisma");
  fs.ensureDirSync(deployPrismaDir);

  // Copy all Prisma files including schema.prisma, migrations, etc.
  fs.copySync(prismaDir, deployPrismaDir, { overwrite: true });
  console.log(
    "Copied Prisma directory to deployment package:",
    deployPrismaDir,
  );
} else {
  console.warn("Prisma directory not found at:", prismaDir);
}

// Handle native modules if they exist in node_modules
const nativeModules = [
  "bcrypt",
  // Add other native modules if needed
];

for (const moduleName of nativeModules) {
  const modulePath = path.join(nextAppDir, "node_modules", moduleName);
  if (fs.existsSync(modulePath)) {
    const destPath = path.join(deployDir, "node_modules", moduleName);
    fs.ensureDirSync(path.dirname(destPath));
    fs.copySync(modulePath, destPath, { overwrite: true });
    console.log(`Copied native module: ${moduleName}`);
  }
}

// Copy web.config from project to deployment
if (fs.existsSync(webConfigPath)) {
  fs.copyFileSync(webConfigPath, path.join(deployDir, "web.config"));
  console.log("Copied web.config from project.");
} else {
  console.error(
    "Error: Required web.config file not found in project directory!",
  );
  process.exit(1);
}

// Copy startup.js from project to deployment
if (fs.existsSync(startupJsPath)) {
  fs.copyFileSync(startupJsPath, path.join(deployDir, "startup.js"));
  console.log("Copied startup.js from project.");
} else {
  console.error(
    "Error: Required startup.js file not found in project directory!",
  );
  process.exit(1);
}

// Create a deployment package.json with start script
const packageJson = {
  name: "back-office-azure",
  version: "1.0.0",
  private: true,
  scripts: {
    start: "node startup.js",
  },
  engines: {
    node: ">=18.0.0",
  },
  dependencies: {
    "@prisma/client": "*",
    prisma: "*",
  },
};

// Add native module dependencies if they exist
for (const moduleName of nativeModules) {
  const modulePath = path.join(nextAppDir, "node_modules", moduleName);
  if (fs.existsSync(modulePath)) {
    packageJson.dependencies[moduleName] = "*";
  }
}

fs.writeFileSync(
  path.join(deployDir, "package.json"),
  JSON.stringify(packageJson, null, 2),
);
console.log("Created deployment package.json");

// Create a .deployment file for Azure
const deploymentConfig = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false`;

fs.writeFileSync(path.join(deployDir, ".deployment"), deploymentConfig);
console.log("Created .deployment file.");

console.log("Deployment package created at:", deployDir);
console.log(
  "You can now deploy the contents of this directory to Azure App Service.",
);
