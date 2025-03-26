import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default mergeConfig(
  baseConfig,
  defineProject({
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src/app')
      }
    },
    test: {
      name: "back-office/unit",
      include: ["**/*.unit.test.ts"],
      setupFiles: ["./vitest.setup.ts"],
      environment: 'node',
    },
  }),
);
