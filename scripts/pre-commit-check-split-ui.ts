#!/usr/bin/env node
/* eslint-disable max-lines */
import { spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import * as os from "os";
import { execSync } from "child_process";

interface TaskResult {
  name: string;
  duration: number;
  success: boolean;
  errors: string[];
  warnings: string[];
  output: string;
  testCount?: number;
}

interface TestDetail {
  name: string;
  duration: number;
  file: string;
}

const withIntegration = process.argv.includes("--with-integration");
const cpuCount = os.cpus().length;
const maxWorkers = Math.min(cpuCount - 1, 15);

// Find all UI test files and split them into groups
function getUITestGroups(): { name: string; files: string[]; emoji: string }[] {
  try {
    const allUITests = execSync(
      'cd apps/back-office && find __tests__ -name "*.ui.test.tsx" | sort',
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    console.log(`Found ${allUITests.length} UI test files`);

    // Group tests by directory
    const groups: { [key: string]: string[] } = {
      analytics: [],
      settings: [],
      clients: [],
      others: [],
    };

    allUITests.forEach((file) => {
      if (file.includes("/analytics/")) {
        groups.analytics.push(file);
      } else if (file.includes("/Settings/")) {
        groups.settings.push(file);
      } else if (file.includes("/clients/")) {
        groups.clients.push(file);
      } else {
        groups.others.push(file);
      }
    });

    const result = [];
    if (groups.analytics.length > 0) {
      result.push({
        name: "UI Tests (Analytics)",
        files: groups.analytics,
        emoji: "📊",
      });
    }
    if (groups.settings.length > 0) {
      result.push({
        name: "UI Tests (Settings)",
        files: groups.settings,
        emoji: "⚙️",
      });
    }
    if (groups.clients.length > 0) {
      result.push({
        name: "UI Tests (Clients)",
        files: groups.clients,
        emoji: "👥",
      });
    }
    if (groups.others.length > 0) {
      result.push({
        name: "UI Tests (Others)",
        files: groups.others,
        emoji: "🎨",
      });
    }

    return result;
  } catch (e) {
    console.error("Error finding UI test files:", e);
    return [
      {
        name: "UI Tests",
        files: [],
        emoji: "🎨",
      },
    ];
  }
}

// Create tasks from UI test groups
const uiGroups = getUITestGroups();
const uiTasks = uiGroups.map((group, index) => {
  // Wrap each file in quotes to handle special characters
  const fileList = group.files.map((f) => `"${f}"`).join(" ");
  return {
    name: group.name,
    command: `cd apps/back-office && npx vitest run --config vitest.config.ui.ts ${fileList} --reporter=json --outputFile=../../test-results/ui-${index}.json`,
    emoji: group.emoji,
  };
});

const tasks = [
  { name: "Type Checking", command: "npm run typecheck", emoji: "📝" },
  { name: "Linting", command: "npm run lint", emoji: "🔍" },
  {
    name: "Unit Tests",
    command: `npm run test:unit -- --reporter=json --outputFile=test-results/unit.json --run --pool=threads --poolOptions.threads.maxThreads=${maxWorkers}`,
    emoji: "⚡",
  },
  ...uiTasks,
  ...(withIntegration
    ? [
        {
          name: "Integration Tests",
          command:
            "npm run test:integration -- --reporter=json --outputFile=test-results/integration.json --run",
          emoji: "🔗",
        },
      ]
    : []),
];

console.log(`\n📋 Task breakdown:`);
uiGroups.forEach((group) => {
  console.log(`   ${group.emoji} ${group.name}: ${group.files.length} files`);
});
console.log("");

interface Task {
  name: string;
  command: string;
  emoji: string;
}

function runTask(task: Task): Promise<TaskResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`🚀 Starting ${task.emoji} ${task.name}...`);

    const child = spawn(task.command, [], {
      shell: true,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let output = "";
    let errorOutput = "";

    child.stdout?.on("data", (data) => {
      output += data.toString();
    });
    child.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      const duration = (Date.now() - startTime) / 1000;
      const fullOutput = output + errorOutput;
      console.log(
        `${code === 0 ? "✅" : "❌"} ${task.name} completed in ${duration.toFixed(1)}s`,
      );

      const errors: string[] = [];
      const warnings: string[] = [];

      // Parse linting output
      if (task.name === "Linting") {
        const errorMatch = fullOutput.match(/(\d+)\s+error/);
        const warningMatch = fullOutput.match(/(\d+)\s+warning/);

        if (errorMatch) {
          const errorLines = fullOutput
            .split("\n")
            .filter((line) => line.includes("error") && line.includes(":"));
          errors.push(...errorLines);
        }

        if (warningMatch) {
          const warningLines = fullOutput
            .split("\n")
            .filter((line) => line.includes("warning") && line.includes(":"));
          warnings.push(...warningLines.slice(0, 50));
        }
      }

      // Parse TypeScript errors
      if (task.name === "Type Checking" && code !== 0) {
        const tsErrors = fullOutput
          .split("\n")
          .filter(
            (line) => line.includes("error TS") || line.includes("Error:"),
          );
        errors.push(...tsErrors);
      }

      // Count tests from JSON output if available
      let testCount = 0;
      if (task.name.includes("Tests") && code === 0) {
        try {
          const jsonMatch = fullOutput.match(/numTotalTests["\s:]+(\d+)/);
          if (jsonMatch) {
            testCount = parseInt(jsonMatch[1], 10);
          }
        } catch (_e) {
          // Ignore parsing errors
        }
      }

      resolve({
        name: task.name,
        duration,
        success: code === 0,
        errors,
        warnings,
        output: fullOutput,
        testCount,
      });
    });
  });
}

