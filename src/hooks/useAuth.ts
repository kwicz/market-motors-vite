import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../lib/auth';

// User type for the frontend
export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  isActive: boolean;
}

// Validation error type
interface ValidationError {
  code: string;
  expected?: string;
  received?: string;
  path: (string | number)[];
  message: string;
}

// Authentication state interface
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration data interface
interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

// Password change data interface
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// API response interfaces
interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  errors?: ValidationError[];
}

interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

// API endpoints
const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  CHANGE_PASSWORD: '/api/auth/change-password',
} as const;

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userString = localStorage.getItem(STORAGE_KEYS.USER);

        if (accessToken && refreshToken && userString) {
          const user = JSON.parse(userString) as User;
          setAuthState({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        clearAuthState();
      }
    };

    loadAuthState();
  }, []);

  // Clear auth state from memory and localStorage
  const clearAuthState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Save auth state to localStorage
  const saveAuthState = useCallback(
    (user: User, accessToken: string, refreshToken: string) => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      setAuthState({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    []
  );

  // Make authenticated API request
  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const { accessToken } = authState;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      // Handle token refresh if needed
      if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          // Retry the request with new token
          return fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authState.accessToken}`,
              ...options.headers,
            },
          });
        } else {
          clearAuthState();
          throw new Error('Authentication failed');
        }
      }

      return response;
    },
    [authState.accessToken]
  );

  // Refresh tokens
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const { refreshToken } = authState;

      if (!refreshToken) {
        return false;
      }

      const response = await fetch(API_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: RefreshResponse = await response.json();

      if (data.success && data.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          data.data;

        // Update tokens in state and localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        setAuthState((prev) => ({
          ...prev,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [authState.refreshToken]);

  // Login function
  const login = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<{
      success: boolean;
      message: string;
      errors?: ValidationError[];
    }> => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(API_ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        const data: AuthResponse = await response.json();

        if (data.success && data.data) {
          const { user, accessToken, refreshToken } = data.data;
          saveAuthState(user, accessToken, refreshToken);
          return { success: true, message: data.message };
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return {
            success: false,
            message: data.message,
            errors: data.errors,
          };
        }
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        console.error('Login error:', error);
        return {
          success: false,
          message: 'Network error. Please try again.',
        };
      }
    },
    [saveAuthState]
  );

  // Register function
  const register = useCallback(
    async (
      registerData: RegisterData
    ): Promise<{
      success: boolean;
      message: string;
      errors?: ValidationError[];
    }> => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(API_ENDPOINTS.REGISTER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
        });

        const data: AuthResponse = await response.json();

        if (data.success && data.data) {
          const { user, accessToken, refreshToken } = data.data;
          saveAuthState(user, accessToken, refreshToken);
          return { success: true, message: data.message };
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return {
            success: false,
            message: data.message,
            errors: data.errors,
          };
        }
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        console.error('Registration error:', error);
        return {
          success: false,
          message: 'Network error. Please try again.',
        };
      }
    },
    [saveAuthState]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session
      if (authState.accessToken) {
        await makeAuthenticatedRequest(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  }, [authState.accessToken, makeAuthenticatedRequest, clearAuthState]);

  // Change password function
  const changePassword = useCallback(
    async (
      passwordData: PasswordChangeData
    ): Promise<{
      success: boolean;
      message: string;
      errors?: ValidationError[];
    }> => {
      try {
        const response = await makeAuthenticatedRequest(
          API_ENDPOINTS.CHANGE_PASSWORD,
          {
            method: 'PUT',
            body: JSON.stringify(passwordData),
          }
        );

        const data = await response.json();

        if (data.success) {
          // Password changed successfully, clear auth state to force re-login
          clearAuthState();
        }

        return {
          success: data.success,
          message: data.message,
          errors: data.errors,
        };
      } catch (error) {
        console.error('Change password error:', error);
        return {
          success: false,
          message: 'Network error. Please try again.',
        };
      }
    },
    [makeAuthenticatedRequest, clearAuthState]
  );

  // Check if user has permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!authState.user) return false;

      // This would typically check against the user's permissions
      // For now, we'll use a simple role-based check
      const { role } = authState.user;

      // Define permissions based on roles (this should match your backend)
      const rolePermissions = {
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
      };

      return rolePermissions[role]?.includes(permission) || false;
    },
    [authState.user]
  );

  // Check if user has role
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!authState.user) return false;

      const roleHierarchy = {
        [UserRole.USER]: 0,
        [UserRole.ADMIN]: 1,
        [UserRole.SUPER_ADMIN]: 2,
      };

      return roleHierarchy[authState.user.role] >= roleHierarchy[role];
    },
    [authState.user]
  );

  return {
    // State
    user: authState.user,
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,

    // Actions
    login,
    register,
    logout,
    changePassword,
    refreshTokens,

    // Utilities
    hasPermission,
    hasRole,
    makeAuthenticatedRequest,
    clearAuthState,
  };
};
