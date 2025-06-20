/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mcw/ui", "@mcw/utils", "@mcw/types", "@mcw/logger", "@mcw/email"],
  reactStrictMode: true,
  output: "standalone", // Add standalone output for Azure deployment

  experimental: {
    serverComponentsExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  },

  // Add webpack configuration to handle node-pre-gyp
  webpack: (config) => {
    // Externalize problematic packages
    config.externals = [
      ...(config.externals || []),
      "bcrypt",
      "mock-aws-s3",
      "aws-sdk",
      "nock",
    ];

    // Add support for native node modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any module aliases here if needed
    };

    return config;
  },

  // Optional: Enable correct handling of Azure App Service with reverse proxy
  assetPrefix: process.env.NODE_ENV === "production" ? undefined : undefined,
  basePath: "",
};

export default nextConfig;
