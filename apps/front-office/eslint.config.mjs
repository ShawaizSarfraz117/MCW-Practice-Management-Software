import nextConfig from '@mcw/eslint-config/next';

export default [
  ...nextConfig,
  {
    // Add app-specific overrides here
    files: ['app/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Add any app-specific rule overrides here
    }
  }
]; 