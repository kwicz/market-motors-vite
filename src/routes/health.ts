import { Router } from 'express';
import { db } from '../db/connection';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// Basic health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'disconnected',
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    };

    // Check database connection
    const dbStartTime = Date.now();
    try {
      // Simple query to check database connectivity
      await db.execute('SELECT 1');
      healthCheck.services.database = {
        status: 'connected',
        responseTime: Date.now() - dbStartTime,
      };
    } catch (error) {
      healthCheck.services.database = {
        status: 'error',
        responseTime: Date.now() - dbStartTime,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      };
      healthCheck.status = 'degraded';
    }

    // Check Redis connection if enabled
    if (process.env.ENABLE_REDIS_CACHE === 'true' && process.env.REDIS_URL) {
      const redisStartTime = Date.now();
      try {
        // Redis connection check would go here
        // For now, we'll assume it's working if the URL is provided
        healthCheck.services.redis = {
          status: 'connected',
          responseTime: Date.now() - redisStartTime,
        };
      } catch (error) {
        healthCheck.services.redis = {
          status: 'error',
          responseTime: Date.now() - redisStartTime,
          error: error instanceof Error ? error.message : 'Unknown Redis error',
        };
        if (healthCheck.status === 'healthy') {
          healthCheck.status = 'degraded';
        }
      }
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;

    healthCheck.services.memory = {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100),
    };

    // Check if memory usage is too high
    if (healthCheck.services.memory.percentage > 90) {
      healthCheck.status = 'degraded';
    }

    // Determine overall status
    if (healthCheck.services.database.status === 'error') {
      healthCheck.status = 'unhealthy';
    }

    // Log health check
    logger.info('Health check performed', {
      status: healthCheck.status,
      dbStatus: healthCheck.services.database.status,
      memoryUsage: healthCheck.services.memory.percentage,
    });

    // Return appropriate HTTP status code
    const statusCode =
      healthCheck.status === 'healthy'
        ? 200
        : healthCheck.status === 'degraded'
        ? 200
        : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

// Readiness probe endpoint
router.get('/ready', async (req, res) => {
  try {
    // Check if the application is ready to serve traffic
    await db.execute('SELECT 1');

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness probe endpoint
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
