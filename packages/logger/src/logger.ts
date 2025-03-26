import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define log levels and their priority
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};


export class Logger {
  private component: string;
  private context: Record<string, any>;

  constructor(component = 'app', context = {}) {
    this.component = component;
    this.context = context;
  }

  // Create a child logger with additional context
  child(additionalContext: Record<string, any> = {}) {
    const newLogger = new Logger(
      additionalContext.component || this.component,
      { ...this.context, ...additionalContext }
    );
    return newLogger;
  }

  // Create a logger from request object
  fromRequest(req: NextRequest) {
    const path = new URL(req.url).pathname;
    const requestContext = {
      path,
      method: req.method,
      requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
      component: 'api'
    };
    
    return this.child(requestContext);
  }

  // Check if the log level should be displayed based on configured level
  private shouldLog(level: LogLevel): boolean {
    // Determine the configured log level
    let configuredLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
    
    // If this is a database component, use the database-specific level if available
    if (this.component === 'database' || this.component === 'prisma') {
      configuredLevel = (process.env.LOG_LEVEL_PRISMA || configuredLevel) as LogLevel;
    }
    
    // Check if this level should be logged
    return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
  }

  // Create log message with context
  private formatMessage(level: string, message: string, data?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const contextStr = JSON.stringify({ 
      ...this.context, 
      ...data, 
      component: this.component, 
      timestamp 
    });
    
    return `[${level.toUpperCase()}] ${contextStr} ${message}`;
  }
  
  // Write log message to file
  private writeToFile(message: string): void {
    if (process.env.LOG_TO_FILE !== 'true') return;
    
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Get current date for filename
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(logsDir, `${date}.log`);
      
      // Append to log file
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Log methods
  trace(message: string): void;
  trace(data: Record<string, any>, message: string): void;
  trace(messageOrData: string | Record<string, any>, messageOrNothing?: string): void {
    if (!this.shouldLog('trace')) return;
    
    const formattedMessage = typeof messageOrData === 'string'
      ? this.formatMessage('trace', messageOrData)
      : this.formatMessage('trace', messageOrNothing || '', messageOrData);
    
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }
  
  debug(message: string): void;
  debug(data: Record<string, any>, message: string): void;
  debug(messageOrData: string | Record<string, any>, messageOrNothing?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = typeof messageOrData === 'string'
      ? this.formatMessage('debug', messageOrData)
      : this.formatMessage('debug', messageOrNothing || '', messageOrData);
    
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  info(message: string): void;
  info(data: Record<string, any>, message: string): void;
  info(messageOrData: string | Record<string, any>, messageOrNothing?: string): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = typeof messageOrData === 'string'
      ? this.formatMessage('info', messageOrData)
      : this.formatMessage('info', messageOrNothing || '', messageOrData);
    
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message: string): void;
  warn(data: Record<string, any>, message: string): void;
  warn(messageOrData: string | Record<string, any>, messageOrNothing?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = typeof messageOrData === 'string'
      ? this.formatMessage('warn', messageOrData)
      : this.formatMessage('warn', messageOrNothing || '', messageOrData);
    
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  error(message: string): void;
  error(error: Error, message: string): void;
  error(data: Record<string, any>, message: string): void;
  error(messageOrDataOrError: string | Record<string, any> | Error, messageOrNothing?: string): void {
    if (!this.shouldLog('error')) return;
    
    let formattedMessage: string;
    
    if (typeof messageOrDataOrError === 'string') {
      formattedMessage = this.formatMessage('error', messageOrDataOrError);
    } else if (messageOrDataOrError instanceof Error) {
      const errorData = {
        name: messageOrDataOrError.name,
        message: messageOrDataOrError.message,
        stack: messageOrDataOrError.stack
      };
      formattedMessage = this.formatMessage('error', messageOrNothing || 'An error occurred', errorData);
    } else {
      formattedMessage = this.formatMessage('error', messageOrNothing || '', messageOrDataOrError);
    }
    
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }
  
  fatal(message: string): void;
  fatal(data: Record<string, any>, message: string): void;
  fatal(messageOrData: string | Record<string, any>, messageOrNothing?: string): void {
    if (!this.shouldLog('fatal')) return;
    
    const formattedMessage = typeof messageOrData === 'string'
      ? this.formatMessage('fatal', messageOrData)
      : this.formatMessage('fatal', messageOrNothing || '', messageOrData);
    
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }
}

// Create default logger instance
export const logger = new Logger();


export function getDbOperationLogger(operation: string, model: string) {
  return logger.child({
    component: 'database',
    operation,
    model
  });
}