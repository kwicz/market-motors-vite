import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error';

// Validation middleware factory
export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Request validation failed',
          error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            ...('received' in err && { received: (err as any).received }),
          }))
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Content-Type validation middleware
export const validateContentType = (
  allowedTypes: string[] = ['application/json']
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET requests
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('Content-Type');

    if (!contentType) {
      return next(new ValidationError('Content-Type header is required'));
    }

    // Check if content type matches any allowed type
    const isValidContentType = allowedTypes.some((type) =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isValidContentType) {
      return next(
        new ValidationError(
          `Invalid Content-Type. Expected one of: ${allowedTypes.join(', ')}`
        )
      );
    }

    next();
  };
};

// Request size validation middleware
export const validateRequestSize = (
  maxSizeBytes: number = 10 * 1024 * 1024
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');

    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return next(
        new ValidationError(
          `Request too large. Maximum size is ${Math.round(
            maxSizeBytes / 1024 / 1024
          )}MB`
        )
      );
    }

    next();
  };
};

// API version validation middleware
export const validateApiVersion = (supportedVersions: string[] = ['v1']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiVersion =
      req.get('API-Version') || (req.query.version as string) || 'v1';

    if (!supportedVersions.includes(apiVersion)) {
      return next(
        new ValidationError(
          `Unsupported API version. Supported versions: ${supportedVersions.join(
            ', '
          )}`
        )
      );
    }

    // Add version to request for use in handlers
    (req as any).apiVersion = apiVersion;
    next();
  };
};

// Request ID middleware for tracing
export const addRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId =
    req.get('X-Request-ID') ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  (req as any).requestId = requestId;
  res.set('X-Request-ID', requestId);

  next();
};

// Security headers middleware
export const addSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  next();
};
