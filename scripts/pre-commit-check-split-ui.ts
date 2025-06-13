#!/usr/bin/env node
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import * as os from "os";
import { execSync } from "child_process";
import { TaskResult, TestDetail, generateReport } from "./lib/report-generator";

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

  // Get test details and counts for the report
  const testDetails = await parseTestResults();
  const testCounts = await getTestCountsFromResults();

  await generateReport(results, totalDuration, testDetails, testCounts, {
    title: "Split UI Pre-commit Check",
    outputFile: "./test-results/reports/split-ui-report.html",
    cpuCount,
    taskCount: tasks.length,
    withIntegration,
  });

  const hasErrors = results.some((r) => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

runAllTasks();
