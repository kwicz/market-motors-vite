import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  handleExceptions: true,
  handleRejections: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

const httpFileTransport = new DailyRotateFile({
  filename: 'logs/http-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '7d',
  format: logFormat,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format: logFormat,
  defaultMeta: {
    service: 'market-motors',
    environment: process.env.NODE_ENV,
  },
  transports: [errorFileTransport, combinedFileTransport, httpFileTransport],
  exitOnError: false,
});

if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

const loggerUtils = {
  error: (message, error, meta) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  },
  warn: (message, meta) => {
    logger.warn(message, meta);
  },
  info: (message, meta) => {
    logger.info(message, meta);
  },
  http: (message, meta) => {
    logger.http(message, meta);
  },
  debug: (message, meta) => {
    logger.debug(message, meta);
  },
  performance: (operation, duration, meta) => {
    logger.info(`Performance: ${operation}`, {
      operation,
      duration,
      unit: 'ms',
      ...meta,
    });
  },
  userAction: (userId, action, meta) => {
    logger.info(`[USER ACTION] ${userId}: ${action}`, {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },
  dbQuery: (query, duration, meta) => {
    logger.debug(`[DB QUERY] ${query}: ${duration}ms`, meta);
  },
  apiRequest: (method, url, statusCode, duration, meta) => {
    logger.http(`[API] ${method} ${url} ${statusCode} ${duration}ms`, meta);
  },
  security: (event, severity, meta) => {
    logger.warn(`[SECURITY] ${event} (${severity})`, meta);
  },
};

export { logger };
export default loggerUtils;
