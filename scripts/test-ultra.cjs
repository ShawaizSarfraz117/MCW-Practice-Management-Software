#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const { readFileSync, existsSync, mkdirSync, writeFileSync } = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ensure test-results directory exists
if (!existsSync('test-results')) {
  mkdirSync('test-results', { recursive: true });
}
if (!existsSync('test-results/reports')) {
  mkdirSync('test-results/reports', { recursive: true });
}

const tasks = [
  { name: 'Linting', command: 'npm run lint', emoji: '🔍' },
  { name: 'Type Checking', command: 'npm run typecheck', emoji: '📝' },
  { name: 'Unit Tests', command: 'npm run test:unit -- --reporter=json --outputFile=test-results/unit-results.json', emoji: '⚡' },
  { name: 'UI Tests', command: 'npm run test:ui -- --reporter=json --outputFile=test-results/ui-results.json', emoji: '🎨' }
];

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

function parseTaskOutput(output, taskName) {
  let warnings = 0;
  let errors = 0;

  if (taskName === 'Linting') {
    const warningMatch = output.match(/(\d+)\s+warning/);
    const errorMatch = output.match(/(\d+)\s+error/);
    if (warningMatch) warnings = parseInt(warningMatch[1]);
    if (errorMatch) errors = parseInt(errorMatch[1]);
  }

  return { warnings, errors };
}

function runTask(task) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(task.command, [], {
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    let output = '';
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      const { warnings, errors } = parseTaskOutput(output, task.name);
      
      resolve({
        task,
        success,
        duration,
        output,
        warnings,
        errors
      });
    });
  });
}

async function runParallel() {
  console.log('\n🚀 Ultra Fast Parallel Test Runner\n');
  console.log(`⚡ Running ${tasks.length} tasks in parallel...`);
  console.log(`   ${tasks.map(t => t.emoji + ' ' + t.name).join(', ')}\n`);
  
  const startTime = Date.now();
  const results = await Promise.all(tasks.map(runTask));
  const totalDuration = Date.now() - startTime;
  
  console.log(`\n⚡ Parallel execution completed in ${formatDuration(totalDuration)}`);
  
  // Show results
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    let line = `   ${status} ${result.task.name}: ${formatDuration(result.duration)}`;
    if (result.warnings) line += ` (${result.warnings} warnings)`;
    if (result.errors) line += ` (${result.errors} errors)`;
    console.log(line);
  });
  
  // Calculate savings
  const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);
  const timeSaved = sequentialTime - totalDuration;
  const speedup = sequentialTime / totalDuration;
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RUN SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total Time:        ${formatDuration(totalDuration)}`);
  console.log(`  Sequential Time:   ${formatDuration(sequentialTime)}`);
  console.log(`  Time Saved:        ${formatDuration(timeSaved)} (${speedup.toFixed(1)}x speedup)`);
  console.log('═'.repeat(60));
  
  const allPassed = results.every(r => r.success);
  if (allPassed) {
    console.log(`✅ All tasks passed!`);
  } else {
    const failed = results.filter(r => !r.success).length;
    console.log(`❌ ${failed} task(s) failed`);
  }
  
  // Generate HTML report
  generateReport(results, totalDuration);
  
  return allPassed;
}

function generateReport(results, totalDuration) {
  const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);
  const timeSaved = sequentialTime - totalDuration;
  const speedup = sequentialTime / totalDuration;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Ultra Fast Test Report - ${new Date().toLocaleString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .card .value {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .speedup {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        .task-item {
            display: flex;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .task-status {
            font-size: 28px;
            margin-right: 20px;
        }
        .task-name {
            flex: 1;
            font-weight: 500;
        }
        .task-duration {
            font-weight: bold;
            color: #667eea;
        }
        .progress-bar {
            background: #e9ecef;
            height: 10px;
            border-radius: 5px;
            margin-top: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>⚡ Ultra Fast Test Report</h1>
            <p>All tasks executed in parallel for maximum speed</p>
        </div>
    </div>
    
    <div class="container">
        <div class="summary-grid">
            <div class="card">
                <h3>Total Duration</h3>
                <div class="value">${formatDuration(totalDuration)}</div>
            </div>
            <div class="card">
                <h3>Time Saved</h3>
                <div class="value">${formatDuration(timeSaved)}</div>
            </div>
            <div class="card speedup">
                <h3>Speedup Factor</h3>
                <div class="value">${speedup.toFixed(1)}x</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Task Results</h2>
            ${results.map(r => `
                <div class="task-item">
                    <div class="task-status">${r.success ? '✅' : '❌'}</div>
                    <div class="task-name">
                        ${r.task.emoji} ${r.task.name}
                        ${r.warnings ? `<span style="color: #ffc107;"> (${r.warnings} warnings)</span>` : ''}
                        ${r.errors ? `<span style="color: #dc3545;"> (${r.errors} errors)</span>` : ''}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(r.duration / sequentialTime) * 100}%"></div>
                        </div>
                    </div>
                    <div class="task-duration">${formatDuration(r.duration)}</div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
  `;
  
  writeFileSync('test-results/reports/ultra-fast-report.html', html);
  console.log('\n📊 Report generated: test-results/reports/ultra-fast-report.html');
}

// Run the tests
runParallel().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});