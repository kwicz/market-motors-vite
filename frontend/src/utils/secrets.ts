// Secrets management utility for production environments
import { env } from './env';

export interface SecretsConfig {
  // Database secrets
  databaseUrl: string;
  databasePassword?: string;

  // Authentication secrets
  jwtSecret: string;
  jwtRefreshSecret: string;
  sessionSecret: string;

  // External service secrets
  sentryDsn?: string;
  smtpPassword?: string;
  redisPassword?: string;

  // SSL certificates
  sslCertPath?: string;
  sslKeyPath?: string;

  // API keys
  apiKeys?: Record<string, string>;
}

class SecretsManager {
  private secrets: Partial<SecretsConfig> = {};
  private isInitialized = false;

  constructor() {
    this.loadSecrets();
  }

  private loadSecrets(): void {
    try {
      // Load secrets from environment variables
      this.secrets = {
        // Database
        databaseUrl: env.DATABASE_URL || this.generateDatabaseUrl(),
        databasePassword: env.DB_PASSWORD,

        // Authentication
        jwtSecret: env.JWT_SECRET || this.generateSecret('jwt'),
        jwtRefreshSecret:
          env.JWT_REFRESH_SECRET || this.generateSecret('jwt-refresh'),
        sessionSecret: env.SESSION_SECRET || this.generateSecret('session'),

        // External services
        sentryDsn: env.SENTRY_DSN,
        smtpPassword: env.SMTP_PASS,
        redisPassword: env.REDIS_PASSWORD,

        // SSL
        sslCertPath: env.SSL_CERT_PATH,
        sslKeyPath: env.SSL_KEY_PATH,
      };

      this.validateSecrets();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load secrets:', error);
      throw new Error('Secrets initialization failed');
    }
  }

  private generateDatabaseUrl(): string {
    if (env.DB_HOST && env.DB_NAME && env.DB_USER) {
      const password = env.DB_PASSWORD ? `:${env.DB_PASSWORD}` : '';
      const ssl = env.DB_SSL ? '?sslmode=require' : '';
      return `postgresql://${env.DB_USER}${password}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}${ssl}`;
    }
    return '';
  }

  private generateSecret(type: string): string {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        `${type.toUpperCase()}_SECRET must be provided in production`
      );
    }

    // Generate a random secret for development
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    console.warn(
      `Generated ${type} secret for development. Use a secure secret in production.`
    );
    return result;
  }

  private validateSecrets(): void {
    const errors: string[] = [];

    if (env.NODE_ENV === 'production') {
      // Required secrets in production
      if (!this.secrets.jwtSecret) {
        errors.push('JWT_SECRET is required in production');
      }
      if (!this.secrets.jwtRefreshSecret) {
        errors.push('JWT_REFRESH_SECRET is required in production');
      }
      if (!this.secrets.sessionSecret) {
        errors.push('SESSION_SECRET is required in production');
      }
      if (!this.secrets.databaseUrl) {
        errors.push(
          'DATABASE_URL or database connection details are required in production'
        );
      }

      // Validate secret strength
      if (this.secrets.jwtSecret && this.secrets.jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long');
      }
      if (
        this.secrets.jwtRefreshSecret &&
        this.secrets.jwtRefreshSecret.length < 32
      ) {
        errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
      }
      if (
        this.secrets.sessionSecret &&
        this.secrets.sessionSecret.length < 32
      ) {
        errors.push('SESSION_SECRET must be at least 32 characters long');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Secrets validation failed:\n${errors.join('\n')}`);
    }
  }

  // Get a secret value
  getSecret<K extends keyof SecretsConfig>(
    key: K
  ): SecretsConfig[K] | undefined {
    if (!this.isInitialized) {
      throw new Error('Secrets manager not initialized');
    }
    return this.secrets[key];
  }

  // Check if a secret exists
  hasSecret(key: keyof SecretsConfig): boolean {
    return Boolean(this.secrets[key]);
  }

  // Get all secrets (for debugging - be careful with this)
  getAllSecrets(): Partial<SecretsConfig> {
    if (env.NODE_ENV === 'production') {
      throw new Error('Cannot access all secrets in production');
    }
    return { ...this.secrets };
  }

  // Update a secret at runtime (useful for dynamic configuration)
  updateSecret<K extends keyof SecretsConfig>(
    key: K,
    value: SecretsConfig[K]
  ): void {
    this.secrets[key] = value;
  }

  // Get database connection string
  getDatabaseUrl(): string {
    return this.getSecret('databaseUrl') || '';
  }

  // Get JWT configuration
  getJWTConfig() {
    return {
      secret: this.getSecret('jwtSecret'),
      refreshSecret: this.getSecret('jwtRefreshSecret'),
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    };
  }

  // Get session configuration
  getSessionConfig() {
    return {
      secret: this.getSecret('sessionSecret'),
      secure: env.SESSION_COOKIE_SECURE,
      httpOnly: env.SESSION_COOKIE_HTTP_ONLY,
      sameSite: env.SESSION_COOKIE_SAME_SITE,
    };
  }

  // Get Redis configuration
  getRedisConfig() {
    return {
      url: env.REDIS_URL,
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: this.getSecret('redisPassword'),
    };
  }

  // Get SMTP configuration
  getSMTPConfig() {
    return {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: this.getSecret('smtpPassword'),
      from: env.EMAIL_FROM,
    };
  }

  // Get SSL configuration
  getSSLConfig() {
    return {
      enabled: env.SSL_ENABLED,
      certPath: this.getSecret('sslCertPath'),
      keyPath: this.getSecret('sslKeyPath'),
    };
  }

  // Mask sensitive values for logging
  maskSecret(secret: string | undefined): string {
    if (!secret) return 'undefined';
    if (secret.length <= 8) return '***';
    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
  }

  // Get configuration summary for logging (with masked secrets)
  getConfigSummary() {
    return {
      environment: env.NODE_ENV,
      database: {
        url: this.maskSecret(this.secrets.databaseUrl),
        ssl: env.DB_SSL,
      },
      auth: {
        jwt: this.maskSecret(this.secrets.jwtSecret),
        session: this.maskSecret(this.secrets.sessionSecret),
      },
      external: {
        sentry: Boolean(this.secrets.sentryDsn),
        redis: Boolean(this.secrets.redisPassword),
        smtp: Boolean(this.secrets.smtpPassword),
      },
      ssl: {
        enabled: env.SSL_ENABLED,
        configured: Boolean(
          this.secrets.sslCertPath && this.secrets.sslKeyPath
        ),
      },
    };
  }
}

// Create singleton instance
const secretsManager = new SecretsManager();

// Export the manager and utilities
export { secretsManager };
export default secretsManager;

// Export convenience functions
export const getSecret = <K extends keyof SecretsConfig>(key: K) =>
  secretsManager.getSecret(key);
export const getDatabaseUrl = () => secretsManager.getDatabaseUrl();
export const getJWTConfig = () => secretsManager.getJWTConfig();
export const getSessionConfig = () => secretsManager.getSessionConfig();
export const getRedisConfig = () => secretsManager.getRedisConfig();
export const getSMTPConfig = () => secretsManager.getSMTPConfig();
export const getSSLConfig = () => secretsManager.getSSLConfig();
export const getConfigSummary = () => secretsManager.getConfigSummary();
