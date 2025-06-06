// @ts-check

import eslint from "@eslint/js";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores(["dist"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_.*",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_.*",
          destructuredArrayIgnorePattern: "^_.*",
          varsIgnorePattern: "^_.*",
          ignoreRestSiblings: true,
        },
      ],
      "max-lines-per-function": ["warn", 200],
      "max-lines": ["warn", 400],
      // Prevent relative imports with ../.. - prefer @/ aliases
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["../..*"],
              message:
                "Use @/ path aliases instead of relative imports with ../.. - see CLAUDE.md Import Conventions",
            },
          ],
        },
      ],
    },
  },
  {
    // Prevent test files from being placed in src/ directories
    files: ["**/src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    rules: {
      // Any test file in src/ directory will trigger this rule
      "prefer-const": [
        "error",
        {
          destructuring: "any",
          ignoreReadBeforeAssign: false,
        },
      ],
    },
  },
);
