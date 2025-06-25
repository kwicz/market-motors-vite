import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './db/schema';

// User roles enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Permissions for each role
export const PERMISSIONS = {
  [UserRole.USER]: ['view_cars', 'view_car_details'],
  [UserRole.ADMIN]: [
    'view_cars',
    'view_car_details',
    'create_car',
    'update_car',
    'delete_car',
    'manage_inventory',
    'view_admin_dashboard',
  ],
  [UserRole.SUPER_ADMIN]: [
    'view_cars',
    'view_car_details',
    'create_car',
    'update_car',
    'delete_car',
    'manage_inventory',
    'view_admin_dashboard',
    'create_user',
    'update_user',
    'delete_user',
    'manage_users',
    'manage_roles',
    'view_system_settings',
  ],
} as const;

export type Permission = (typeof PERMISSIONS)[
  | UserRole.USER
  | UserRole.ADMIN
  | UserRole.SUPER_ADMIN][number];

// JWT token payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Authentication utilities
export class AuthUtils {
  private static getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return secret;
  }

  private static getJWTRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables'
      );
    }
    return secret;
  }

  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  private static readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate access token
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.getJWTSecret(), {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  // Generate refresh token
  static generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(payload, this.getJWTRefreshSecret(), {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.getJWTSecret()) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(
        token,
        this.getJWTRefreshSecret()
      ) as RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Check if user has permission
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    return (PERMISSIONS[userRole] as readonly string[]).includes(permission);
  }

  // Check if user has any of the specified permissions
  static hasAnyPermission(
    userRole: UserRole,
    permissions: Permission[]
  ): boolean {
    return permissions.some((permission) =>
      this.hasPermission(userRole, permission)
    );
  }

  // Check if user has all specified permissions
  static hasAllPermissions(
    userRole: UserRole,
    permissions: Permission[]
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(userRole, permission)
    );
  }

  // Get user permissions
  static getUserPermissions(userRole: UserRole): Permission[] {
    return [...PERMISSIONS[userRole]] as Permission[];
  }

  // Calculate token expiration date
  static getTokenExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid time unit');
    }
  }
}

// Role hierarchy helper
export const ROLE_HIERARCHY = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
} as const;

export function hasHigherOrEqualRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
