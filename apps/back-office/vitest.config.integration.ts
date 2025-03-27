import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "back-office/integration",
      include: ["**/*.integration.test.ts"],
    },
  }),
);
