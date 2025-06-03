import baseConfig from "@mcw/eslint-config";

export default [
  ...baseConfig,
  {
    // Add global rules here that should apply to the entire monorepo
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/*.d.ts",
      "**/.next/**",
      "**/coverage/**",
      "**/build/**",
    ],
  },
  {
    // Prevent test files from being in src/ directories - they should be in __tests__/
    files: ["**/src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    rules: {
      // This will error on any test files found in src/ directories
      "no-restricted-globals": [
        "error",
        {
          name: "describe",
          message:
            "Test files should be in __tests__ directories, not in src/ - see CLAUDE.md test location conventions",
        },
      ],
    },
  },
];
