import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject, mergeConfig } from "vitest/config";
import { fileURLToPath } from "url";
import baseConfig from "@mcw/vitest-config";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "back-office/integration",
      include: ["**/*.integration.test.ts"],
    },
    plugins: [tsconfigPaths()],
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
