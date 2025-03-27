import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "back-office/unit",
      include: ["**/*.unit.test.ts"],
      setupFiles: ["./vitest.setup.unit.ts"],
    },
  }),
);
