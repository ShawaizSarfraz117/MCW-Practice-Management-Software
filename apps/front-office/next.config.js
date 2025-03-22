/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mcw/ui', '@mcw/utils', '@mcw/types'],
  reactStrictMode: true,
};

module.exports = nextConfig; 