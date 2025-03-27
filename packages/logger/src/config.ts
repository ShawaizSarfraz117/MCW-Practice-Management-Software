import fs from "fs";
import path from "path";
import { LoggerOptions } from "pino";
import pino from "pino";
import type { NextRequest } from "next/server";
// Define log levels type
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Logger configuration class
 */
export class LoggerConfig {
  private static instance: LoggerConfig;

  // Core configuration
  private _level: LogLevel;
  private _logToFile: boolean;
  private _isPretty: boolean;
  private _logsDir: string;
  private _redactFields: string[];

  private constructor() {
    // Initialize with environment values
    this._level = (process.env.LOG_LEVEL as LogLevel) || "info";
    this._logToFile = process.env.LOG_TO_FILE === "true";
    this._isPretty = process.env.NODE_ENV !== "production";
    this._logsDir = process.env.LOGS_DIRECTORY || "logs";

    // Default sensitive fields to redact
    this._redactFields = [
      "password",
      "secret",
      "token",
      "authorization",
      "apiKey",
      "api_key",
      "email",
      "phone",
      "creditCard",
      "credit_card",
      "ssn",
      "dob",
      "birthdate",
    ];
  }

  public static getInstance(): LoggerConfig {
    if (!LoggerConfig.instance) {
      LoggerConfig.instance = new LoggerConfig();
    }
    return LoggerConfig.instance;
  }

  // Configuration getters
  get level(): LogLevel {
    return this._level;
  }
  get logToFile(): boolean {
    return this._logToFile;
  }
  get isPretty(): boolean {
    return this._isPretty;
  }
  get logsDir(): string {
    return this._logsDir;
  }
  get redactFields(): string[] {
    return this._redactFields;
  }

  // Methods to override defaults
  public setLevel(level: LogLevel): LoggerConfig {
    this._level = level;
    return this;
  }

  public setLogToFile(logToFile: boolean): LoggerConfig {
    this._logToFile = logToFile;
    return this;
  }

  public setPretty(isPretty: boolean): LoggerConfig {
    this._isPretty = isPretty;
    return this;
  }

  public setLogsDir(logsDir: string): LoggerConfig {
    this._logsDir = logsDir;
    return this;
  }

  public setRedactFields(fields: string[]): LoggerConfig {
    this._redactFields = fields;
    return this;
  }

  // Get component-specific log level
  public getLevelForComponent(component: string): LogLevel {
    if (component === "database" || component === "prisma") {
      return (process.env.LOG_LEVEL_DB as LogLevel) || this._level;
    }
    return this._level;
  }

  // Ensure logs directory exists
  public ensureLogsDirectory(): string | null {
    if (typeof window === "undefined" && this._logToFile) {
      const logsDir = path.join(process.cwd(), this._logsDir);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      return logsDir;
    }
    return null;
  }

  // Get paths for data redaction
  public getRedactionPaths(): string[] {
    // Build comprehensive redaction paths
    const paths: string[] = [];

    this._redactFields.forEach((field) => {
      // Direct field
      paths.push(field);

      // Common nested locations
      paths.push(`*.${field}`);
      paths.push(`body.${field}`);
      paths.push(`params.${field}`);
      paths.push(`headers.${field}`);
      paths.push(`query.${field}`);
      paths.push(`user.${field}`);
    });

    return paths;
  }

  // Get base Pino configuration with redaction
  public getBaseConfig(component: string): LoggerOptions {
    return {
      level: this.getLevelForComponent(component),
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      base: { component },

      // Built-in Pino redaction
      redact: {
        paths: this.getRedactionPaths(),
        censor: "[REDACTED]",
        remove: false,
      },

      // Standard serializers with custom handling
      serializers: {
        err: pino.stdSerializers.err,
        req: this.customRequestSerializer.bind(this),
        res: pino.stdSerializers.res,
      },
    };
  }

  // Custom request serializer with redaction
  private customRequestSerializer(req: NextRequest): object {
    if (!req) return {};

    // Use standard serializer as a base
    const serialized = {
      method: req.method,
      url: req.url,
      headers: req.headers,
    };

    // Safely redact sensitive values in URL params
    if (req.url) {
      try {
        const url = new URL(req.url, "http://example.com");
        this._redactFields.forEach((field) => {
          if (url.searchParams.has(field)) {
            url.searchParams.set(field, "[REDACTED]");
          }
        });
        serialized.url = url.pathname + url.search;
      } catch {
        // URL parsing failed, keep original
      }
    }

    return serialized;
  }
}

export const config = LoggerConfig.getInstance();
