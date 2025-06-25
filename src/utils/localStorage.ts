/**
 * Local storage utilities for user preferences and data persistence
 */

// Storage keys
export const STORAGE_KEYS = {
  // User preferences
  THEME: 'user_theme',
  LANGUAGE: 'user_language',
  CURRENCY: 'user_currency',

  // Search and filter preferences
  SEARCH_HISTORY: 'search_history',
  FILTER_PREFERENCES: 'filter_preferences',
  SORT_PREFERENCES: 'sort_preferences',

  // UI preferences
  VIEW_MODE: 'view_mode', // grid, list
  ITEMS_PER_PAGE: 'items_per_page',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',

  // Car browsing preferences
  FAVORITE_CARS: 'favorite_cars',
  RECENTLY_VIEWED: 'recently_viewed_cars',
  COMPARISON_LIST: 'comparison_list',

  // Form data (temporary storage)
  DRAFT_CAR_FORM: 'draft_car_form',
  DRAFT_SEARCH_FILTERS: 'draft_search_filters',

  // Cache timestamps
  CACHE_TIMESTAMPS: 'cache_timestamps',
} as const;

// Type definitions
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  viewMode: 'grid' | 'list';
  itemsPerPage: number;
  sidebarCollapsed: boolean;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultsCount?: number;
}

export interface FilterPreferences {
  defaultFilters: Record<string, unknown>;
  savedFilters: Array<{
    name: string;
    filters: Record<string, unknown>;
    timestamp: Date;
  }>;
}

export interface SortPreferences {
  defaultSort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Generic storage functions
export const storage = {
  /**
   * Get item from localStorage with error handling
   */
  getItem: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue || null;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  setItem: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get storage size in bytes
   */
  getSize: (): number => {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },
};

// User preferences utilities
export const userPreferences = {
  get: (): UserPreferences => {
    return storage.getItem(STORAGE_KEYS.THEME, {
      theme: 'system',
      language: 'en',
      currency: 'USD',
      viewMode: 'grid',
      itemsPerPage: 12,
      sidebarCollapsed: false,
    }) as UserPreferences;
  },

  set: (preferences: Partial<UserPreferences>): boolean => {
    const current = userPreferences.get();
    return storage.setItem(STORAGE_KEYS.THEME, { ...current, ...preferences });
  },

  reset: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.THEME);
  },
};

// Search history utilities
export const searchHistory = {
  get: (): SearchHistory[] => {
    return storage.getItem(STORAGE_KEYS.SEARCH_HISTORY, []) as SearchHistory[];
  },

  add: (query: string, resultsCount?: number): boolean => {
    const history = searchHistory.get();
    const newEntry: SearchHistory = {
      query: query.trim(),
      timestamp: new Date(),
      resultsCount,
    };

    // Remove duplicates and add to beginning
    const filtered = history.filter((item) => item.query !== newEntry.query);
    const updated = [newEntry, ...filtered].slice(0, 50); // Keep only last 50 searches

    return storage.setItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
  },

  remove: (query: string): boolean => {
    const history = searchHistory.get();
    const filtered = history.filter((item) => item.query !== query);
    return storage.setItem(STORAGE_KEYS.SEARCH_HISTORY, filtered);
  },

  clear: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  getRecent: (limit = 10): SearchHistory[] => {
    return searchHistory.get().slice(0, limit);
  },
};

// Filter preferences utilities
export const filterPreferences = {
  get: (): FilterPreferences => {
    return storage.getItem(STORAGE_KEYS.FILTER_PREFERENCES, {
      defaultFilters: {},
      savedFilters: [],
    }) as FilterPreferences;
  },

  setDefault: (filters: Record<string, unknown>): boolean => {
    const current = filterPreferences.get();
    return storage.setItem(STORAGE_KEYS.FILTER_PREFERENCES, {
      ...current,
      defaultFilters: filters,
    });
  },

  saveFilter: (name: string, filters: Record<string, unknown>): boolean => {
    const current = filterPreferences.get();
    const existing = current.savedFilters.findIndex((f) => f.name === name);

    const newFilter = {
      name,
      filters,
      timestamp: new Date(),
    };

    if (existing >= 0) {
      current.savedFilters[existing] = newFilter;
    } else {
      current.savedFilters.push(newFilter);
    }

    return storage.setItem(STORAGE_KEYS.FILTER_PREFERENCES, current);
  },

  removeFilter: (name: string): boolean => {
    const current = filterPreferences.get();
    current.savedFilters = current.savedFilters.filter((f) => f.name !== name);
    return storage.setItem(STORAGE_KEYS.FILTER_PREFERENCES, current);
  },

  clear: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.FILTER_PREFERENCES);
  },
};

// Recently viewed cars utilities
export const recentlyViewed = {
  get: (): string[] => {
    return storage.getItem(STORAGE_KEYS.RECENTLY_VIEWED, []) as string[];
  },

  add: (carId: string): boolean => {
    const recent = recentlyViewed.get();
    const filtered = recent.filter((id) => id !== carId);
    const updated = [carId, ...filtered].slice(0, 20); // Keep only last 20 viewed cars
    return storage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, updated);
  },

  remove: (carId: string): boolean => {
    const recent = recentlyViewed.get();
    const filtered = recent.filter((id) => id !== carId);
    return storage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, filtered);
  },

  clear: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED);
  },
};

