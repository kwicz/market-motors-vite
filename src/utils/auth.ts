import { UserRole } from '../types/auth';

// User interface that matches AuthContext expectations
interface AuthUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean;
}

// Mock users for demonstration
const MOCK_USERS: AuthUser[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@marketmotors.com',
    role: UserRole.SUPER_ADMIN,
    isSuperAdmin: true,
  },
  {
    id: '2',
    username: 'manager',
    password: 'manager123',
    name: 'Manager User',
    email: 'manager@marketmotors.com',
    role: UserRole.ADMIN,
    isSuperAdmin: false,
  },
];

// Session storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

/**
 * Authenticate a user with email/username and password
 */
export const authenticate = (
  emailOrUsername: string,
  password: string
): AuthUser | null => {
  const user = MOCK_USERS.find(
    (u) =>
      (u.email === emailOrUsername || u.username === emailOrUsername) &&
      u.password === password
  );

  return user || null;
};

/**
 * Log in a user and save their session
 */
export const login = (user: AuthUser): void => {
  // In a real app, we would get a token from the server
  const fakeToken = btoa(
    JSON.stringify({ userId: user.id, timestamp: Date.now() })
  );

  // Save auth token and user info to session storage
  sessionStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Log out the current user
 * Clears both session storage and localStorage
 */
export const logout = (): Promise<void> => {
  return new Promise((resolve) => {
    // Clear session storage
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    // Clear localStorage
    localStorage.removeItem('adminLoggedIn');

    // Small delay to simulate async operation
    setTimeout(() => {
      resolve();
    }, 300);
  });
};

/**
 * Check if a user is currently logged in
 */
export const isLoggedIn = (): boolean => {
  return !!sessionStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = (): AuthUser | null => {
  const userJson = sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as AuthUser;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if the current user is a super admin
 */
export const isSuperAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user?.isSuperAdmin;
};

/**
 * Check if the current user is an admin
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user && user.role === UserRole.ADMIN;
};

/**
 * Get user roles
 */
export const getUserRoles = () => {
  const user = getCurrentUser();
  return {
    isLoggedIn: !!user,
    isAdmin: !!user && user.role === UserRole.ADMIN,
    isSuperAdmin: !!user?.isSuperAdmin,
  };
};

/**
 * Update admin status of a user
 */
export const updateAdminStatus = (
  userId: string,
  isSuperAdmin: boolean
): boolean => {
  // In a real app, this would update the database
  // For now, we'll just simulate success
  return true;
};

/**
 * Get all admin users
 */
export const getAdminUsers = (): AuthUser[] => {
  // In a real app, this would fetch from a database
  return MOCK_USERS.filter((user) => user.role === UserRole.ADMIN);
};

// Admin authentication functions (for demo purposes only)
export const loginAdmin = (
  username: string,
  password: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Simple mock admin check - in a real app, this would be a server-side check
    setTimeout(() => {
      const isAdmin = username === 'admin' && password === 'password';
      if (isAdmin) {
        localStorage.setItem('adminLoggedIn', 'true');
      }
      resolve(isAdmin);
    }, 500);
  });
};

export const isAdminLoggedIn = (): boolean => {
  return localStorage.getItem('adminLoggedIn') === 'true';
};
