import uiConfig from "@mcw/vitest-config/ui";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  uiConfig,
  defineProject({
    test: {
      name: "back-office/ui",
      include: ["**/*.ui-test.tsx"],
    },
  }),
);
