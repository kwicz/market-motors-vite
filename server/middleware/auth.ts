import { Request, Response, NextFunction } from 'express';
import {
  AuthUtils,
  JWTPayload,
  UserRole,
  Permission,
  hasHigherOrEqualRole,
} from '../../lib/auth';
import { db } from '../../lib/db';
import { users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user data
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: UserRole;
      username?: string;
      isActive: boolean;
    };
  }
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
        code: 'TOKEN_REQUIRED',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }

    const token = authHeader.substring(7);
    const payload = AuthUtils.verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        username: users.username,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      username: user.username || undefined,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    logger.error(
      'Authentication middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        middleware: 'authenticate',
        path: req.path,
        method: req.method,
        userId: req.user?.id,
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  }
};

/**
 * Authorization middleware factory - checks if user has required permissions
 */
export const authorize = (permissions: Permission | Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const userRole = req.user.role;
    const requiredPermissions = Array.isArray(permissions)
      ? permissions
      : [permissions];

    // Check if user has all required permissions
    const hasPermissions = AuthUtils.hasAllPermissions(
      userRole,
      requiredPermissions
    );

    if (!hasPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        userRole,
      });
    }

    next();
  };
};

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const userRole = req.user.role;

    if (!hasHigherOrEqualRole(userRole, requiredRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}`,
        code: 'INSUFFICIENT_ROLE',
        required: requiredRole,
        userRole,
      });
    }

    next();
  };
};

/**
 * Admin-only middleware (admin or super_admin)
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Super admin-only middleware
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

/**
 * Optional authentication middleware - attaches user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    const payload = AuthUtils.verifyAccessToken(token);

    if (!payload) {
      return next(); // Invalid token, continue without user
    }

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        username: users.username,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        username: user.username || undefined,
        isActive: user.isActive,
      };
    }

    next();
  } catch (error) {
    logger.error(
      'Optional auth middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        middleware: 'optionalAuth',
        path: req.path,
        method: req.method,
      }
    );
    next(); // Continue without user on error
  }
};

/**
 * Middleware to check if user can access their own resources or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is accessing their own resource or is admin/super_admin
    if (
      currentUserId === targetUserId ||
      hasHigherOrEqualRole(userRole, UserRole.ADMIN)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
      code: 'ACCESS_DENIED',
    });
  };
};
