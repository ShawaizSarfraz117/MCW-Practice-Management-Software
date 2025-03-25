/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mcw/ui", "@mcw/utils", "@mcw/types"],
  reactStrictMode: true,
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
};

export default nextConfig;
