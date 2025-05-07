/* eslint-disable */
const path = require("path");
const fs = require("fs-extra");
const { execSync } = require("child_process");

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

  // Create web.config for Azure/IIS compatibility
  const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="node_modules/next/dist/bin/next" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent" stopProcessing="true">
          <match url="(^.*(\.js|\.css|\.svg|\.ttf|\.woff|\.woff2|\.jpg|\.jpeg|\.png|\.gif|\.ico|\.json)$)" ignoreCase="true" />
          <action type="None" />
        </rule>
        <rule name="NextJS">
          <match url="/*" />
          <action type="Rewrite" url="node_modules/next/dist/bin/next" />
        </rule>
      </rules>
    </rewrite>
    <iisnode watchedFiles="web.config;*.js" />
  </system.webServer>
</configuration>`;

  fs.writeFileSync(path.join(appDir, "web.config"), webConfig);
  console.log("Created web.config for Azure");

  // Create a .deployment file to prevent Azure from rebuilding
  fs.writeFileSync(
    path.join(appDir, ".deployment"),
    `[config]\nSCM_DO_BUILD_DURING_DEPLOYMENT=false`,
  );
  console.log(
    "Created .deployment file to prevent Azure from rebuilding the app",
  );

  console.log("Back-office deployment preparation completed!");
}

// Run the function
prepareForDeployment().catch((error) => {
  console.error("Deployment preparation failed:", error);
  process.exit(1);
});