async function parseTestResults(): Promise<TestDetail[]> {
  const allTests: TestDetail[] = [];

  try {
    // Parse all test result files
    const testFiles = [
      "unit.json",
      ...Array.from({ length: uiGroups.length }, (_, i) => `ui-${i}.json`),
      ...(withIntegration ? ["integration.json"] : []),
    ];

    for (const file of testFiles) {
      const filePath = `./test-results/${file}`;
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
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
              allTests.push({
                name: test.fullName || test.title,
                duration: test.duration || 0,
                file: file.name.split("/").pop(),
              });
            });
          },
        );
      }
    }
  } catch (e: unknown) {
    console.error("Error parsing test results:", e);
  }

  return allTests.sort((a, b) => b.duration - a.duration);
}

async function getTestCountsFromResults(): Promise<{ [key: string]: number }> {
  const counts: { [key: string]: number } = {};

  try {
    const testFiles = [
      { file: "unit.json", name: "Unit Tests" },
      ...uiGroups.map((group, i) => ({
        file: `ui-${i}.json`,
        name: group.name,
      })),
      { file: "integration.json", name: "Integration Tests" },
    ];

    for (const { file, name } of testFiles) {
      const filePath = `./test-results/${file}`;
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        counts[name] = data.numTotalTests || 0;
      }
    }
  } catch (_e) {
    // Ignore errors
  }

  return counts;
}

