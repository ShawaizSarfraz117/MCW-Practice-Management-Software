import uiConfig from "@mcw/vitest-config/ui";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  uiConfig,
  defineProject({
    test: {
      include: ["**/*.test.tsx", "**/*.test.ts"],
    },
  }),
);
