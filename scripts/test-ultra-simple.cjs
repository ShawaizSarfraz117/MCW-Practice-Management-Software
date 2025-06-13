#!/usr/bin/env node
const { exec } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Ensure test-results directory exists
if (!existsSync('test-results')) {
  mkdirSync('test-results', { recursive: true });
}
if (!existsSync('test-results/reports')) {
  mkdirSync('test-results/reports', { recursive: true });
}

const tasks = [
  { name: 'Unit Tests', command: 'npm run test:unit -- --reporter=json --outputFile=test-results/unit-results.json', emoji: '⚡' },
  { name: 'UI Tests', command: 'npm run test:ui -- --reporter=json --outputFile=test-results/ui-results.json', emoji: '🎨' }
];

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

function runTask(task) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`Starting ${task.emoji} ${task.name}...`);
    
    exec(task.command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      const success = !error;
      
      console.log(`${success ? '✅' : '❌'} ${task.name} completed in ${formatDuration(duration)}`);
      
      resolve({
        task,
        success,
        duration,
        error: error ? error.message : null,
        stdout,
        stderr
      });
    });
  });
}

async function runParallel() {
  console.log('\n🚀 Ultra Fast Test Runner (Tests Only)\n');
  console.log(`⚡ Running ${tasks.length} test suites in parallel...\n`);
  
  const startTime = Date.now();
  const results = await Promise.all(tasks.map(runTask));
  const totalDuration = Date.now() - startTime;
  
  console.log(`\n⚡ Parallel execution completed in ${formatDuration(totalDuration)}`);
  
  // Show results
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.task.name}: ${formatDuration(result.duration)}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
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
    console.log(`✅ All tests passed!`);
  } else {
    const failed = results.filter(r => !r.success).length;
    console.log(`❌ ${failed} test suite(s) failed`);
  }
  
  // Generate simple report
  generateReport(results, totalDuration);
  
  return allPassed;
}

function generateReport(results, totalDuration) {
  const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);
  const timeSaved = sequentialTime - totalDuration;
  const speedup = sequentialTime / totalDuration;
  
  const reportData = {
    timestamp: new Date().toISOString(),
    totalDuration,
    sequentialTime,
    timeSaved,
    speedup,
    results: results.map(r => ({
      name: r.task.name,
      duration: r.duration,
      success: r.success,
      error: r.error
    }))
  };
  
  writeFileSync('test-results/reports/ultra-test-summary.json', JSON.stringify(reportData, null, 2));
  console.log('\n📊 Report generated: test-results/reports/ultra-test-summary.json');
}

// Run the tests
runParallel().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});