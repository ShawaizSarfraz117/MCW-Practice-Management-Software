import nodeConfig from "@mcw/eslint-config/node";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nodeConfig,
  globalIgnores(["src/generated"]),
]);
