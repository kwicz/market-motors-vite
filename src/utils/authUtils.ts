import { UserRole } from '../../lib/auth';

// Frontend User type (excludes sensitive fields)
export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  isActive: boolean;
}

// Role hierarchy for client-side checks
export const ROLE_HIERARCHY = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
} as const;

// Permissions mapping for client-side checks
export const CLIENT_PERMISSIONS = {
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

/**
 * Check if user has a specific role or higher
 */
export const hasRole = (user: User | null, requiredRole: UserRole): boolean => {
  if (!user) return false;

  const userRoleLevel = ROLE_HIERARCHY[user.role as UserRole];
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  user: User | null,
  permission: string
): boolean => {
  if (!user) return false;

  const userPermissions = CLIENT_PERMISSIONS[user.role as UserRole] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: User | null,
  permissions: string[]
): boolean => {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = (
  user: User | null,
  permissions: string[]
): boolean => {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
};

/**
 * Get all permissions for a user's role
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user) return [];

  return [...(CLIENT_PERMISSIONS[user.role as UserRole] || [])];
};

/**
 * Check if user is active and authenticated
 */
export const isUserActive = (user: User | null): boolean => {
  return user?.isActive === true;
};

/**
 * Check if user is admin or higher
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, UserRole.ADMIN);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === UserRole.SUPER_ADMIN;
};

/**
 * Check if user is regular user (not admin)
 */
export const isRegularUser = (user: User | null): boolean => {
  return user?.role === UserRole.USER;
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    [UserRole.USER]: 'User',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
  };

  return roleNames[role] || 'Unknown';
};

/**
 * Format user display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';

  return user.username || user.email.split('@')[0] || 'User';
};

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdmin(user) && isUserActive(user);
};

/**
 * Check if user can manage other users
 */
export const canManageUsers = (user: User | null): boolean => {
  return isSuperAdmin(user) && isUserActive(user);
};

/**
 * Check if user can manage inventory
 */
export const canManageInventory = (user: User | null): boolean => {
  return hasPermission(user, 'manage_inventory') && isUserActive(user);
};

/**
 * Validate JWT token format (basic client-side check)
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token) return false;

  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Extract user ID from JWT token (without verification)
 * Note: This is for client-side convenience only, never trust this for security
 */
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    if (!isValidJWTFormat(token)) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired (client-side check only)
 * Note: This is for UX purposes only, server-side validation is authoritative
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    if (!isValidJWTFormat(token)) return true;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    return payload.exp < currentTime;
  } catch {
    return true;
  }
};
