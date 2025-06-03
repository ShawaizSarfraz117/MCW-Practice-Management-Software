import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "back-office/unit",
      include: ["**/*.unit.test.ts"],
      setupFiles: ["./vitest.setup.unit.ts"],
    },
    plugins: [
      tsconfigPaths({
        root: fileURLToPath(new URL(".", import.meta.url)),
      }),
    ],
    resolve: {
      alias: [
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src/app", import.meta.url)),
        },
        {
          find: "@/utils",
          replacement: fileURLToPath(new URL("./src/utils", import.meta.url)),
        },
        {
          find: "@/types",
          replacement: fileURLToPath(new URL("./src/types", import.meta.url)),
        },
      ],
    },
  }),
);
