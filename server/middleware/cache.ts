import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

/**
 * Cache middleware for Express routes
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    skipCache = () => false,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Skip caching for non-GET requests or when skipCache condition is met
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached data
      const cachedData = await cacheService.get<unknown>(cacheKey);

      if (cachedData) {
        // Return cached data and end the response
        res.json(cachedData);
        return;
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data: unknown) {
        // Cache the response data
        cacheService.set(cacheKey, data, ttl).catch((error) => {
          console.error('Failed to cache response:', error);
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Cache invalidation middleware for routes that modify data
 */
export const cacheInvalidationMiddleware = (patterns: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to invalidate cache after successful response
    res.json = function (data: unknown) {
      // Only invalidate cache for successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns
        patterns.forEach((pattern) => {
          cacheService.delPattern(pattern).catch((error) => {
            console.error(
              `Failed to invalidate cache pattern ${pattern}:`,
              error
            );
          });
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Predefined cache configurations for common use cases
 */
export const cacheConfigs = {
  // Short cache for frequently changing data
  short: { ttl: 60 }, // 1 minute

  // Medium cache for moderately changing data
  medium: { ttl: 300 }, // 5 minutes

  // Long cache for rarely changing data
  long: { ttl: 3600 }, // 1 hour

  // Very long cache for static data
  static: { ttl: 86400 }, // 24 hours

  // Cars listing with search parameters
  carsList: {
    ttl: 300, // 5 minutes
    keyGenerator: (req: Request) => {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query;
      const filterString = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      return `cars:list:${page || 1}:${limit || 12}:${sortBy || 'createdAt'}:${
        sortOrder || 'desc'
      }:${filterString}`;
    },
  },

  // Individual car details
  carDetails: {
    ttl: 600, // 10 minutes
    keyGenerator: (req: Request) => `car:${req.params.id}`,
  },

  // Dashboard metrics
  dashboardMetrics: {
    ttl: 300, // 5 minutes
    keyGenerator: (req: Request) => {
      const { period, category, condition } = req.query;
      return `dashboard:metrics:${period || 'month'}:${category || 'all'}:${
        condition || 'all'
      }`;
    },
  },

  // Featured cars
  featuredCars: {
    ttl: 600, // 10 minutes
    keyGenerator: () => 'cars:featured',
  },
};
