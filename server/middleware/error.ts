import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { logger, LogLevel } from '../utils/logger';

// Validation error detail interface
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

// Database error interface
interface DatabaseErrorType {
  code?: string;
  message?: string;
}

// JWT error interface
interface JWTErrorType {
  name?: string;
  message?: string;
}

// Multer error interface
interface MulterErrorType {
  code?: string;
  message?: string;
}

// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Standard error response interface
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  statusCode: number;
  details?: ValidationErrorDetail[];
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

// Handle Zod validation errors
const handleZodError = (error: ZodError): ValidationError => {
  const details: ValidationErrorDetail[] = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    // Only include received for issues that have it
    ...('received' in err && {
      received: (err as ZodIssue & { received?: unknown }).received,
    }),
  }));

  return new ValidationError('Validation failed', details);
};

// Handle database errors
const handleDatabaseError = (error: DatabaseErrorType): AppError => {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new ConflictError('Resource already exists');
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null violation
      return new ValidationError('Required field is missing');
    case '22001': // String data too long
      return new ValidationError('Data too long for field');
    case '08001': // Connection error
    case '08006': // Connection failure
      return new DatabaseError('Database connection failed');
    default:
      if (error.message?.includes('duplicate key')) {
        return new ConflictError('Resource already exists');
      }
      return new DatabaseError('Database operation failed');
  }
};

// Handle JWT errors
const handleJWTError = (error: JWTErrorType): AppError => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new UnauthorizedError('Invalid token');
    case 'TokenExpiredError':
      return new UnauthorizedError('Token expired');
    case 'NotBeforeError':
      return new UnauthorizedError('Token not active');
    default:
      return new UnauthorizedError('Authentication failed');
  }
};

// Handle multer errors
const handleMulterError = (error: MulterErrorType): AppError => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File too large');
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files');
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field');
    default:
      return new ValidationError(
        `File upload error: ${error.message || 'Unknown error'}`
      );
  }
};

// Main error handling middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error & {
    statusCode?: number;
    status?: number;
    code?: string;
    type?: string;
  },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError;

  // Handle different types of errors
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err.name?.includes('JWT') || err.name?.includes('Token')) {
    error = handleJWTError(err as JWTErrorType);
  } else if (err.code && typeof err.code === 'string') {
    // Database or other coded errors
    if (err.code.startsWith('23') || err.code.startsWith('08')) {
      error = handleDatabaseError(err as DatabaseErrorType);
    } else if (err.code.startsWith('LIMIT_')) {
      error = handleMulterError(err as MulterErrorType);
    } else {
      error = new AppError(
        err.message || 'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  } else if (err.type === 'entity.parse.failed') {
    error = new ValidationError('Invalid JSON payload');
  } else if (err.type === 'entity.too.large') {
    error = new ValidationError('Request payload too large');
  } else {
    // Generic error
    error = new AppError(
      err.message || 'Internal server error',
      err.statusCode || err.status || 500,
      err.code || 'INTERNAL_ERROR'
    );
  }

  // Log the error using the new logger (don't log validation errors as they're user errors)
  if (error.statusCode >= 500) {
    logger.logError('API Error', err, req, {
      errorCode: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    });
  } else if (
    error.statusCode >= 400 &&
    process.env.NODE_ENV === 'development'
  ) {
    // Log client errors in development for debugging
    logger.logRequest(req, `Client Error: ${error.message}`, LogLevel.WARN, {
      errorCode: error.code,
      statusCode: error.statusCode,
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Add details for validation errors
  if (error instanceof ValidationError && error.details.length > 0) {
    errorResponse.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.statusCode >= 500) {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(error.statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const error: ErrorResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Log 404 errors for monitoring
  logger.logRequest(req, 'Route not found', LogLevel.WARN);

  res.status(404).json(error);
};

// Async error wrapper utility with proper typing
export const asyncHandler = <
  T extends Request = Request,
  U extends Response = Response
>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Success response utility
export const sendSuccess = (
  res: Response,
  data: unknown = null,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Paginated response utility
export const sendPaginatedResponse = (
  res: Response,
  data: unknown[],
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  },
  message = 'Success',
  filters: Record<string, unknown> = {}
): void => {
  res.status(200).json({
    success: true,
    data,
    pagination,
    filters,
    message,
    timestamp: new Date().toISOString(),
  });
};
