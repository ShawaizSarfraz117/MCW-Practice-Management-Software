import react from "@vitejs/plugin-react";
import { defineProject, mergeConfig } from "vitest/config";

import baseConfig from "./base.js";

export default mergeConfig(
  baseConfig,
  defineProject({
    plugins: [react()],
    test: {
      environment: "happy-dom",
    },
  }),
);
