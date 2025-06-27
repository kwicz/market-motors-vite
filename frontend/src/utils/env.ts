import loggerUtils from './logger';

// Environment configuration utility
export interface EnvironmentConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  VITE_PORT?: number;

  // Database
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_SSL: boolean;

  // Redis
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  // Authentication
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;

  // Session
  SESSION_SECRET?: string;
  SESSION_COOKIE_SECURE: boolean;
  SESSION_COOKIE_HTTP_ONLY: boolean;
  SESSION_COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';

  // CORS
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: boolean;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  ALLOWED_FILE_TYPES: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;

  // Error Tracking
  VITE_SENTRY_DSN?: string;
  VITE_ENABLE_SENTRY: boolean;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;
  SENTRY_RELEASE: string;

  // Performance
  VITE_ENABLE_PERFORMANCE_MONITORING: boolean;
  PERFORMANCE_SAMPLE_RATE: number;

  // Application URLs
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_API_BASE_URL: string;
  APP_URL: string;
  API_URL: string;

  // Security
  HELMET_ENABLED: boolean;
  TRUST_PROXY: boolean;

  // Logging
  LOG_LEVEL: string;
  LOG_DIR: string;
  LOG_MAX_SIZE: string;
  LOG_MAX_FILES: string;

  // Feature Flags
  ENABLE_REDIS_CACHE: boolean;
  ENABLE_IMAGE_OPTIMIZATION: boolean;
  ENABLE_LAZY_LOADING: boolean;
  ENABLE_PWA: boolean;

  // Development
  VITE_ENABLE_DEVTOOLS: boolean;
  ENABLE_API_DOCS: boolean;
  ENABLE_QUERY_LOGGING: boolean;

  // SSL
  SSL_ENABLED: boolean;
  SSL_CERT_PATH?: string;
  SSL_KEY_PATH?: string;

  // Health Check
  HEALTH_CHECK_ENABLED: boolean;
  HEALTH_CHECK_PATH: string;
  HEALTH_CHECK_TIMEOUT: number;
}

// Environment variable getter function
function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first (Vite environment)
  if (typeof window !== 'undefined') {
    try {
      // Check if import.meta is available in browser context
      const importMeta = (
        globalThis as { import?: { meta?: { env?: Record<string, string> } } }
      ).import;
      if (importMeta?.meta?.env?.[key]) {
        return importMeta.meta.env[key];
      }
    } catch {
      // Ignore errors accessing import.meta in browser
    }
  }

  // For server-side or Node.js environment
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  return undefined;
}

// Utility functions for parsing environment variables
function parseNumber(value: string | undefined, defaultValue?: number): number {
  if (!value) return defaultValue || 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue || 0 : parsed;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean = false
): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseEnum<T extends string>(
  value: string | undefined,
  allowedValues: T[],
  defaultValue: T
): T {
  if (!value) return defaultValue;
  return allowedValues.includes(value as T) ? (value as T) : defaultValue;
}

