import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default", "json"],
    outputFile: {
      json: "./test-results/test-results.json",
    },
    // Include timing information
    benchmark: {
      outputFile: "./test-results/benchmark.json",
    },
  },
});
