import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger, LogLevel } from '../utils/logger';

// Extend Express Request interface to include CSRF token
declare module 'express' {
  interface Request {
    csrfToken?: string;
    securityContext?: {
      requestId: string;
      userAgent: string;
      ip: string;
      timestamp: Date;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
      securityContext?: any;
    }
  }
}

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */
export const csrfProtection = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for API endpoints using JWT (API clients don't use cookies)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const csrfCookie = req.cookies?.['csrf-token'];

    // Check if CSRF token exists and matches
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      logger.logRequest(req, 'CSRF token validation failed', LogLevel.WARN, {
        hasToken: !!csrfToken,
        hasCookie: !!csrfCookie,
        tokensMatch: csrfToken === csrfCookie,
      });

      res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Generate and set CSRF token
 */
export const setCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = crypto.randomBytes(32).toString('hex');

  // Set CSRF token in cookie (httpOnly for security)
  res.cookie('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Also make token available to client via header
  res.set('X-CSRF-Token', token);
  req.csrfToken = token;

  next();
};

/**
 * Enhanced Security Headers Middleware
 */
export const enhancedSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Basic security headers
  res.set({
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // XSS protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (restrict dangerous features)
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),

    // Remove server information
    Server: 'Market Motors API',
  });

  // HSTS (HTTP Strict Transport Security) - only in production with HTTPS
  if (isProduction) {
    res.set({
      'Strict-Transport-Security':
        'max-age=31536000; includeSubDomains; preload',
    });
  }

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  // More restrictive CSP in production
  if (isProduction) {
    cspDirectives[1] = "script-src 'self'"; // Remove unsafe-inline/eval in production
    cspDirectives[2] = "style-src 'self' https://fonts.googleapis.com"; // Remove unsafe-inline
  }

  res.set('Content-Security-Policy', cspDirectives.join('; '));

  next();
};

/**
 * Security Context Middleware
 * Adds security-related context to requests for monitoring
 */
export const addSecurityContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.securityContext = {
    requestId,
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date(),
  };

  // Set request ID header
  res.set('X-Request-ID', requestId);

  next();
};

/**
 * Security Event Monitoring Middleware
 * Monitors and logs suspicious activities
 */
export const securityMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\b(union|select|insert|update|delete|drop|create|alter)\b/i, // SQL injection attempts
    /<script|javascript:|onload=|onerror=/i, // XSS attempts
    /\.\.\//g, // Path traversal attempts
    /%00|%2e%2e|%2f/i, // Encoded path traversal
  ];

  const requestBody = JSON.stringify(req.body);
  const queryString = req.url;

  let suspiciousActivity = false;
  const detectedPatterns: string[] = [];

  // Check for suspicious patterns in request
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(requestBody) || pattern.test(queryString)) {
      suspiciousActivity = true;
      detectedPatterns.push(`Pattern ${index + 1}`);
    }
  });

  // Log suspicious activity
  if (suspiciousActivity) {
    logger.logRequest(req, 'Suspicious activity detected', LogLevel.WARN, {
      detectedPatterns,
      requestBody: requestBody.substring(0, 500), // Limit log size
      queryString,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  // Monitor response time and status
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log slow requests (potential DoS)
    if (responseTime > 5000) {
      logger.logRequest(req, 'Slow request detected', LogLevel.WARN, {
        responseTime,
        statusCode: res.statusCode,
      });
    }

    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.logRequest(
        req,
        'Authentication/Authorization failure',
        LogLevel.WARN,
        {
          statusCode: res.statusCode,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        }
      );
    }
  });

  next();
};

/**
 * Rate Limiting by IP with sliding window
 */
interface RateLimitStore {
  [key: string]: {
    requests: number[];
    blocked: boolean;
    blockExpiry?: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const advancedRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const { windowMs, maxRequests, blockDurationMs } = options;

    // Initialize client record if not exists
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = {
        requests: [],
        blocked: false,
      };
    }

    const clientRecord = rateLimitStore[clientId];

    // Check if client is currently blocked
    if (
      clientRecord.blocked &&
      clientRecord.blockExpiry &&
      now < clientRecord.blockExpiry
    ) {
      res.status(429).json({
        success: false,
        message: 'IP temporarily blocked due to excessive requests',
        code: 'IP_BLOCKED',
        retryAfter: Math.ceil((clientRecord.blockExpiry - now) / 1000),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Reset block status if expired
    if (
      clientRecord.blocked &&
      clientRecord.blockExpiry &&
      now >= clientRecord.blockExpiry
    ) {
      clientRecord.blocked = false;
      clientRecord.blockExpiry = undefined;
      clientRecord.requests = [];
    }

    // Clean up old requests outside the window
    clientRecord.requests = clientRecord.requests.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (clientRecord.requests.length >= maxRequests) {
      clientRecord.blocked = true;
      clientRecord.blockExpiry = now + blockDurationMs;

      logger.logRequest(
        req,
        'Rate limit exceeded - IP blocked',
        LogLevel.WARN,
        {
          ip: clientId,
          requestCount: clientRecord.requests.length,
          blockDuration: blockDurationMs,
        }
      );

      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. IP blocked temporarily.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(blockDurationMs / 1000),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add current request
    clientRecord.requests.push(now);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (
        maxRequests - clientRecord.requests.length
      ).toString(),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
    });

    next();
  };
};

type SanitizableValue = string | number | boolean | null | undefined;
type SanitizableArray = (SanitizableValue | SanitizableObject)[];
type SanitizableObject = {
  [key: string]: SanitizableValue | SanitizableArray | SanitizableObject;
};

/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters by creating a new object
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = sanitizeObject(req.query) as typeof req.query;
    // Replace the query object properties instead of the whole object
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }

  next();
};

/**
 * Security Audit Logging Middleware
 * Logs security-relevant events for audit purposes
 */
export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log security-relevant requests
  const securityEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/refresh',
    '/admin',
    '/password-reset',
  ];

  const isSecurityEndpoint = securityEndpoints.some((endpoint) =>
    req.path.includes(endpoint)
  );

  if (isSecurityEndpoint) {
    logger.logRequest(req, 'Security endpoint accessed', LogLevel.INFO, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: (req as { user?: { id: string } }).user?.id,
    });
  }

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log failed security operations
    if (isSecurityEndpoint && res.statusCode >= 400) {
      logger.logRequest(req, 'Security operation failed', LogLevel.WARN, {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        userId: (req as { user?: { id: string } }).user?.id,
      });
    }
  });

  next();
};

/**
 * Cleanup rate limit store periodically
 */
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  Object.keys(rateLimitStore).forEach((clientId) => {
    const clientRecord = rateLimitStore[clientId];

    // Remove old requests
    clientRecord.requests = clientRecord.requests.filter(
      (timestamp) => now - timestamp < oneHour
    );

    // Remove clients with no recent activity
    if (clientRecord.requests.length === 0 && !clientRecord.blocked) {
      delete rateLimitStore[clientId];
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes
