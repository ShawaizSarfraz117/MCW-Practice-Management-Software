import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
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
  optimizeDeps: {
    // Pre-bundle heavy dependencies for faster imports
    include: [
      "@fullcalendar/core",
      "@fullcalendar/react",
      "@fullcalendar/daygrid",
      "@fullcalendar/timegrid",
      "@fullcalendar/interaction",
      "recharts",
      "react-hook-form",
      "@hookform/resolvers",
      "zod",
      "lucide-react",
      "@tanstack/react-query",
      "@tanstack/react-table",
    ],
  },
  esbuild: {
    // Faster JavaScript compilation
    target: "es2020",
    keepNames: true,
  },
});
