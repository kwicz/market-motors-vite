import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Add request ID for tracing
app.use(addRequestId);

// Add security headers
app.use(addSecurityHeaders);

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting with proper error handling
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
app.use('/api', limiter);

// Request size validation
app.use(validateRequestSize(10 * 1024 * 1024)); // 10MB limit

// Content-Type validation for API routes
app.use(
  '/api',
  validateContentType(['application/json', 'multipart/form-data'])
);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    type: 'application/json',
    verify: (req: express.Request & { rawBody?: Buffer }, res, buf) => {
      // Store raw body for webhook verification if needed
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint with enhanced status
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: 'v1',
    endpoints: {
      auth: '/api/auth',
      cars: '/api/cars',
      users: '/api/users',
      upload: '/api/upload',
      passwordReset: '/api/password-reset',
    },
  });
});

// Import routes
import authRoutes from './routes/auth';
import passwordResetRoutes from './routes/passwordReset';
import carsRoutes from './routes/cars';
import uploadRoutes from './routes/upload';
import usersRoutes from './routes/users';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server with Redis initialization
const startServer = async () => {
  try {
    // Initialize Redis connection
    await connectRedis();

    // Start the Express server
    app.listen(PORT, () => {
      logger.logServerStart(PORT, process.env.NODE_ENV || 'development');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
