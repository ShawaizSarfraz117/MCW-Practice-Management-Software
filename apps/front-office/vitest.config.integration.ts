import baseConfig from "@mcw/vitest-config";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: "front-office/integration",
      include: ["**/*.integration.test.ts"],
      setupFiles: ["./vitest.setup.integration.ts"],
      // Run integration tests sequentially to avoid database conflicts
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  }),
);
