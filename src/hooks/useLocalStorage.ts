import { useState, useEffect, useCallback } from 'react';
import {
  storage,
  userPreferences,
  searchHistory,
  filterPreferences,
  recentlyViewed,
  favoriteCars,
  comparisonList,
  draftForms,
  cacheManager,
  type UserPreferences,
  type SearchHistory,
  type FilterPreferences,
} from '../utils/localStorage';

/**
 * Generic hook for localStorage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storage.getItem(key, defaultValue);
    return item !== null ? item : defaultValue;
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        storage.setItem(key, valueToStore);
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    userPreferences.get()
  );

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      userPreferences.set(updates);
    },
    [preferences]
  );

  const resetPreferences = useCallback(() => {
    const defaultPrefs = userPreferences.get();
    setPreferences(defaultPrefs);
    userPreferences.reset();
  }, []);

  // Individual preference setters for convenience
  const setTheme = useCallback(
    (theme: UserPreferences['theme']) => {
      updatePreferences({ theme });
    },
    [updatePreferences]
  );

  const setLanguage = useCallback(
    (language: string) => {
      updatePreferences({ language });
    },
    [updatePreferences]
  );

  const setCurrency = useCallback(
    (currency: string) => {
      updatePreferences({ currency });
    },
    [updatePreferences]
  );

  const setViewMode = useCallback(
    (viewMode: UserPreferences['viewMode']) => {
      updatePreferences({ viewMode });
    },
    [updatePreferences]
  );

  const setItemsPerPage = useCallback(
    (itemsPerPage: number) => {
      updatePreferences({ itemsPerPage });
    },
    [updatePreferences]
  );

  const setSidebarCollapsed = useCallback(
    (sidebarCollapsed: boolean) => {
      updatePreferences({ sidebarCollapsed });
    },
    [updatePreferences]
  );

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    setTheme,
    setLanguage,
    setCurrency,
    setViewMode,
    setItemsPerPage,
    setSidebarCollapsed,
  };
}

/**
 * Hook for managing search history
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistory[]>(() =>
    searchHistory.get()
  );

  const addSearch = useCallback((query: string, resultsCount?: number) => {
    if (searchHistory.add(query, resultsCount)) {
      setHistory(searchHistory.get());
    }
  }, []);

  const removeSearch = useCallback((query: string) => {
    if (searchHistory.remove(query)) {
      setHistory(searchHistory.get());
    }
  }, []);

  const clearHistory = useCallback(() => {
    if (searchHistory.clear()) {
      setHistory([]);
    }
  }, []);

  const getRecentSearches = useCallback((limit = 10) => {
    return searchHistory.getRecent(limit);
  }, []);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
    getRecentSearches,
  };
}

/**
 * Hook for managing filter preferences
 */
export function useFilterPreferences() {
  const [filters, setFilters] = useState<FilterPreferences>(() =>
    filterPreferences.get()
  );

  const setDefaultFilters = useCallback(
    (defaultFilters: Record<string, unknown>) => {
      if (filterPreferences.setDefault(defaultFilters)) {
        setFilters(filterPreferences.get());
      }
    },
    []
  );

  const saveFilter = useCallback(
    (name: string, filterData: Record<string, unknown>) => {
      if (filterPreferences.saveFilter(name, filterData)) {
        setFilters(filterPreferences.get());
      }
    },
    []
  );

  const removeFilter = useCallback((name: string) => {
    if (filterPreferences.removeFilter(name)) {
      setFilters(filterPreferences.get());
    }
  }, []);

  const clearFilters = useCallback(() => {
    if (filterPreferences.clear()) {
      setFilters({ defaultFilters: {}, savedFilters: [] });
    }
  }, []);

  return {
    filters,
    setDefaultFilters,
    saveFilter,
    removeFilter,
    clearFilters,
  };
}

/**
 * Hook for managing recently viewed cars
 */
export function useRecentlyViewed() {
  const [recent, setRecent] = useState<string[]>(() => recentlyViewed.get());

  const addRecentlyViewed = useCallback((carId: string) => {
    if (recentlyViewed.add(carId)) {
      setRecent(recentlyViewed.get());
    }
  }, []);

  const removeRecentlyViewed = useCallback((carId: string) => {
    if (recentlyViewed.remove(carId)) {
      setRecent(recentlyViewed.get());
    }
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    if (recentlyViewed.clear()) {
      setRecent([]);
    }
  }, []);

  return {
    recent,
    addRecentlyViewed,
    removeRecentlyViewed,
    clearRecentlyViewed,
  };
}

/**
 * Hook for managing favorite cars
 */
