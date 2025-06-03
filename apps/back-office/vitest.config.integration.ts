import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  test: {
    name: "back-office/integration",
    include: ["**/*.integration.test.ts"],
    // Global timeout for slow imports
    testTimeout: 30000,
    // Use threads for parallel compilation
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2,
      },
    },
  },
  plugins: [tsconfigPaths()],
});