// Create environment configuration
function createEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = parseEnum(
    getEnvVar('NODE_ENV'),
    ['development', 'production', 'test'],
    'development'
  );

  return {
    // Application
    NODE_ENV: nodeEnv,
    PORT: parseNumber(getEnvVar('PORT'), 3000),
    VITE_PORT: parseNumber(getEnvVar('VITE_PORT')),

    // Database
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    DB_HOST: getEnvVar('DB_HOST'),
    DB_PORT: parseNumber(getEnvVar('DB_PORT'), 5432),
    DB_NAME: getEnvVar('DB_NAME'),
    DB_USER: getEnvVar('DB_USER'),
    DB_PASSWORD: getEnvVar('DB_PASSWORD'),
    DB_SSL: parseBoolean(getEnvVar('DB_SSL'), false),

    // Redis
    REDIS_URL: getEnvVar('REDIS_URL'),
    REDIS_HOST: getEnvVar('REDIS_HOST'),
    REDIS_PORT: parseNumber(getEnvVar('REDIS_PORT'), 6379),
    REDIS_PASSWORD: getEnvVar('REDIS_PASSWORD'),

    // Authentication
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN') || '15m',
    JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN') || '7d',
    BCRYPT_ROUNDS: parseNumber(getEnvVar('BCRYPT_ROUNDS'), 12),

    // Session
    SESSION_SECRET: getEnvVar('SESSION_SECRET'),
    SESSION_COOKIE_SECURE: parseBoolean(
      getEnvVar('SESSION_COOKIE_SECURE'),
      nodeEnv === 'production'
    ),
    SESSION_COOKIE_HTTP_ONLY: parseBoolean(
      getEnvVar('SESSION_COOKIE_HTTP_ONLY'),
      true
    ),
    SESSION_COOKIE_SAME_SITE: parseEnum(
      getEnvVar('SESSION_COOKIE_SAME_SITE'),
      ['strict', 'lax', 'none'],
      'lax'
    ),

    // CORS
    CORS_ORIGIN: getEnvVar('CORS_ORIGIN') || 'http://localhost:5173',
    CORS_CREDENTIALS: parseBoolean(getEnvVar('CORS_CREDENTIALS'), true),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseNumber(
      getEnvVar('RATE_LIMIT_WINDOW_MS'),
      900000
    ),
    RATE_LIMIT_MAX_REQUESTS: parseNumber(
      getEnvVar('RATE_LIMIT_MAX_REQUESTS'),
      100
    ),

    // File Upload
    MAX_FILE_SIZE: parseNumber(getEnvVar('MAX_FILE_SIZE'), 10485760),
    UPLOAD_DIR: getEnvVar('UPLOAD_DIR') || 'uploads',
    ALLOWED_FILE_TYPES:
      getEnvVar('ALLOWED_FILE_TYPES') ||
      'image/jpeg,image/png,image/webp,image/gif',

    // Email
    SMTP_HOST: getEnvVar('SMTP_HOST'),
    SMTP_PORT: parseNumber(getEnvVar('SMTP_PORT'), 587),
    SMTP_SECURE: parseBoolean(getEnvVar('SMTP_SECURE'), false),
    SMTP_USER: getEnvVar('SMTP_USER'),
    SMTP_PASS: getEnvVar('SMTP_PASS'),
    EMAIL_FROM: getEnvVar('EMAIL_FROM'),

    // Error Tracking
    VITE_SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN'),
    VITE_ENABLE_SENTRY: parseBoolean(getEnvVar('VITE_ENABLE_SENTRY'), false),
    SENTRY_DSN: getEnvVar('SENTRY_DSN'),
    SENTRY_ENVIRONMENT: getEnvVar('SENTRY_ENVIRONMENT') || nodeEnv,
    SENTRY_RELEASE: getEnvVar('SENTRY_RELEASE') || '1.0.0',

    // Performance
    VITE_ENABLE_PERFORMANCE_MONITORING: parseBoolean(
      getEnvVar('VITE_ENABLE_PERFORMANCE_MONITORING'),
      true
    ),
    PERFORMANCE_SAMPLE_RATE: parseNumber(
      getEnvVar('PERFORMANCE_SAMPLE_RATE'),
      1.0
    ),

    // Application URLs
    VITE_APP_NAME: getEnvVar('VITE_APP_NAME') || 'Market Motors',
    VITE_APP_VERSION: getEnvVar('VITE_APP_VERSION') || '1.0.0',
    VITE_API_BASE_URL:
      getEnvVar('VITE_API_BASE_URL') || 'http://localhost:3000/api',
    APP_URL: getEnvVar('APP_URL') || 'http://localhost:5173',
    API_URL: getEnvVar('API_URL') || 'http://localhost:3000',

    // Security
    HELMET_ENABLED: parseBoolean(getEnvVar('HELMET_ENABLED'), true),
    TRUST_PROXY: parseBoolean(getEnvVar('TRUST_PROXY'), false),

    // Logging
    LOG_LEVEL: getEnvVar('LOG_LEVEL') || 'debug',
    LOG_DIR: getEnvVar('LOG_DIR') || 'logs',
    LOG_MAX_SIZE: getEnvVar('LOG_MAX_SIZE') || '20m',
    LOG_MAX_FILES: getEnvVar('LOG_MAX_FILES') || '14d',

    // Feature Flags
    ENABLE_REDIS_CACHE: parseBoolean(getEnvVar('ENABLE_REDIS_CACHE'), false),
    ENABLE_IMAGE_OPTIMIZATION: parseBoolean(
      getEnvVar('ENABLE_IMAGE_OPTIMIZATION'),
      true
    ),
    ENABLE_LAZY_LOADING: parseBoolean(getEnvVar('ENABLE_LAZY_LOADING'), true),
    ENABLE_PWA: parseBoolean(getEnvVar('ENABLE_PWA'), false),

    // Development
    VITE_ENABLE_DEVTOOLS: parseBoolean(
      getEnvVar('VITE_ENABLE_DEVTOOLS'),
      nodeEnv === 'development'
    ),
    ENABLE_API_DOCS: parseBoolean(
      getEnvVar('ENABLE_API_DOCS'),
      nodeEnv === 'development'
    ),
    ENABLE_QUERY_LOGGING: parseBoolean(
      getEnvVar('ENABLE_QUERY_LOGGING'),
      nodeEnv === 'development'
    ),

    // SSL
    SSL_ENABLED: parseBoolean(getEnvVar('SSL_ENABLED'), false),
    SSL_CERT_PATH: getEnvVar('SSL_CERT_PATH'),
    SSL_KEY_PATH: getEnvVar('SSL_KEY_PATH'),

    // Health Check
    HEALTH_CHECK_ENABLED: parseBoolean(getEnvVar('HEALTH_CHECK_ENABLED'), true),
    HEALTH_CHECK_PATH: getEnvVar('HEALTH_CHECK_PATH') || '/health',
    HEALTH_CHECK_TIMEOUT: parseNumber(getEnvVar('HEALTH_CHECK_TIMEOUT'), 5000),
  };
}

