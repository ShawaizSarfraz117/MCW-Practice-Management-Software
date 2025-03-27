import pino from "pino";
import { config } from "./config";
import { serializers } from "./redaction";
import { getRedactionPaths } from "./redaction";

/**
 * Main Logger class
 */
export class Logger {
  private logger: pino.Logger;
  private component: string;
  private context: Record<string, unknown>;

  /**
   * Create a new logger instance
   * @param component Component name
   * @param context Additional context
   */
  constructor(component = "app", context: Record<string, unknown> = {}) {
    this.component = component;
    this.context = context;

    const isBrowser = "window" in globalThis;

    if (isBrowser) {
      this.logger = pino({
        browser: { asObject: true },
        level: "info",
      }).child({ component, ...context });
      return;
    }

    // Get base configuration
    const baseConfig = config.getBaseConfig(component);

    // Add redaction
    baseConfig.redact = {
      paths: getRedactionPaths(),
      censor: "[REDACTED]",
    };
    baseConfig.serializers = serializers;

    // Create logger based on environment
    if (config.logToFile) {
      try {
        // Ensure logs directory
        const logsDir = config.ensureLogsDirectory();
        if (!logsDir) {
          // Fallback to console if directory creation fails
          this.logger = pino(baseConfig).child(context);
          return;
        }

        // Create date-based log file path
        const date = new Date().toISOString().split("T")[0];
        const logFile = `${logsDir}/${date}.log`;

        // Create file logger with pino's native destination
        this.logger = pino(
          baseConfig,
          pino.destination({
            dest: logFile,
            append: true,
          }),
        ).child(context);
      } catch (error) {
        // Fallback to console logger on error
        console.error("Failed to create file logger:", error);
        this.logger = pino(baseConfig).child(context);
      }
    } else if (config.isPretty) {
      // Pretty logging for development with native transport
      this.logger = pino({
        ...baseConfig,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }).child(context);
    } else {
      // Standard logging
      this.logger = pino(baseConfig).child(context);
    }
  }

  /**
   * Create a child logger with additional context
   * @param additionalContext Additional context information
   */
  child(
    additionalContext: Record<string, unknown> & { component?: string } = {},
  ): Logger {
    const componentName = additionalContext.component || this.component;
    const mergedContext = { ...this.context, ...additionalContext };

    return new Logger(componentName, mergedContext);
  }

  // Standard logging methods

  trace(message: string): void;
  trace(obj: object, message?: string): void;
  trace(messageOrObj: string | object, message?: string): void {
    try {
      if (typeof messageOrObj === "string") {
        this.logger.trace(messageOrObj);
      } else {
        this.logger.trace(messageOrObj, message || "");
      }
    } catch {
      console.trace("[TRACE]", this.component, messageOrObj, message || "");
    }
  }

  debug(message: string): void;
  debug(obj: object, message?: string): void;
  debug(messageOrObj: string | object, message?: string): void {
    try {
      if (typeof messageOrObj === "string") {
        this.logger.debug(messageOrObj);
      } else {
        this.logger.debug(messageOrObj, message || "");
      }
    } catch {
      console.debug("[DEBUG]", this.component, messageOrObj, message || "");
    }
  }

  info(message: string): void;
  info(obj: object, message?: string): void;
  info(messageOrObj: string | object, message?: string): void {
    try {
      if (typeof messageOrObj === "string") {
        this.logger.info(messageOrObj);
      } else {
        this.logger.info(messageOrObj, message || "");
      }
    } catch {
      console.info("[INFO]", this.component, messageOrObj, message || "");
    }
  }

  warn(message: string): void;
  warn(obj: object, message?: string): void;
  warn(messageOrObj: string | object, message?: string): void {
    try {
      if (typeof messageOrObj === "string") {
        this.logger.warn(messageOrObj);
      } else {
        this.logger.warn(messageOrObj, message || "");
      }
    } catch {
      console.warn("[WARN]", this.component, messageOrObj, message || "");
    }
  }

  error(message: string): void;
  error(error: Error, message?: string): void;
  error(obj: object, message?: string): void;
  error(messageOrObjOrError: string | object | Error, message?: string): void {
    try {
      if (messageOrObjOrError instanceof Error) {
        this.logger.error(
          {
            err: messageOrObjOrError,
            message: messageOrObjOrError.message,
            stack: messageOrObjOrError.stack,
          },
          message || "An error occurred",
        );
      } else {
        this.logger.error(messageOrObjOrError, message);
      }
    } catch {
      console.error(
        "[ERROR]",
        this.component,
        messageOrObjOrError,
        message || "",
      );
    }
  }

  fatal(message: string): void;
  fatal(obj: object, message?: string): void;
  fatal(messageOrObj: string | object, message?: string): void {
    try {
      if (typeof messageOrObj === "string") {
        this.logger.fatal(messageOrObj);
      } else {
        this.logger.fatal(messageOrObj, message || "");
      }
    } catch {
      console.error("[FATAL]", this.component, messageOrObj, message || "");
    }
  }
}

// Create default logger instance
export const logger = new Logger();

/**
 * Create a logger for database operations
 * @param operation Database operation type
 * @param model Database model name
 */
export function getDbLogger(operation: string, model: string): Logger {
  return logger.child({
    component: "database",
    operation,
    model,
  });
}
