import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import os from "os";

const cpuCount = os.cpus().length;
const maxThreads = Math.min(cpuCount - 1, 15); // Use almost all cores, leave 1 for system

export default defineProject({
  test: {
    name: "front-office/ui",
    include: ["**/*.ui.test.tsx"],
    environment: "happy-dom",
    testTimeout: 120000, // Increase timeout to 120 seconds
    pool: "threads",
    poolOptions: {
      threads: {
        minThreads: 4,
        maxThreads: maxThreads,
        singleThread: false,
      },
    },
    maxConcurrency: maxThreads,
    fileParallelism: true,
  },
  plugins: [tsconfigPaths()],
});
