/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mcw/ui', '@mcw/utils', '@mcw/types'],
  reactStrictMode: true,
  // Add webpack configuration to handle node-pre-gyp
  webpack: (config, { isServer }) => {
    // Externalize problematic packages
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@mapbox/node-pre-gyp',
        'mock-aws-s3',
        'aws-sdk',
        'nock'
      ];
    }

    // Add support for native node modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any module aliases here if needed
    };

    return config;
  },
};

module.exports = nextConfig;