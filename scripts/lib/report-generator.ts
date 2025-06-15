import { writeFileSync, mkdirSync, existsSync } from "fs";

export interface TaskResult {
  name: string;
  duration: number;
  success: boolean;
  errors: string[];
  warnings: string[];
  output: string;
  testCount?: number;
}

export interface TestDetail {
  name: string;
  duration: number;
  file: string;
}

export async function generateReport(
  results: TaskResult[],
  totalDuration: number,
  testDetails: TestDetail[],
  testCounts: { [key: string]: number },
  options: {
    title: string;
    outputFile: string;
    cpuCount: number;
    taskCount: number;
    withIntegration: boolean;
  },
) {
  const allErrors = results.flatMap((r) =>
    r.errors.map((e) => ({ task: r.name, error: e })),
  );
  const allWarnings = results.flatMap((r) =>
    r.warnings.map((w) => ({ task: r.name, warning: w })),
  );
  const hasErrors = allErrors.length > 0;

  // Update results with test counts
  results.forEach((r) => {
    if (testCounts[r.name]) {
      r.testCount = testCounts[r.name];
    }
  });

  const slowTests = testDetails.filter((t) => t.duration > 500);

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>${options.title} - ${new Date().toLocaleString()}</title>
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
        <h1>${hasErrors ? "❌ " + options.title + " Failed" : "✅ " + options.title + " Passed"}</h1>
        <p>Total Duration: ${totalDuration.toFixed(2)}s${options.withIntegration ? " (with integration tests)" : ""}</p>
        <p style="font-size: 14px; opacity: 0.9;">
            CPU Cores: ${options.cpuCount} | Parallel Tasks: ${options.taskCount} | 
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

  writeFileSync(options.outputFile, html);
  console.log(`\n📊 Report: ${options.outputFile}`);
}
