import baseConfig from "./index.js";
import nodePlugin from "eslint-plugin-n";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/*.{mjs,cjs,js,ts}"],
    plugins: {
      n: nodePlugin,
    },
    rules: {
      "n/no-process-exit": "off",
      "n/no-unpublished-require": "off",
      "n/no-unpublished-import": "off",
      "n/no-missing-import": "off",
    },
  },
];