async function generateReport(results: TaskResult[], totalDuration: number) {
  const allErrors = results.flatMap((r) =>
    r.errors.map((e) => ({ task: r.name, error: e })),
  );
  const allWarnings = results.flatMap((r) =>
    r.warnings.map((w) => ({ task: r.name, warning: w })),
  );
  const hasErrors = allErrors.length > 0;

  // Get test details
  const testDetails = await parseTestResults();
  const slowTests = testDetails.filter((t) => t.duration > 500);

  // Get test counts
  const testCounts = await getTestCountsFromResults();

  // Update results with test counts
  results.forEach((r) => {
    if (testCounts[r.name]) {
      r.testCount = testCounts[r.name];
    }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Split UI Pre-commit Check - ${new Date().toLocaleString()}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f5f5; }
        .header { background: ${hasErrors ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)" : "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)"}; color: white; padding: 30px; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
        .phase-item { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; align-items: center; }
        .phase-status { font-size: 24px; margin-right: 15px; }
        .phase-name { flex: 1; }
        .phase-duration { color: #666; white-space: nowrap; }
        .phase-bar { height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 5px; overflow: hidden; }
        .phase-progress { height: 100%; background: #4caf50; transition: width 0.3s; }
        .error-item, .warning-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
        .error-item { border-left: 4px solid #d32f2f; }
        .warning-item { border-left: 4px solid #f57c00; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .test-duration { font-weight: bold; color: #1976d2; text-align: right; }
        .perf-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-left: 10px; }
        .perf-fast { background: #e8f5e9; color: #2e7d32; }
        .perf-medium { background: #fff3e0; color: #ef6c00; }
        .perf-slow { background: #ffebee; color: #c62828; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${hasErrors ? "❌ Split UI Pre-commit Check Failed" : "✅ Split UI Pre-commit Check Passed"}</h1>
        <p>Total Duration: ${totalDuration.toFixed(2)}s${withIntegration ? " (with integration tests)" : ""}</p>
        <p style="font-size: 14px; opacity: 0.9;">
            CPU Cores: ${cpuCount} | Parallel Tasks: ${tasks.length} | 
            <span class="perf-badge ${totalDuration < 40 ? "perf-fast" : totalDuration < 60 ? "perf-medium" : "perf-slow"}">
                ${totalDuration < 40 ? "⚡ Ultra Fast" : totalDuration < 60 ? "⏱️ Fast" : "🐌 Slow"}
            </span>
        </p>
    </div>
    
    <div class="container">
        <div class="summary">
            <div class="card">
                <div class="metric-value error">${allErrors.length}</div>
                <div>Errors</div>
            </div>
            <div class="card">
                <div class="metric-value warning">${allWarnings.length}</div>
                <div>Warnings</div>
            </div>
            <div class="card">
                <div class="metric-value">${totalDuration.toFixed(2)}s</div>
                <div>Total Time</div>
            </div>
            <div class="card">
                <div class="metric-value">${results.filter((r) => r.success).length}/${results.length}</div>
                <div>Tasks Passed</div>
            </div>
        </div>

        <div class="card">
            <h2>Task Execution Timeline</h2>
            ${results
              .sort((a, b) => b.duration - a.duration)
              .map((r) => {
                const percentage = (r.duration / totalDuration) * 100;
                return `
                <div class="phase-item">
                    <div style="display: flex; align-items: center; flex: 1;">
                        <span class="phase-status">${r.success ? "✅" : "❌"}</span>
                        <div class="phase-name">
                            <strong>${r.name}${r.testCount ? ` (${r.testCount} tests)` : ""}</strong>
                            <div class="phase-bar">
                                <div class="phase-progress" style="width: ${percentage}%;"></div>
                            </div>
                        </div>
                    </div>
                    <span class="phase-duration">${r.duration.toFixed(2)}s (${percentage.toFixed(1)}%)</span>
                </div>
            `;
              })
              .join("")}
        </div>

        ${
          allErrors.length > 0
            ? `
            <div class="card">
                <h2>Errors (${allErrors.length})</h2>
                ${allErrors
                  .map(
                    (e) => `
                    <div class="error-item">
                        <strong>${e.task}:</strong>
                        ${e.error}
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `
            : ""
        }

        ${
          allWarnings.length > 0
            ? `
            <div class="card">
                <h2>Warnings (${allWarnings.length})</h2>
                ${allWarnings
                  .slice(0, 50)
                  .map(
                    (w) => `
                    <div class="warning-item">
                        <strong>${w.task}:</strong>
                        ${w.warning}
                    </div>
                `,
                  )
                  .join("")}
                ${allWarnings.length > 50 ? `<p>... and ${allWarnings.length - 50} more warnings</p>` : ""}
            </div>
        `
            : ""
        }

        <div class="card">
            <h2>Slowest Tests (>500ms)</h2>
            ${
              slowTests.length > 0
                ? `
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>File</th>
                            <th style="text-align: right;">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${slowTests
                          .slice(0, 30)
                          .map(
                            (t) => `
                            <tr>
                                <td>${t.name}</td>
                                <td>${t.file}</td>
                                <td class="test-duration">${(t.duration / 1000).toFixed(1)}s</td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
                <p>Showing ${Math.min(30, slowTests.length)} of ${slowTests.length} slow tests</p>
            `
                : "<p>No tests slower than 500ms 🎉</p>"
            }
        </div>
    </div>
</body>
</html>`;

  if (!existsSync("./test-results/reports")) {
    mkdirSync("./test-results/reports", { recursive: true });
  }

  writeFileSync("./test-results/reports/split-ui-report.html", html);
  console.log(`\n📊 Report: test-results/reports/split-ui-report.html`);
}

async function runAllTasks() {
  console.log(
    `🚀 Running Split UI pre-commit checks${withIntegration ? " (with integration tests)" : ""}...`,
  );
  console.log(
    `📍 CPU Cores: ${cpuCount} | Max Workers: ${maxWorkers} | Running ${tasks.length} parallel tasks`,
  );
  console.log(
    `⚡ Thread pool size increased to ${maxWorkers} threads for maximum parallelization\n`,
  );

  const startTime = Date.now();
  const results = await Promise.all(tasks.map(runTask));
  const totalDuration = (Date.now() - startTime) / 1000;

  console.log(`\n✨ All tasks completed in ${totalDuration.toFixed(2)}s`);

  await generateReport(results, totalDuration);

  const hasErrors = results.some((r) => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

runAllTasks();
