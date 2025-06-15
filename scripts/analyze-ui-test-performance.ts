#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";

// Analyze UI test performance from the test results
function analyzeUITests() {
  const files = [
    "test-results/ui.json",
    "test-results/ui-0.json",
    "test-results/ui-1.json",
    "test-results/ui-2.json",
    "test-results/ui-3.json",
  ];

  console.log("📊 UI Test Performance Analysis\n");

  for (const file of files) {
    if (existsSync(file)) {
      try {
        const data = JSON.parse(readFileSync(file, "utf-8"));
        console.log(`\n📁 ${file}:`);
        console.log(`   Total tests: ${data.numTotalTests || 0}`);
        console.log(
          `   Duration: ${((data.duration || 0) / 1000).toFixed(2)}s`,
        );

        // Find slowest tests
        const slowTests: Array<{ name: string; duration: number }> = [];
        data.testResults?.forEach(
          (file: {
            name: string;
            assertionResults?: Array<{
              fullName?: string;
              title?: string;
              duration?: number;
            }>;
          }) => {
            file.assertionResults?.forEach((test) => {
              if (test.duration > 1000) {
                slowTests.push({
                  name: test.fullName || test.title || "",
                  duration: test.duration || 0,
                });
              }
            });
          },
        );

        if (slowTests.length > 0) {
          console.log("\n   ⏱️  Slowest tests (>1s):");
          slowTests
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
            .forEach((test) => {
              console.log(
                `      ${(test.duration / 1000).toFixed(1)}s - ${test.name}`,
              );
            });
        }
      } catch (e) {
        console.log(`   ❌ Error reading file: ${e}`);
      }
    }
  }

  // Check if we have split UI results
  const splitResults = [];
  for (let i = 0; i < 4; i++) {
    const file = `test-results/ui-${i}.json`;
    if (existsSync(file)) {
      try {
        const data = JSON.parse(readFileSync(file, "utf-8"));
        splitResults.push({
          index: i,
          tests: data.numTotalTests || 0,
          duration: (data.duration || 0) / 1000,
        });
      } catch (_e) {
        // Ignore
      }
    }
  }

  if (splitResults.length > 0) {
    console.log("\n\n🔀 Split UI Test Analysis:");
    const totalTests = splitResults.reduce((sum, r) => sum + r.tests, 0);
    const avgDuration =
      splitResults.reduce((sum, r) => sum + r.duration, 0) /
      splitResults.length;
    const maxDuration = Math.max(...splitResults.map((r) => r.duration));

    console.log(`   Total UI tests: ${totalTests}`);
    console.log(`   Groups: ${splitResults.length}`);
    console.log(`   Average group duration: ${avgDuration.toFixed(2)}s`);
    console.log(`   Longest group duration: ${maxDuration.toFixed(2)}s`);
    console.log("\n   Group breakdown:");
    splitResults.forEach((r) => {
      console.log(
        `      Group ${r.index}: ${r.tests} tests in ${r.duration.toFixed(2)}s`,
      );
    });
  }

  console.log("\n\n💡 Recommendations:");
  console.log(
    "   1. UI tests have high startup overhead (20-30s per vitest instance)",
  );
  console.log(
    "   2. Running all UI tests in one instance is more efficient than splitting",
  );
  console.log(
    "   3. Consider reducing UI test count or converting to unit tests",
  );
  console.log("   4. Use mocking to avoid heavy component initialization");
}

analyzeUITests();