// Favorite cars utilities
export const favoriteCars = {
  get: (): string[] => {
    return storage.getItem(STORAGE_KEYS.FAVORITE_CARS, []) as string[];
  },

  add: (carId: string): boolean => {
    const favorites = favoriteCars.get();
    if (!favorites.includes(carId)) {
      favorites.push(carId);
      return storage.setItem(STORAGE_KEYS.FAVORITE_CARS, favorites);
    }
    return true;
  },

  remove: (carId: string): boolean => {
    const favorites = favoriteCars.get();
    const filtered = favorites.filter((id) => id !== carId);
    return storage.setItem(STORAGE_KEYS.FAVORITE_CARS, filtered);
  },

  toggle: (carId: string): boolean => {
    const favorites = favoriteCars.get();
    if (favorites.includes(carId)) {
      return favoriteCars.remove(carId);
    } else {
      return favoriteCars.add(carId);
    }
  },

  isFavorite: (carId: string): boolean => {
    return favoriteCars.get().includes(carId);
  },

  clear: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.FAVORITE_CARS);
  },
};

// Car comparison utilities
export const comparisonList = {
  get: (): string[] => {
    return storage.getItem(STORAGE_KEYS.COMPARISON_LIST, []) as string[];
  },

  add: (carId: string): boolean => {
    const comparison = comparisonList.get();
    if (!comparison.includes(carId) && comparison.length < 4) {
      // Limit to 4 cars
      comparison.push(carId);
      return storage.setItem(STORAGE_KEYS.COMPARISON_LIST, comparison);
    }
    return false;
  },

  remove: (carId: string): boolean => {
    const comparison = comparisonList.get();
    const filtered = comparison.filter((id) => id !== carId);
    return storage.setItem(STORAGE_KEYS.COMPARISON_LIST, filtered);
  },

  clear: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.COMPARISON_LIST);
  },

  isFull: (): boolean => {
    return comparisonList.get().length >= 4;
  },

  isEmpty: (): boolean => {
    return comparisonList.get().length === 0;
  },
};

// Draft form data utilities
export const draftForms = {
  saveCar: (data: Record<string, unknown>): boolean => {
    return storage.setItem(STORAGE_KEYS.DRAFT_CAR_FORM, {
      data,
      timestamp: new Date(),
    });
  },

  getCar: (): { data: Record<string, unknown>; timestamp: Date } | null => {
    return storage.getItem(STORAGE_KEYS.DRAFT_CAR_FORM);
  },

  clearCar: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.DRAFT_CAR_FORM);
  },

  saveFilters: (filters: Record<string, unknown>): boolean => {
    return storage.setItem(STORAGE_KEYS.DRAFT_SEARCH_FILTERS, {
      filters,
      timestamp: new Date(),
    });
  },

  getFilters: (): {
    filters: Record<string, unknown>;
    timestamp: Date;
  } | null => {
    return storage.getItem(STORAGE_KEYS.DRAFT_SEARCH_FILTERS);
  },

  clearFilters: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.DRAFT_SEARCH_FILTERS);
  },
};

// Cache management utilities
export const cacheManager = {
  setTimestamp: (key: string): boolean => {
    const timestamps = storage.getItem(
      STORAGE_KEYS.CACHE_TIMESTAMPS,
      {}
    ) as Record<string, string>;
    timestamps[key] = new Date().toISOString();
    return storage.setItem(STORAGE_KEYS.CACHE_TIMESTAMPS, timestamps);
  },

  getTimestamp: (key: string): Date | null => {
    const timestamps = storage.getItem(
      STORAGE_KEYS.CACHE_TIMESTAMPS,
      {}
    ) as Record<string, string>;
    const timestamp = timestamps[key];
    return timestamp ? new Date(timestamp) : null;
  },

  isExpired: (key: string, maxAge: number): boolean => {
    const timestamp = cacheManager.getTimestamp(key);
    if (!timestamp) return true;
    return Date.now() - timestamp.getTime() > maxAge;
  },

  clearExpired: (maxAge: number): boolean => {
    const timestamps = storage.getItem(
      STORAGE_KEYS.CACHE_TIMESTAMPS,
      {}
    ) as Record<string, string>;
    const now = Date.now();

    Object.keys(timestamps).forEach((key) => {
      const timestamp = new Date(timestamps[key]);
      if (now - timestamp.getTime() > maxAge) {
        delete timestamps[key];
        storage.removeItem(key);
      }
    });

    return storage.setItem(STORAGE_KEYS.CACHE_TIMESTAMPS, timestamps);
  },
};

// Utility to migrate old storage format to new format
export const migrationUtils = {
  migrateOldData: (): boolean => {
    try {
      // Add migration logic here when needed
      console.log('Storage migration completed');
      return true;
    } catch (error) {
      console.error('Storage migration failed:', error);
      return false;
    }
  },

  backup: (): string | null => {
    try {
      const backup: Record<string, unknown> = {};
      Object.values(STORAGE_KEYS).forEach((key) => {
        const value = storage.getItem(key);
        if (value !== null) {
          backup[key] = value;
        }
      });
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Backup failed:', error);
      return null;
    }
  },

  restore: (backupData: string): boolean => {
    try {
      const data = JSON.parse(backupData);
      Object.entries(data).forEach(([key, value]) => {
        storage.setItem(key, value);
      });
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  },
};
