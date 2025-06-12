import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import os from "os";

const cpuCount = os.cpus().length;
const maxThreads = Math.min(cpuCount - 1, 15);

export default defineProject({
  test: {
    name: "back-office/unit",
    include: ["**/*.unit.test.ts"],
    setupFiles: ["./vitest.setup.unit.ts"],
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
