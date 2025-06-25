import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debounced callbacks
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, ...deps]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Custom hook for debounced search functionality
 * @param initialQuery - Initial search query
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with search query, debounced query, and setter function
 */
export const useDebouncedSearch = (initialQuery = '', delay = 300) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, delay);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    clearSearch,
    isSearching: searchQuery !== debouncedQuery,
  };
};

/**
 * Custom hook for debounced filters
 * @param initialFilters - Initial filter values
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Object with filters, debounced filters, and management functions
 */
export const useDebouncedFilters = <T extends Record<string, unknown>>(
  initialFilters: T,
  delay = 500
) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const debouncedFilters = useDebounce(filters, delay);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    debouncedFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    isFiltering: JSON.stringify(filters) !== JSON.stringify(debouncedFilters),
  };
};
