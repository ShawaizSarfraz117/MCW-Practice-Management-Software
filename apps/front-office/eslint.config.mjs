import nextConfig from '@mcw/eslint-config/next';

export default [
  ...nextConfig,
  {
    // Add app-specific overrides here
    files: ['./src/app/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Add any app-specific rule overrides here
    }
  }
]; 