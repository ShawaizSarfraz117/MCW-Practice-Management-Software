import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    globals: true,
    include: ["__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    setupVitestGlobals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mcw": path.resolve(__dirname, "../../packages"),
    },
  },
});
