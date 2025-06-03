import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject, mergeConfig } from "vitest/config";
import { fileURLToPath } from "url";
import uiConfig from "@mcw/vitest-config/ui";

export default mergeConfig(
  uiConfig,
  defineProject({
    test: {
      name: "back-office/ui",
      include: ["**/*.ui.test.tsx"],
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
