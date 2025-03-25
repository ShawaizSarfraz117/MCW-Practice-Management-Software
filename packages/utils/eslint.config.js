import nodeConfig from '@mcw/eslint-config/node.js';

export default [
  ...nodeConfig,
  {
    // Add package-specific overrides here
    files: ['src/**/*.{js,ts}'],
    rules: {
      // Add any package-specific rule overrides here
    }
  }
]; 