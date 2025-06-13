#!/usr/bin/env node
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import * as os from 'os';

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

const withIntegration = process.argv.includes('--with-integration');

const cpuCount = os.cpus().length;
const maxWorkers = Math.min(cpuCount - 1, 15);

const tasks = [
  { name: 'Type Checking', command: 'npm run typecheck', emoji: '📝' },
  { name: 'Linting', command: 'npm run lint', emoji: '🔍' },
  { name: 'Unit Tests', command: `npm run test:unit -- --reporter=json --outputFile=test-results/unit.json --run --pool=threads --poolOptions.threads.maxThreads=${maxWorkers}`, emoji: '⚡' },
  { name: 'UI Tests', command: `npm run test:ui -- --reporter=json --outputFile=test-results/ui.json --run --pool=threads --poolOptions.threads.maxThreads=${maxWorkers}`, emoji: '🎨' },
  ...(withIntegration ? [{ name: 'Integration Tests', command: 'npm run test:integration -- --reporter=json --outputFile=test-results/integration.json --run', emoji: '🔗' }] : [])
];

interface Task {
  name: string;
  command: string;
  emoji: string;
}

function runTask(task: Task): Promise<TaskResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(task.command, [], {
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    let output = '';
    let errorOutput = '';
    
    child.stdout?.on('data', (data) => { output += data.toString(); });
    child.stderr?.on('data', (data) => { errorOutput += data.toString(); });

    child.on('close', (code) => {
      const duration = (Date.now() - startTime) / 1000;
      const fullOutput = output + errorOutput;
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Parse linting output
      if (task.name === 'Linting') {
        const errorMatch = fullOutput.match(/(\d+)\s+error/);
        const warningMatch = fullOutput.match(/(\d+)\s+warning/);
        
        if (errorMatch) {
          const errorLines = fullOutput.split('\n').filter(line => 
            line.includes('error') && line.includes(':')
          );
          errors.push(...errorLines);
        }
        
        if (warningMatch) {
          const warningLines = fullOutput.split('\n').filter(line => 
            line.includes('warning') && line.includes(':')
          );
          warnings.push(...warningLines.slice(0, 50)); // Limit to 50 warnings
        }
      }
      
      // Parse TypeScript errors
      if (task.name === 'Type Checking' && code !== 0) {
        const tsErrors = fullOutput.split('\n').filter(line => 
          line.includes('error TS') || line.includes('Error:')
        );
        errors.push(...tsErrors);
      }

      // Count tests from JSON output if available
      let testCount = 0;
      if (task.name.includes('Tests') && code === 0) {
        try {
          const jsonMatch = fullOutput.match(/numTotalTests["\s:]+(\d+)/);
          if (jsonMatch) {
            testCount = parseInt(jsonMatch[1], 10);
          }
        } catch (e) {
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
        testCount
      });
    });
  });
}

async function parseTestResults(): Promise<TestDetail[]> {
  const allTests: TestDetail[] = [];
  
  try {
    const { readFileSync } = await import('fs');
    
    if (existsSync('./test-results/unit.json')) {
      const unitData = JSON.parse(readFileSync('./test-results/unit.json', 'utf-8'));
      unitData.testResults?.forEach((file: { name: string; assertionResults?: Array<{ fullName?: string; title?: string; duration?: number }> }) => {
        file.assertionResults?.forEach((test) => {
          allTests.push({
            name: test.fullName || test.title,
            duration: test.duration || 0,
            file: file.name.split('/').pop()
          });
        });
      });
    }
    
    if (existsSync('./test-results/ui.json')) {
      const uiData = JSON.parse(readFileSync('./test-results/ui.json', 'utf-8'));
      uiData.testResults?.forEach((file: { name: string; assertionResults?: Array<{ fullName?: string; title?: string; duration?: number }> }) => {
        file.assertionResults?.forEach((test) => {
          allTests.push({
            name: test.fullName || test.title,
            duration: test.duration || 0,
            file: file.name.split('/').pop()
          });
        });
      });
    }
    
    if (withIntegration && existsSync('./test-results/integration.json')) {
      const integrationData = JSON.parse(readFileSync('./test-results/integration.json', 'utf-8'));
      integrationData.testResults?.forEach((file: { name: string; assertionResults?: Array<{ fullName?: string; title?: string; duration?: number }> }) => {
        file.assertionResults?.forEach((test) => {
          allTests.push({
            name: test.fullName || test.title,
            duration: test.duration || 0,
            file: file.name.split('/').pop()
          });
        });
      });
    }
  } catch (e) {
    console.error('Error parsing test results:', e);
  }
  
  return allTests.sort((a, b) => b.duration - a.duration);
}

async function getTestCountsFromResults(): Promise<{ [key: string]: number }> {
  const counts: { [key: string]: number } = {};
  
  try {
    const { readFileSync } = await import('fs');
    const testFiles = [
      { file: 'unit.json', name: 'Unit Tests' },
      { file: 'ui.json', name: 'UI Tests' },
      { file: 'integration.json', name: 'Integration Tests' }
    ];
    
    for (const { file, name } of testFiles) {
      const filePath = `./test-results/${file}`;
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        counts[name] = data.numTotalTests || 0;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return counts;
}

async function generateReport(results: TaskResult[], totalDuration: number) {
  const allErrors = results.flatMap(r => r.errors.map(e => ({ task: r.name, error: e })));
  const allWarnings = results.flatMap(r => r.warnings.map(w => ({ task: r.name, warning: w })));
  const hasErrors = allErrors.length > 0;
  // const hasWarnings = allWarnings.length > 0; // Currently unused but may be needed later
  
  // Get test details
  const testDetails = await parseTestResults();
  const slowTests = testDetails.filter(t => t.duration > 500);
  
  // Get test counts
  const testCounts = await getTestCountsFromResults();
  
  // Update results with test counts
  results.forEach(r => {
    if (testCounts[r.name]) {
      r.testCount = testCounts[r.name];
    }
  });
  
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Pre-commit Check Report - ${new Date().toLocaleString()}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f5f5; }
        .header { background: ${hasErrors ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'}; color: white; padding: 30px; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
        .phase-item { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; }
        .phase-status { font-size: 24px; margin-right: 15px; }
        .phase-duration { color: #666; }
        .error-item, .warning-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
        .error-item { border-left: 4px solid #d32f2f; }
        .warning-item { border-left: 4px solid #f57c00; }
        .test-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
        .test-duration { font-weight: bold; color: #1976d2; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${hasErrors ? '❌ Pre-commit Check Failed' : '✅ Pre-commit Check Passed'}</h1>
        <p>Total Duration: ${totalDuration.toFixed(2)}s${withIntegration ? ' (with integration tests)' : ''}</p>
        <p style="font-size: 14px; opacity: 0.9;">CPU Cores: ${cpuCount} | Max Workers: ${maxWorkers}</p>
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
                <div class="metric-value">${results.filter(r => r.success).length}/${results.length}</div>
                <div>Tasks Passed</div>
            </div>
        </div>

        <div class="card">
            <h2>Phase Durations</h2>
            ${results.map(r => `
                <div class="phase-item">
                    <div>
                        <span class="phase-status">${r.success ? '✅' : '❌'}</span>
                        <strong>${r.name}${r.testCount ? ` (${r.testCount} tests)` : ''}</strong>
                    </div>
                    <span class="phase-duration">${r.duration.toFixed(2)}s</span>
                </div>
            `).join('')}
        </div>

        ${allErrors.length > 0 ? `
            <div class="card">
                <h2>Errors (${allErrors.length})</h2>
                ${allErrors.map(e => `
                    <div class="error-item">
                        <strong>${e.task}:</strong>
                        ${e.error}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${allWarnings.length > 0 ? `
            <div class="card">
                <h2>Warnings (${allWarnings.length})</h2>
                ${allWarnings.slice(0, 100).map(w => `
                    <div class="warning-item">
                        <strong>${w.task}:</strong>
                        ${w.warning}
                    </div>
                `).join('')}
                ${allWarnings.length > 100 ? `<p>... and ${allWarnings.length - 100} more warnings</p>` : ''}
            </div>
        ` : ''}

        <div class="card">
            <h2>Slow Tests (>500ms)</h2>
            ${slowTests.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>File</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${slowTests.map(t => `
                            <tr>
                                <td>${t.name}</td>
                                <td>${t.file}</td>
                                <td class="test-duration">${t.duration.toFixed(0)}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p>Total: ${slowTests.length} slow tests</p>
            ` : '<p>No tests slower than 500ms</p>'}
        </div>
    </div>
</body>
</html>`;

  if (!existsSync('./test-results/reports')) {
    mkdirSync('./test-results/reports', { recursive: true });
  }
  
  writeFileSync('./test-results/reports/pre-commit-report.html', html);
  console.log(`\n📊 Report: test-results/reports/pre-commit-report.html`);
}

async function runAllTasks() {
  console.log(`🚀 Running pre-commit checks${withIntegration ? ' (with integration tests)' : ''}...\n`);
  
  const startTime = Date.now();
  const results = await Promise.all(tasks.map(runTask));
  const totalDuration = (Date.now() - startTime) / 1000;
  
  // Save test details
  const testDetails = await parseTestResults();
  writeFileSync('./test-results/reports/test-details.json', JSON.stringify(testDetails, null, 2));
  
  await generateReport(results, totalDuration);
  
  const hasErrors = results.some(r => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

runAllTasks();