export function useFavoriteCars() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    favoriteCars.get()
  );

  const addFavorite = useCallback((carId: string) => {
    if (favoriteCars.add(carId)) {
      setFavorites(favoriteCars.get());
    }
  }, []);

  const removeFavorite = useCallback((carId: string) => {
    if (favoriteCars.remove(carId)) {
      setFavorites(favoriteCars.get());
    }
  }, []);

  const toggleFavorite = useCallback((carId: string) => {
    if (favoriteCars.toggle(carId)) {
      setFavorites(favoriteCars.get());
    }
  }, []);

  const isFavorite = useCallback((carId: string) => {
    return favoriteCars.isFavorite(carId);
  }, []);

  const clearFavorites = useCallback(() => {
    if (favoriteCars.clear()) {
      setFavorites([]);
    }
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}

/**
 * Hook for managing car comparison list
 */
export function useComparisonList() {
  const [comparison, setComparison] = useState<string[]>(() =>
    comparisonList.get()
  );

  const addToComparison = useCallback((carId: string) => {
    if (comparisonList.add(carId)) {
      setComparison(comparisonList.get());
      return true;
    }
    return false; // List is full or car already exists
  }, []);

  const removeFromComparison = useCallback((carId: string) => {
    if (comparisonList.remove(carId)) {
      setComparison(comparisonList.get());
    }
  }, []);

  const clearComparison = useCallback(() => {
    if (comparisonList.clear()) {
      setComparison([]);
    }
  }, []);

  const isInComparison = useCallback(
    (carId: string) => {
      return comparison.includes(carId);
    },
    [comparison]
  );

  const isFull = useCallback(() => {
    return comparisonList.isFull();
  }, []);

  const isEmpty = useCallback(() => {
    return comparisonList.isEmpty();
  }, []);

  return {
    comparison,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    isFull,
    isEmpty,
    count: comparison.length,
  };
}

/**
 * Hook for managing draft form data
 */
export function useDraftForms() {
  const saveDraftCar = useCallback((data: Record<string, unknown>) => {
    return draftForms.saveCar(data);
  }, []);

  const getDraftCar = useCallback(() => {
    return draftForms.getCar();
  }, []);

  const clearDraftCar = useCallback(() => {
    return draftForms.clearCar();
  }, []);

  const saveDraftFilters = useCallback((filters: Record<string, unknown>) => {
    return draftForms.saveFilters(filters);
  }, []);

  const getDraftFilters = useCallback(() => {
    return draftForms.getFilters();
  }, []);

  const clearDraftFilters = useCallback(() => {
    return draftForms.clearFilters();
  }, []);

  return {
    saveDraftCar,
    getDraftCar,
    clearDraftCar,
    saveDraftFilters,
    getDraftFilters,
    clearDraftFilters,
  };
}

/**
 * Hook for managing cache with automatic expiration
 */
export function useCache() {
  const setCache = useCallback((key: string, data: unknown, ttl?: number) => {
    const success = storage.setItem(key, data);
    if (success) {
      cacheManager.setTimestamp(key);
    }
    return success;
  }, []);

  const getCache = useCallback(<T>(key: string, maxAge?: number): T | null => {
    if (maxAge && cacheManager.isExpired(key, maxAge)) {
      storage.removeItem(key);
      return null;
    }
    return storage.getItem(key);
  }, []);

  const clearExpiredCache = useCallback((maxAge: number) => {
    return cacheManager.clearExpired(maxAge);
  }, []);

  const isCacheExpired = useCallback((key: string, maxAge: number) => {
    return cacheManager.isExpired(key, maxAge);
  }, []);

  return {
    setCache,
    getCache,
    clearExpiredCache,
    isCacheExpired,
  };
}

/**
 * Hook for storage utilities and diagnostics
 */
export function useStorageUtils() {
  const [isAvailable, setIsAvailable] = useState<boolean>(() =>
    storage.isAvailable()
  );

  const checkAvailability = useCallback(() => {
    const available = storage.isAvailable();
    setIsAvailable(available);
    return available;
  }, []);

  const getStorageSize = useCallback(() => {
    return storage.getSize();
  }, []);

  const clearAllStorage = useCallback(() => {
    return storage.clear();
  }, []);

  const exportData = useCallback(() => {
    const backup: Record<string, unknown> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = storage.getItem(key);
          if (value !== null) {
            backup[key] = value;
          }
        }
      }
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  }, []);

  const importData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([key, value]) => {
        storage.setItem(key, value);
      });
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }, []);

  return {
    isAvailable,
    checkAvailability,
    getStorageSize,
    clearAllStorage,
    exportData,
    importData,
  };
}

/**
 * Hook that combines multiple storage features for easy access
 */
export function useStorageManager() {
  const userPrefs = useUserPreferences();
  const searchHist = useSearchHistory();
  const filterPrefs = useFilterPreferences();
  const recentlyViewedCars = useRecentlyViewed();
  const favoriteCarsData = useFavoriteCars();
  const comparisonData = useComparisonList();
  const draftData = useDraftForms();
  const cacheData = useCache();
  const storageUtils = useStorageUtils();

  return {
    userPreferences: userPrefs,
    searchHistory: searchHist,
    filterPreferences: filterPrefs,
    recentlyViewed: recentlyViewedCars,
    favorites: favoriteCarsData,
    comparison: comparisonData,
    drafts: draftData,
    cache: cacheData,
    utils: storageUtils,
  };
}
