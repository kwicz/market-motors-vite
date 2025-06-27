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
import path from 'path';
import { fileURLToPath } from 'url';
import { router as authRoutes } from './routes/auth';
import { router as carRoutes } from './routes/cars';
import { router as userRoutes } from './routes/users';
import { router as uploadRoutes } from './routes/upload';
import { router as passwordResetRoutes } from './routes/passwordReset';

// Load environment variables
dotenv.config();

const app: any = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', process.env.TRUST_PROXY === 'true');

// Utility to log route registration
function logRouteRegistration(method: string, pathOrHandler: any) {
  if (typeof pathOrHandler === 'string') {
    console.log(`[ROUTE REGISTER] ${method}: ${pathOrHandler}`);
  } else {
    console.log(`[ROUTE REGISTER] ${method}: <handler>`);
  }
}

// Security Context (must be first)
logRouteRegistration('use', addSecurityContext);
app.use(addSecurityContext);

// Enhanced Security Headers
logRouteRegistration('use', enhancedSecurityHeaders);
app.use(enhancedSecurityHeaders);

// Security middleware
logRouteRegistration('use', 'helmet');
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
logRouteRegistration('use', 'cors');
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
logRouteRegistration('use', 'cookieParser');
app.use(cookieParser());

// Advanced Rate limiting with IP blocking
logRouteRegistration('use', '/api');
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
logRouteRegistration('use', 'limiter');
app.use(limiter);

// Security monitoring and audit logging
logRouteRegistration('use', 'securityMonitoring');
app.use(securityMonitoring);
logRouteRegistration('use', 'auditLogger');
app.use(auditLogger);

// Request parsing and validation
logRouteRegistration('use', 'json parser');
app.use(express.json({ limit: '10mb' }));
logRouteRegistration('use', 'urlencoded parser');
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
logRouteRegistration('use', 'compression');
app.use(compression());

// Input sanitization (commented out temporarily to fix deployment)
// logRouteRegistration('use', 'sanitizeInput');
// app.use(sanitizeInput);

// Request validation middleware
logRouteRegistration('use', 'validateRequestSize');
app.use(validateRequestSize());
logRouteRegistration('use', 'validateContentType');
app.use(validateContentType());
logRouteRegistration('use', 'addRequestId');
app.use(addRequestId);
logRouteRegistration('use', 'addSecurityHeaders');
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
logRouteRegistration('use', 'setCsrfToken');
app.use('/api/csrf-token', setCsrfToken, (req, res) => {
  res.json({
    success: true,
    message: 'CSRF token generated',
    token: req.csrfToken,
  });
});

// CSRF protection for state-changing operations
logRouteRegistration('use', 'csrfProtection');
app.use(csrfProtection());

// Health check endpoint (before authentication)
logRouteRegistration('get', '/health');
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
logRouteRegistration('use', '/api/auth');
app.use('/api/auth', authRoutes);
logRouteRegistration('use', '/api/cars');
app.use('/api/cars', carRoutes);
logRouteRegistration('use', '/api/users');
app.use('/api/users', userRoutes);
logRouteRegistration('use', '/api/upload');
app.use('/api/upload', uploadRoutes);
logRouteRegistration('use', '/api/password-reset');
app.use('/api/password-reset', passwordResetRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  logRouteRegistration('use', 'static frontend');
  app.use(express.static(frontendDistPath));

  // For any non-API route, serve index.html (for React Router)
  logRouteRegistration('get', '* (frontend fallback)');
  app.get('/*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Catch-all for undefined routes
logRouteRegistration('use', 'notFoundHandler');
app.use(notFoundHandler);

// Global error handler (must be last)
logRouteRegistration('use', 'errorHandler');
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
    });
  } catch (error) {
    logger.error('Error initializing server:', error);
    process.exit(1);
  }
};

initializeServer();
export default app;
