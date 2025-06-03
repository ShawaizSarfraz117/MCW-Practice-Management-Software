import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  test: {
    name: "back-office/integration",
    include: ["**/*.integration.test.ts"],
    setupFiles: ["./vitest.setup.integration.ts"],
    // Global timeout for slow imports
    testTimeout: 30000,
    // Run integration tests sequentially to avoid database conflicts
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  plugins: [tsconfigPaths()],
});
