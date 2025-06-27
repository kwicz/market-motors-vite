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

// Role hierarchy helper
export const ROLE_HIERARCHY = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
} as const;

// Check if user has higher or equal role
export function hasHigherOrEqualRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Validate if a string is a valid UserRole
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
