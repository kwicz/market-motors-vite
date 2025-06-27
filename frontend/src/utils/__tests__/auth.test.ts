import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  authenticate,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
} from '../auth';
import { UserRole } from '../../types/auth';

// Mock sessionStorage (auth.ts uses sessionStorage, not localStorage)
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('authenticate', () => {
    it('should authenticate valid admin credentials', () => {
      const user = authenticate('admin', 'admin123');

      expect(user).toBeTruthy();
      expect(user?.username).toBe('admin');
      expect(user?.role).toBe(UserRole.SUPER_ADMIN); // admin user is actually SUPER_ADMIN
    });

    it('should authenticate valid manager credentials', () => {
      const user = authenticate('manager', 'manager123');

      expect(user).toBeTruthy();
      expect(user?.username).toBe('manager');
      expect(user?.role).toBe(UserRole.ADMIN);
    });

    it('should authenticate with email instead of username', () => {
      const user = authenticate('admin@marketmotors.com', 'admin123');

      expect(user).toBeTruthy();
      expect(user?.email).toBe('admin@marketmotors.com');
      expect(user?.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should return null for invalid credentials', () => {
      const user = authenticate('invalid', 'wrongpassword');

      expect(user).toBeNull();
    });

    it('should return null for empty credentials', () => {
      expect(authenticate('', '')).toBeNull();
      expect(authenticate('admin', '')).toBeNull();
      expect(authenticate('', 'password')).toBeNull();
    });
  });

  describe('login', () => {
    it('should store user data in sessionStorage on login', () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@marketmotors.com',
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.SUPER_ADMIN,
        isSuperAdmin: true,
      };

      login(mockUser);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        expect.any(String)
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockUser)
      );
    });
  });

  describe('logout', () => {
    it('should remove user data from sessionStorage and localStorage on logout', async () => {
      await logout();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminLoggedIn');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from sessionStorage', () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@marketmotors.com',
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.SUPER_ADMIN,
        isSuperAdmin: true,
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const user = getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null when no user is stored', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const user = getCurrentUser();

      expect(user).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const user = getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when auth token exists', () => {
      mockSessionStorage.getItem.mockReturnValue('fake_token');

      expect(isLoggedIn()).toBe(true);
    });

    it('should return false when no auth token exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      expect(isLoggedIn()).toBe(false);
    });
  });
});
