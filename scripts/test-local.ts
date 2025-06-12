#!/usr/bin/env node
import { spawn, execSync } from "child_process";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables
dotenv.config();

interface TestMode {
  name: string;
  description: string;
  emoji: string;
  tasks: TestTask[];
  requiresDatabase: boolean;
}

interface TestTask {
  name: string;
  command: string;
  emoji: string;
}

const TEST_MODES: Record<string, TestMode> = {
  fast: {
    name: "Fast Check",
    description: "Lint, TypeCheck, Unit, UI tests (2-3 min)",
    emoji: "🚀",
    requiresDatabase: false,
    tasks: [
      { name: "Linting", command: "npm run lint", emoji: "🔍" },
      { name: "Type Checking", command: "npm run typecheck", emoji: "📝" },
      { name: "Unit Tests", command: "npm run test:unit", emoji: "⚡" },
      { name: "UI Tests", command: "npm run test:ui", emoji: "🎨" },
    ],
  },
  pr: {
    name: "PR Check",
    description: "Mimics GitHub Actions PR workflow (5-10 min)",
    emoji: "🔍",
    requiresDatabase: false,
    tasks: [
      { name: "Linting", command: "npm run lint", emoji: "🔍" },
      { name: "Type Checking", command: "npm run typecheck", emoji: "📝" },
      { name: "Format Check", command: "npm run prettier:check", emoji: "💅" },
      { name: "Unit Tests", command: "npm run test:unit", emoji: "⚡" },
      { name: "UI Tests", command: "npm run test:ui", emoji: "🎨" },
    ],
  },
  full: {
    name: "Full Suite",
    description: "All tests including integration (10-20 min)",
    emoji: "🛡️",
    requiresDatabase: true,
    tasks: [
      { name: "Linting", command: "npm run lint", emoji: "🔍" },
      { name: "Type Checking", command: "npm run typecheck", emoji: "📝" },
      { name: "Format Check", command: "npm run prettier:check", emoji: "💅" },
      { name: "Unit Tests", command: "npm run test:unit", emoji: "⚡" },
      { name: "UI Tests", command: "npm run test:ui", emoji: "🎨" },
      {
        name: "Integration Tests",
        command: "npm run test:integration",
        emoji: "🔗",
      },
    ],
  },
};

