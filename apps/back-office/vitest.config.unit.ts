import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  test: {
    name: "back-office/unit",
    include: ["**/*.unit.test.ts"],
    setupFiles: ["./vitest.setup.unit.ts"],
  },
  plugins: [tsconfigPaths()],
});
