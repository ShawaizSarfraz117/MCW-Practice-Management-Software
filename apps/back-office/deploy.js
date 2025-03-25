const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Paths
const nextAppDir = path.resolve(__dirname);
const standaloneBuildDir = path.join(nextAppDir, '.next/standalone');
const staticDir = path.join(nextAppDir, '.next/static');
const publicDir = path.join(nextAppDir, 'public');

// Make sure Next.js config has output: 'standalone'
// Create a backup of the original next.config file
const configFile = fs.existsSync('next.config.js') ? 'next.config.js' : 'next.config.mjs';
fs.copyFileSync(configFile, `${configFile}.backup`);

// Update the config to ensure it has standalone output
const configContent = fs.readFileSync(configFile, 'utf8');
if (!configContent.includes("output: 'standalone'") && !configContent.includes('output: "standalone"')) {
  console.log(`Adding 'output: standalone' to ${configFile}`);
  const updatedConfig = configContent.replace(
    /const nextConfig = {/,
    "const nextConfig = {\n  output: 'standalone',"
  );
  fs.writeFileSync(configFile, updatedConfig);
}

// Build the Next.js app with standalone output
console.log('Building Next.js app in standalone mode...');
try {
  // Using npm instead of pnpm
  execSync('npm run build', { stdio: 'inherit', cwd: nextAppDir });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Create deployment package
console.log('Creating deployment package...');
const deployDir = path.join(nextAppDir, 'deploy');
fs.ensureDirSync(deployDir);
fs.emptyDirSync(deployDir);

// Copy standalone build - includes server.js and dependencies
if (fs.existsSync(standaloneBuildDir)) {
  fs.copySync(standaloneBuildDir, deployDir, { overwrite: true });
  console.log('Copied standalone build.');
} else {
  console.error('Standalone build directory not found. Make sure your next.config.js includes output: "standalone"');
  process.exit(1);
}

// Copy .next/static to .next/static in the deployment package
fs.copySync(
  staticDir,
  path.join(deployDir, '.next/static'),
  { overwrite: true }
);
console.log('Copied static assets.');

// Copy public folder to deployment package
if (fs.existsSync(publicDir)) {
  fs.copySync(publicDir, path.join(deployDir, 'public'), { overwrite: true });
  console.log('Copied public directory.');
}

// Handle native modules if they exist in node_modules
const nativeModules = [
  'bcrypt',
  // Add other native modules if needed
];

for (const moduleName of nativeModules) {
  const modulePath = path.join(nextAppDir, 'node_modules', moduleName);
  if (fs.existsSync(modulePath)) {
    const destPath = path.join(deployDir, 'node_modules', moduleName);
    fs.ensureDirSync(path.dirname(destPath));
    fs.copySync(modulePath, destPath, { overwrite: true });
    console.log(`Copied native module: ${moduleName}`);
  }
}

// Create web.config for Azure
const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NextJS">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>`;

fs.writeFileSync(path.join(deployDir, 'web.config'), webConfig);
console.log('Created web.config for Azure.');

// Create a deployment package.json with start script
const packageJson = {
  name: "back-office-azure",
  version: "1.0.0",
  private: true,
  scripts: {
    "start": "node server.js"
  },
  engines: {
    "node": ">=18.0.0"
  },
  // Include dependencies for native modules if needed
  dependencies: {}
};

// Add native module dependencies if they exist
for (const moduleName of nativeModules) {
  const modulePath = path.join(nextAppDir, 'node_modules', moduleName);
  if (fs.existsSync(modulePath)) {
    packageJson.dependencies[moduleName] = "*";
  }
}

fs.writeFileSync(
  path.join(deployDir, 'package.json'), 
  JSON.stringify(packageJson, null, 2)
);
console.log('Created deployment package.json');

// Create a .deployment file for Azure
const deploymentConfig = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false`;

fs.writeFileSync(path.join(deployDir, '.deployment'), deploymentConfig);
console.log('Created .deployment file to prevent Azure from rebuilding the app.');

// Restore the original next.config if we created a backup
if (fs.existsSync(`${configFile}.backup`)) {
  fs.copyFileSync(`${configFile}.backup`, configFile);
  fs.unlinkSync(`${configFile}.backup`);
  console.log(`Restored original ${configFile}`);
}

console.log('Deployment package created at:', deployDir);
console.log('You can now deploy the contents of this directory to Azure App Service.');