class TestRunner {
  private rl: readline.Interface;
  private testDbMode: string;
  private databaseUrl: string;
  private isWSL: boolean;
  private isWindows: boolean;
  private dockerAvailable: boolean;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.testDbMode = process.env.TEST_DB_MODE || "external";
    this.databaseUrl = process.env.DATABASE_URL || "";
    this.isWSL = this.detectWSL();
    this.isWindows = process.platform === "win32";
    this.dockerAvailable = this.checkDocker();
  }

  private detectWSL(): boolean {
    try {
      return readFileSync("/proc/version", "utf8")
        .toLowerCase()
        .includes("microsoft");
    } catch {
      return false;
    }
  }

  private checkDocker(): boolean {
    if (this.testDbMode !== "docker") return false;

    try {
      execSync("docker --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  private printHeader() {
    console.clear();
    console.log("╔════════════════════════════════════════════╗");
    console.log("║         MCW Test Runner v1.0               ║");
    console.log("╠════════════════════════════════════════════╣");
    console.log(`║ Platform: ${this.getPlatformName().padEnd(33)}║`);
    console.log(`║ Database: ${this.getDatabaseInfo().padEnd(33)}║`);
    console.log(
      `║ Docker: ${this.dockerAvailable ? "✅ Available" : "❌ Not available"}`.padEnd(
        45,
      ) + "║",
    );
    console.log("╠════════════════════════════════════════════╣");
  }

  private getPlatformName(): string {
    if (this.isWSL) return "WSL";
    if (this.isWindows) return "Windows";
    return process.platform === "darwin" ? "macOS" : "Linux";
  }

  private getDatabaseInfo(): string {
    if (this.testDbMode === "docker") {
      return this.dockerAvailable ? "Docker SQL" : "Docker (unavailable)";
    }
    if (this.testDbMode === "external" && this.databaseUrl) {
      const match = this.databaseUrl.match(/sqlserver:\/\/([^:]+):(\d+)/);
      if (match) {
        return `External (${match[1]}:${match[2]})`;
      }
    }
    return "Not configured";
  }

  private async showMenu(): Promise<string> {
    this.printHeader();
    console.log("║ Select test mode:                          ║");
    console.log("║                                            ║");

    Object.entries(TEST_MODES).forEach(([_key, mode], index) => {
      console.log(`║ [${index + 1}] ${mode.emoji} ${mode.name.padEnd(35)}║`);
      console.log(`║     → ${mode.description.padEnd(37)}║`);
      console.log("║                                            ║");
    });

    console.log("║ [R] 📊 Generate Performance Report Only    ║");
    console.log("║                                            ║");
    console.log("║ [0] Exit                                   ║");
    console.log("╚════════════════════════════════════════════╝");

    return new Promise((resolve) => {
      this.rl.question("\nYour choice: ", (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  private async runTask(task: TestTask): Promise<boolean> {
    console.log(`\n${task.emoji} Running ${task.name}...`);

    return new Promise((resolve) => {
      const child = spawn(task.command, [], {
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          FORCE_COLOR: "1",
          DATABASE_URL: this.databaseUrl,
        },
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ ${task.name} completed successfully`);
          resolve(true);
        } else {
          console.log(`❌ ${task.name} failed with code ${code}`);
          resolve(false);
        }
      });
    });
  }

  private async runTestMode(mode: TestMode): Promise<void> {
    console.log(`\n🚀 Starting ${mode.name}...\n`);

    const startTime = Date.now();
    let allPassed = true;

    // Check database availability for integration tests
    if (mode.requiresDatabase && this.testDbMode === "external") {
      console.log("🔍 Checking database connection...");
      const dbAvailable = await this.checkDatabaseConnection();
      if (!dbAvailable) {
        console.log(
          "❌ Database connection failed. Skipping integration tests.",
        );
        return;
      }
      console.log("✅ Database connection successful\n");
    }

    // Run tasks
    for (const task of mode.tasks) {
      const passed = await this.runTask(task);
      if (!passed) {
        allPassed = false;
        // Continue running other tasks even if one fails
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n" + "═".repeat(50));
    if (allPassed) {
      console.log(`✅ All tests passed! (${duration}s)`);
    } else {
      console.log(`❌ Some tests failed (${duration}s)`);
    }
    console.log("═".repeat(50));

    // Generate performance report if enabled
    if (process.env.TEST_RUNNER_GENERATE_REPORTS === "true") {
      console.log("\n📊 Generating performance report...");
      await this.generatePerformanceReport();
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Simple connection test using prisma
      execSync(
        "npx prisma db execute --stdin --schema=./packages/database/prisma/schema.prisma < /dev/null",
        {
          stdio: "ignore",
          env: { ...process.env, DATABASE_URL: this.databaseUrl },
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  private async generatePerformanceReport(): Promise<void> {
    try {
      execSync("npm run test:analyze", { stdio: "inherit" });
      console.log("\n📊 Performance report generated in test-results/reports/");
      console.log(
        "   Open test-results/reports/test-performance.html in your browser",
      );
    } catch (_error) {
      console.log("⚠️  Could not generate performance report");
    }
  }

  async run(): Promise<void> {
    // Check for command line arguments
    const args = process.argv.slice(2);
    let selectedMode: string | null = null;

    if (args.length > 0) {
      const modeArg = args.find((arg) => arg.startsWith("--mode="));
      if (modeArg) {
        selectedMode = modeArg.split("=")[1];
      }
    }

    if (selectedMode && TEST_MODES[selectedMode]) {
      await this.runTestMode(TEST_MODES[selectedMode]);
    } else {
      // Interactive mode
      while (true) {
        const choice = await this.showMenu();

        if (choice === "0") {
          console.log("\n👋 Goodbye!");
          break;
        } else if (choice === "r") {
          await this.generatePerformanceReport();
          console.log("\nPress Enter to continue...");
          await new Promise((resolve) => this.rl.question("", resolve));
        } else {
          const modeIndex = parseInt(choice) - 1;
          const modeKeys = Object.keys(TEST_MODES);

          if (modeIndex >= 0 && modeIndex < modeKeys.length) {
            await this.runTestMode(TEST_MODES[modeKeys[modeIndex]]);
            console.log("\nPress Enter to continue...");
            await new Promise((resolve) => this.rl.question("", resolve));
          }
        }
      }
    }

    this.rl.close();
  }
}

// Run the test runner
const runner = new TestRunner();
runner.run().catch(console.error);
