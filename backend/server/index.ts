import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error';
import { logger, LogLevel } from './utils/logger';
import { connectRedis } from './config/redis';
import {
  validateContentType,
  validateRequestSize,
  addRequestId,
  addSecurityHeaders,
} from './middleware/validation';
import {
  csrfProtection,
  setCsrfToken,
  enhancedSecurityHeaders,
  addSecurityContext,
  securityMonitoring,
  advancedRateLimit,
  auditLogger,
} from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', process.env.TRUST_PROXY === 'true');

// Security Context (must be first)
app.use(addSecurityContext);

// Enhanced Security Headers
app.use(enhancedSecurityHeaders);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
  })
);

// Cookie parser (required for CSRF)
app.use(cookieParser());

// Advanced Rate limiting with IP blocking
app.use(
  '/api',
  advancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  })
);

// Fallback rate limiting for other endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.logRequest(req, 'Rate limit exceeded', LogLevel.WARN);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  },
});
app.use(limiter);

// Security monitoring and audit logging
app.use(securityMonitoring);
app.use(auditLogger);

// Request parsing and validation
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Input sanitization (commented out temporarily to fix deployment)
// app.use(sanitizeInput);

// Request validation middleware
app.use(validateRequestSize());
app.use(validateContentType());
app.use(addRequestId);
app.use(addSecurityHeaders);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    })
  );
}

// CSRF token generation for web clients
app.use('/api/csrf-token', setCsrfToken, (req, res) => {
  res.json({
    success: true,
    message: 'CSRF token generated',
    token: req.csrfToken,
  });
});

// CSRF protection for state-changing operations
app.use(csrfProtection());

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
// TODO: Import and use your API routes here
// app.use('/api/auth', authRoutes);
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/admin', adminRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Redis connection
const initializeServer = async () => {
  try {
    // Connect to Redis if enabled
    if (process.env.ENABLE_REDIS_CACHE === 'true') {
      await connectRedis();
      logger.info('Redis connection established');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      logger.info(
        `📊 Health check available at http://localhost:${PORT}/health`
      );

      if (process.env.NODE_ENV === 'development') {
        logger.info(
          `🔒 CSRF token endpoint: http://localhost:${PORT}/api/csrf-token`
        );
        logger.info(`📋 API documentation: http://localhost:${PORT}/api/docs`);
      }
    });
  } catch (error) {
    logger.error(
      'Failed to initialize server',
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise', new Error(String(reason)), {
    promise: promise.toString(),
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize server
initializeServer();

export default app;
