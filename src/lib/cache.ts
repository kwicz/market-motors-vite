import { QueryClient } from '@tanstack/react-query';

// Cache configuration constants
export const CACHE_KEYS = {
  CARS: 'cars',
  CAR_DETAILS: 'car-details',
  SEARCH_RESULTS: 'search-results',
  FILTERS: 'filters',
  USER_PREFERENCES: 'user-preferences',
  FEATURED_CARS: 'featured-cars',
  RECENT_SEARCHES: 'recent-searches',
  POPULAR_CARS: 'popular-cars',
} as const;

export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
} as const;

export const STALE_TIMES = {
  IMMEDIATE: 0,
  SHORT: 1000 * 30, // 30 seconds
  MEDIUM: 1000 * 60 * 2, // 2 minutes
  LONG: 1000 * 60 * 10, // 10 minutes
} as const;

// Cache key generators
export const cacheKeys = {
  cars: {
    all: [CACHE_KEYS.CARS] as const,
    lists: () => [...cacheKeys.cars.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...cacheKeys.cars.lists(), filters] as const,
    details: () => [...cacheKeys.cars.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.cars.details(), id] as const,
    search: (query: string, filters?: Record<string, unknown>) =>
      [CACHE_KEYS.SEARCH_RESULTS, query, filters] as const,
    featured: () => [CACHE_KEYS.FEATURED_CARS] as const,
    popular: () => [CACHE_KEYS.POPULAR_CARS] as const,
  },
  filters: {
    all: [CACHE_KEYS.FILTERS] as const,
    makes: () => [...cacheKeys.filters.all, 'makes'] as const,
    models: (make?: string) =>
      [...cacheKeys.filters.all, 'models', make] as const,
    years: () => [...cacheKeys.filters.all, 'years'] as const,
    priceRanges: () => [...cacheKeys.filters.all, 'price-ranges'] as const,
  },
  user: {
    preferences: (userId: string) =>
      [CACHE_KEYS.USER_PREFERENCES, userId] as const,
    recentSearches: (userId: string) =>
      [CACHE_KEYS.RECENT_SEARCHES, userId] as const,
  },
} as const;

