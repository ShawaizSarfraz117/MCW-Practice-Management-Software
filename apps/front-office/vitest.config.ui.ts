import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  test: {
    name: "front-office/ui",
    include: ["**/*.ui.test.tsx"],
    environment: "happy-dom",
    pool: "threads",
    poolOptions: {
      threads: {
        minThreads: 2,
        maxThreads: 8,
      },
    },
  },
  plugins: [tsconfigPaths()],
});
