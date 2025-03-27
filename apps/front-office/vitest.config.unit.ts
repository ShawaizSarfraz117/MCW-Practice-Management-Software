import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "front-office/unit",
      setupFiles: ["./vitest.setup.unit.ts"],
      include: ["**/*.unit.test.ts"],
    },
  }),
);
