// Export all authentication components
export {
  ProtectedRoute,
  AdminRoute,
  SuperAdminRoute,
  GuestRoute,
  ConditionalRoute,
} from './ProtectedRoute';

export {
  RoleGuard,
  AdminGuard,
  SuperAdminGuard,
  PermissionGuard,
  AuthGuard,
  GuestGuard,
} from './RoleGuard';

// Re-export auth context and hook
export { AuthProvider, useAuthContext } from '../../contexts/AuthContext';
export { useAuth } from '../../hooks/useAuth';

// Re-export types
export type {
  AuthContextType,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  ValidationError,
} from '../../contexts/AuthContext';
