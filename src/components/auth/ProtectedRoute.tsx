import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../../lib/auth';

// Props for the ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallbackPath?: string;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 * Redirects to login or unauthorized page based on user's access level
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login',
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } =
    useAuthContext();
  const location = useLocation();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with the current location as state
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && (!user || !hasRole(requiredRole))) {
    return <Navigate to='/unauthorized' replace />;
  }

  // Check permission-based access
  if (requiredPermission && (!user || !hasPermission(requiredPermission))) {
    return <Navigate to='/unauthorized' replace />;
  }

  // User has access, render the protected content
  return <>{children}</>;
};

/**
 * AdminRoute component - shorthand for admin-only routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>
  );
};

/**
 * SuperAdminRoute component - shorthand for super admin-only routes
 */
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * GuestRoute component - for routes that should only be accessible to non-authenticated users
 * (e.g., login, register pages)
 */
export const GuestRoute: React.FC<{
  children: React.ReactNode;
  redirectPath?: string;
}> = ({ children, redirectPath = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard or specified path
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // User is not authenticated, show the guest content
  return <>{children}</>;
};

/**
 * ConditionalRoute component - renders different content based on authentication status
 */
export const ConditionalRoute: React.FC<{
  authenticatedComponent: React.ReactNode;
  guestComponent: React.ReactNode;
}> = ({ authenticatedComponent, guestComponent }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return <>{isAuthenticated ? authenticatedComponent : guestComponent}</>;
};
