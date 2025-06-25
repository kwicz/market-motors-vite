import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../../lib/auth';

// Props for the RoleGuard component
interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * RoleGuard component that conditionally renders content based on user roles/permissions
 * Unlike ProtectedRoute, this doesn't redirect but simply shows/hides content
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  requireAuth = true,
}) => {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuthContext();

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (requiredRole && (!user || !hasRole(requiredRole))) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && (!user || !hasPermission(requiredPermission))) {
    return <>{fallback}</>;
  }

  // User has access, render the content
  return <>{children}</>;
};

/**
 * AdminGuard component - shorthand for admin-only content
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <RoleGuard requiredRole={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * SuperAdminGuard component - shorthand for super admin-only content
 */
export const SuperAdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <RoleGuard requiredRole={UserRole.SUPER_ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * PermissionGuard component - shorthand for permission-based content
 */
export const PermissionGuard: React.FC<{
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}> = ({ children, permission, fallback }) => {
  return (
    <RoleGuard requiredPermission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * AuthGuard component - shorthand for authenticated-only content
 */
export const AuthGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <RoleGuard requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * GuestGuard component - shorthand for guest-only content (non-authenticated users)
 */
export const GuestGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <RoleGuard requireAuth={false} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};
