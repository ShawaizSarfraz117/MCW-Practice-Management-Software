import reactConfig from '@mcw/eslint-config/react';

export default [
  ...reactConfig,
  {
    // Add package-specific overrides here
    files: ['src/**/*.{jsx,tsx}'],
    rules: {
      // Add any package-specific rule overrides here
    }
  }
]; 