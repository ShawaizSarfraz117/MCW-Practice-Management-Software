import nodeConfig from "@mcw/eslint-config/node";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nodeConfig,
  globalIgnores(["src/generated"]),
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
    rules: {
      "no-redeclare": "off", // Allow global declarations in .mjs files
    },
  },
]);