// Validation functions
function validateRequiredEnvVars(config: EnvironmentConfig): string[] {
  const errors: string[] = [];

  if (config.NODE_ENV === 'production') {
    if (!config.JWT_SECRET) errors.push('JWT_SECRET is required in production');
    if (!config.JWT_REFRESH_SECRET)
      errors.push('JWT_REFRESH_SECRET is required in production');
    if (!config.SESSION_SECRET)
      errors.push('SESSION_SECRET is required in production');
    if (!config.DATABASE_URL && !config.DB_HOST)
      errors.push('DATABASE_URL or DB_HOST is required');
  }

  return errors;
}

function validateEnvironmentSecurity(config: EnvironmentConfig): string[] {
  const warnings: string[] = [];

  if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long');
    }
    if (!config.SESSION_COOKIE_SECURE) {
      warnings.push('SESSION_COOKIE_SECURE should be true in production');
    }
    if (!config.SSL_ENABLED) {
      warnings.push('SSL should be enabled in production');
    }
  }

  return warnings;
}

// Create and export the configuration
const env = createEnvironmentConfig();

// Validate environment
const validationErrors = validateRequiredEnvVars(env);
const securityWarnings = validateEnvironmentSecurity(env);

if (validationErrors.length > 0) {
  console.error('Environment Validation Errors:', validationErrors);
  if (env.NODE_ENV === 'production') {
    throw new Error('Critical environment variables are missing');
  }
}

if (securityWarnings.length > 0) {
  console.warn('Environment Security Warnings:', securityWarnings);
}

// Export the configuration and utilities
export { env };
export { getEnvVar, parseNumber, parseBoolean, parseEnum };
export { validateRequiredEnvVars, validateEnvironmentSecurity };

// Export individual getters for convenience
export const getConfig = () => env;
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';
