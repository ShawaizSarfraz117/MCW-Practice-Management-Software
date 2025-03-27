import reactConfig from "./react.js";
import { defineConfig, globalIgnores } from "eslint/config";

import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
  ...reactConfig,
  globalIgnores([".next"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);
