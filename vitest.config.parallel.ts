import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as os from 'os';

const cpuCount = os.cpus().length;
const maxWorkers = Math.min(cpuCount - 1, 15); // Leave 1 core for system

export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 4,
        maxThreads: maxWorkers,
        singleThread: false,
      }
    },
    maxConcurrency: maxWorkers,
    // Increase test timeout for slower tests
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  plugins: [tsconfigPaths()],
});