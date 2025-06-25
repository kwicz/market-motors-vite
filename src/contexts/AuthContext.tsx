import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

// Frontend User type (excludes sensitive fields)
interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  isActive: boolean;
}

// Define the context type
interface AuthContextType {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<{
    success: boolean;
    message: string;
    errors?: ValidationError[];
  }>;
  register: (registerData: RegisterData) => Promise<{
    success: boolean;
    message: string;
    errors?: ValidationError[];
  }>;
  logout: () => Promise<void>;
  changePassword: (passwordData: PasswordChangeData) => Promise<{
    success: boolean;
    message: string;
    errors?: ValidationError[];
  }>;
  refreshTokens: () => Promise<boolean>;

  // Utilities
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  makeAuthenticatedRequest: (
    url: string,
    options?: RequestInit
  ) => Promise<Response>;
  clearAuthState: () => void;
}

// Define the types used in the context
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ValidationError {
  code: string;
  expected?: string;
  received?: string;
  path: (string | number)[];
  message: string;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the application with authentication context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access the authentication context
 * @throws Error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

// Export types for use in other components
export type {
  AuthContextType,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  ValidationError,
};
