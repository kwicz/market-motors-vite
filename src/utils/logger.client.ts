// src/utils/logger.client.ts
// Browser logger implementation
const loggerUtils = {
  error: (message, error, meta) => {
    console.error('[ERROR]', message, error, meta);
  },
  warn: (message, meta) => {
    console.warn('[WARN]', message, meta);
  },
  info: (message, meta) => {
    console.info('[INFO]', message, meta);
  },
  http: (message, meta) => {
    console.log('[HTTP]', message, meta);
  },
  debug: (message, meta) => {
    console.debug('[DEBUG]', message, meta);
  },
  performance: (operation, duration, meta) => {
    console.info(`[PERF] ${operation}: ${duration}ms`, meta);
  },
  userAction: (userId, action, meta) => {
    console.info(`[USER ACTION] ${userId}: ${action}`, meta);
  },
  dbQuery: (query, duration, meta) => {
    console.debug(`[DB QUERY] ${query}: ${duration}ms`, meta);
  },
  apiRequest: (method, url, statusCode, duration, meta) => {
    console.log(`[API] ${method} ${url} ${statusCode} ${duration}ms`, meta);
  },
  security: (event, severity, meta) => {
    console.warn(`[SECURITY] ${event} (${severity})`, meta);
  },
};

export default loggerUtils;
