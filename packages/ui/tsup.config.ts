import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Mark problematic packages as external
  external: [
    '@mapbox/node-pre-gyp',
    'mock-aws-s3',
    'aws-sdk',
    'nock',
    // Add common patterns to catch related dependencies
    /node_modules\/@mapbox/,
    // Include all React-related packages as external
    'react',
    'react-dom',
    // All Radix UI packages
    '@radix-ui',
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    // Other UI dependencies
    'class-variance-authority',
    'clsx',
    'lucide-react',
    'tailwind-merge',
    'tailwindcss-animate'
  ],
  // Define environments for better tree-shaking
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  // Optimizations
  minify: process.env.NODE_ENV === 'production',
  // Define what should be included in the bundle
  esbuildOptions(options) {
    // Ensure HTML files are ignored
    options.loader = {
      ...options.loader,
      '.html': 'empty',
    };
    // Set JSX options
    options.jsx = 'automatic';
    options.jsxImportSource = 'react';
  },
});