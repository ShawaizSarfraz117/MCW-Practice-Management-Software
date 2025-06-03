import { defineProject, mergeConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import uiConfig from "@mcw/vitest-config/ui";

export default mergeConfig(
  uiConfig,
  defineProject({
    test: {
      name: "back-office/ui",
      include: ["**/*.ui.test.tsx"],
    },
    plugins: [tsconfigPaths()],
  }),
);
