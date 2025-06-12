#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";

interface TestResult {
  name: string;
  duration: number;
  failureMessages: string[];
}

interface TestFile {
  name: string;
  duration: number;
  tests: TestResult[];
}

interface VitestReport {
  testResults: Array<{
    name: string;
    startTime: number;
    endTime: number;
    assertionResults: TestResult[];
  }>;
}

class TestPerformanceAnalyzer {
  private testResults: TestFile[] = [];

  constructor(private reportPath: string) {
    if (!existsSync(reportPath)) {
      throw new Error(`Test report not found at ${reportPath}`);
    }
  }

  analyze(): void {
    this.parseResults();
    this.generateReports();
    console.log(
      "\n✅ Test analysis complete! Check test-results/reports/ for details.",
    );
  }

  private parseResults(): void {
    const data = JSON.parse(
      readFileSync(this.reportPath, "utf-8"),
    ) as VitestReport;

    this.testResults = data.testResults.map((file) => ({
      name: file.name,
      duration: file.endTime - file.startTime,
      tests: file.assertionResults,
    }));
  }

  private generateReports(): void {
    if (!existsSync("./test-results/reports")) {
      mkdirSync("./test-results/reports", { recursive: true });
    }

    this.generateSummaryReport();
    this.generateSlowTestsReport();
    this.generateHtmlReport();
  }

  private generateSummaryReport(): void {
    const totalTests = this.testResults.reduce(
      (sum, file) => sum + file.tests.length,
      0,
    );
    const totalDuration = this.testResults.reduce(
      (sum, file) => sum + file.duration,
      0,
    );

    const summary = `Test Performance Summary
========================
Total Test Files: ${this.testResults.length}
Total Tests: ${totalTests}
Total Duration: ${(totalDuration / 1000).toFixed(2)}s
Average Test Duration: ${(totalDuration / totalTests).toFixed(2)}ms
`;

    writeFileSync("./test-results/reports/summary.txt", summary);
    console.log("\n" + summary);
  }

  private generateSlowTestsReport(): void {
    const slowTests = this.testResults
      .flatMap((file) =>
        file.tests.map((test) => ({
          file: file.name.split("/").pop() || file.name,
          test: test.name,
          duration: test.duration,
        })),
      )
      .filter((test) => test.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);

    const report = `Slowest Tests (>100ms)
======================
${slowTests
  .map(
    (test, i) =>
      `${i + 1}. ${test.test}\n   File: ${test.file}\n   Duration: ${test.duration.toFixed(2)}ms\n`,
  )
  .join("\n")}`;

    writeFileSync("./test-results/reports/slow-tests.txt", report);
  }

  private generateHtmlReport(): void {
    const totalTests = this.testResults.reduce(
      (sum, file) => sum + file.tests.length,
      0,
    );
    const totalDuration = this.testResults.reduce(
      (sum, file) => sum + file.duration,
      0,
    );
    const slowTests = this.testResults
      .flatMap((file) =>
        file.tests.map((test) => ({
          file: file.name.split("/").pop() || file.name,
          test: test.name,
          duration: test.duration,
        })),
      )
      .filter((test) => test.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 36px; font-weight: bold; color: #1a73e8; }
        .metric-label { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; }
        .slow { color: #d32f2f; }
        .fast { color: #388e3c; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Test Performance Report</h1>
        <div class="card">
            <h2>Summary</h2>
            <div class="metric">
                <div class="metric-value">${this.testResults.length}</div>
                <div class="metric-label">Test Files</div>
            </div>
            <div class="metric">
                <div class="metric-value">${totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(totalDuration / totalTests).toFixed(0)}ms</div>
                <div class="metric-label">Avg Test Duration</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Slowest Tests</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>File</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${slowTests
                      .map(
                        (test) => `
                        <tr>
                            <td>${test.test}</td>
                            <td>${test.file}</td>
                            <td class="${test.duration > 500 ? "slow" : ""}">${test.duration.toFixed(0)}ms</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>Test Distribution</h2>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.getDistribution()
                      .map(
                        (cat) => `
                        <tr>
                            <td>${cat.type}</td>
                            <td>${cat.count}</td>
                            <td>${cat.percentage}%</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    writeFileSync("./test-results/reports/test-performance.html", html);
    console.log(
      "📊 HTML report generated: test-results/reports/test-performance.html",
    );
  }

  private getDistribution(): Array<{
    type: string;
    count: number;
    percentage: number;
  }> {
    const categories = { unit: 0, integration: 0, ui: 0 };

    this.testResults.forEach((file) => {
      if (file.name.includes(".unit.test."))
        categories.unit += file.tests.length;
      else if (file.name.includes(".integration.test."))
        categories.integration += file.tests.length;
      else if (file.name.includes(".ui.test."))
        categories.ui += file.tests.length;
    });

    const total = Object.values(categories).reduce(
      (sum, count) => sum + count,
      0,
    );

    return Object.entries(categories).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }
}

// Run the analyzer
try {
  const analyzer = new TestPerformanceAnalyzer(
    "./test-results/test-results.json",
  );
  analyzer.analyze();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("❌ Error analyzing test performance:", message);
  console.log(
    "\nMake sure to run tests with: npm test -- --reporter=json --outputFile=test-results/test-results.json",
  );
  process.exit(1);
}