// Cache invalidation strategies
export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  // Invalidate all car-related queries
  async invalidateCarQueries() {
    await this.queryClient.invalidateQueries({
      queryKey: cacheKeys.cars.all,
    });
  }

  // Invalidate specific car detail
  async invalidateCarDetail(carId: string) {
    await this.queryClient.invalidateQueries({
      queryKey: cacheKeys.cars.detail(carId),
    });
  }

  // Invalidate car lists with optional filter matching
  async invalidateCarLists(filters?: Record<string, unknown>) {
    if (filters) {
      await this.queryClient.invalidateQueries({
        queryKey: cacheKeys.cars.list(filters),
      });
    } else {
      await this.queryClient.invalidateQueries({
        queryKey: cacheKeys.cars.lists(),
      });
    }
  }

  // Invalidate search results
  async invalidateSearchResults(query?: string) {
    if (query) {
      await this.queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.SEARCH_RESULTS, query],
      });
    } else {
      await this.queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.SEARCH_RESULTS],
      });
    }
  }

  // Remove specific queries from cache
  removeCarFromCache(carId: string) {
    this.queryClient.removeQueries({
      queryKey: cacheKeys.cars.detail(carId),
    });
  }

  // Update car in cache
  updateCarInCache(carId: string, updatedCar: Record<string, unknown>) {
    this.queryClient.setQueryData(cacheKeys.cars.detail(carId), updatedCar);

    // Also update any lists that might contain this car
    this.queryClient.setQueriesData(
      { queryKey: cacheKeys.cars.lists() },
      (oldData: unknown) => {
        if (Array.isArray(oldData)) {
          return oldData.map((car: Record<string, unknown>) =>
            car.id === carId ? { ...car, ...updatedCar } : car
          );
        }
        return oldData;
      }
    );
  }

  // Prefetch car details
  async prefetchCarDetail(carId: string, fetcher: () => Promise<unknown>) {
    await this.queryClient.prefetchQuery({
      queryKey: cacheKeys.cars.detail(carId),
      queryFn: fetcher,
      staleTime: STALE_TIMES.MEDIUM,
    });
  }

  // Prefetch related cars
  async prefetchRelatedCars(
    filters: Record<string, unknown>,
    fetcher: () => Promise<unknown>
  ) {
    await this.queryClient.prefetchQuery({
      queryKey: cacheKeys.cars.list(filters),
      queryFn: fetcher,
      staleTime: STALE_TIMES.SHORT,
    });
  }

  // Cache warming strategies
  async warmCache() {
    // Prefetch featured cars
    await this.queryClient.prefetchQuery({
      queryKey: cacheKeys.cars.featured(),
      queryFn: () => this.fetchFeaturedCars(),
      staleTime: STALE_TIMES.LONG,
    });

    // Prefetch popular cars
    await this.queryClient.prefetchQuery({
      queryKey: cacheKeys.cars.popular(),
      queryFn: () => this.fetchPopularCars(),
      staleTime: STALE_TIMES.LONG,
    });

    // Prefetch filter options
    await this.queryClient.prefetchQuery({
      queryKey: cacheKeys.filters.makes(),
      queryFn: () => this.fetchMakes(),
      staleTime: STALE_TIMES.LONG,
    });
  }

  // Background cache refresh
  async refreshCacheInBackground() {
    // Refresh featured cars in background
    this.queryClient.refetchQueries({
      queryKey: cacheKeys.cars.featured(),
      type: 'active',
    });

    // Refresh popular cars in background
    this.queryClient.refetchQueries({
      queryKey: cacheKeys.cars.popular(),
      type: 'active',
    });
  }

  // Cache cleanup strategies
  clearStaleCache() {
    // Remove queries older than 24 hours
    this.queryClient.removeQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt;
        const oneDayAgo = Date.now() - CACHE_TIMES.VERY_LONG;
        return lastUpdated < oneDayAgo;
      },
    });
  }

  // Clear all cache
  clearAllCache() {
    this.queryClient.clear();
  }

  // Cache size management
  limitCacheSize(maxQueries = 100) {
    const queries = this.queryClient.getQueryCache().getAll();
    if (queries.length > maxQueries) {
      // Remove oldest queries
      const sortedQueries = queries
        .sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt)
        .slice(0, queries.length - maxQueries);

      sortedQueries.forEach((query) => {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      });
    }
  }

  // Private methods for fetching data
  private async fetchFeaturedCars() {
    // This would be replaced with actual API call
    return [];
  }

  private async fetchPopularCars() {
    // This would be replaced with actual API call
    return [];
  }

  private async fetchMakes() {
    // This would be replaced with actual API call
    return [];
  }
}

// Memory cache for client-side data
export class MemoryCache<T> {
  private cache = new Map<
    string,
    { data: T; timestamp: number; ttl: number }
  >();

  set(key: string, data: T, ttl = CACHE_TIMES.MEDIUM) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// LRU Cache implementation
export class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache utilities
export const cacheUtils = {
  // Generate cache key from object
  generateKey: (prefix: string, params: Record<string, unknown>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    return `${prefix}-${JSON.stringify(sortedParams)}`;
  },

  // Check if data should be refetched
  shouldRefetch: (lastFetch: number, staleTime: number): boolean => {
    return Date.now() - lastFetch > staleTime;
  },

  // Create cache configuration for different data types
  createCacheConfig: (type: 'static' | 'dynamic' | 'user-specific') => {
    switch (type) {
      case 'static':
        return {
          staleTime: STALE_TIMES.LONG,
          cacheTime: CACHE_TIMES.VERY_LONG,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
        };
      case 'dynamic':
        return {
          staleTime: STALE_TIMES.SHORT,
          cacheTime: CACHE_TIMES.MEDIUM,
          refetchOnWindowFocus: true,
          refetchOnMount: true,
        };
      case 'user-specific':
        return {
          staleTime: STALE_TIMES.MEDIUM,
          cacheTime: CACHE_TIMES.LONG,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
        };
      default:
        return {
          staleTime: STALE_TIMES.SHORT,
          cacheTime: CACHE_TIMES.MEDIUM,
        };
    }
  },
};

// Global cache instances
export const memoryCache = new MemoryCache();
export const lruCache = new LRUCache(100);

// Cache provider for React context
export const createCacheManager = (queryClient: QueryClient) => {
  return new CacheManager(queryClient);
};
