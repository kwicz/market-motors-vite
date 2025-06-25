import { Request } from 'express';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    path: string;
    query?: Record<string, unknown>;
    body?: unknown;
    user?: string;
    userAgent?: string;
    ip?: string;
  };
}

// Logger class
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const emoji = {
        [LogLevel.ERROR]: '❌',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.DEBUG]: '🐛',
      };

      let output = `${emoji[entry.level]} [${entry.level.toUpperCase()}] ${
        entry.message
      }`;

      if (entry.context) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }

      if (entry.request) {
        output += `\n  Request: ${entry.request.method} ${entry.request.path}`;
        if (entry.request.user) {
          output += ` (User: ${entry.request.user})`;
        }
      }

      if (entry.error) {
        output += `\n  Error: ${entry.error.name} - ${entry.error.message}`;
        if (entry.error.stack && entry.level === LogLevel.ERROR) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }

      return output;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const formattedLog = this.formatLog(entry);
    console.error(formattedLog);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Request-specific logging
  logRequest(
    req: Request,
    message: string,
    level: LogLevel = LogLevel.INFO,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        user:
          (req as Request & { user?: { id: string } }).user?.id || 'anonymous',
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      },
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  // Error logging with request context
  logError(
    message: string,
    error: Error,
    req?: Request,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...(req && {
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined,
          user:
            (req as Request & { user?: { id: string } }).user?.id ||
            'anonymous',
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
      }),
    };

    const formattedLog = this.formatLog(entry);
    console.error(formattedLog);
  }

  // Server startup logging
  logServerStart(port: number | string, environment: string): void {
    this.info('🚀 Server started successfully', {
      port,
      environment,
      healthCheck: `http://localhost:${port}/health`,
    });
  }

  // Service operation logging
  logServiceOperation(
    service: string,
    operation: string,
    success: boolean,
    context?: Record<string, unknown>
  ): void {
    const message = `${service}: ${operation} ${
      success ? 'succeeded' : 'failed'
    }`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;

    this.log(level, message, {
      service,
      operation,
      success,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogEntry };
