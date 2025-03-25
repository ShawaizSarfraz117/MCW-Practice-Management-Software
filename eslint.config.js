import baseConfig from '@mcw/eslint-config';

export default [
  ...baseConfig,
  {
    // Add global rules here that should apply to the entire monorepo
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/.next/**',
      '**/coverage/**',
      '**/build/**'
    ]
  }
]; 