import { cacheService } from './cache';

export class VehicleCacheService {
  private static instance: VehicleCacheService;

  public static getInstance(): VehicleCacheService {
    if (!VehicleCacheService.instance) {
      VehicleCacheService.instance = new VehicleCacheService();
    }
    return VehicleCacheService.instance;
  }

  /**
   * Cache keys for different vehicle data
   */
  private getCacheKeys() {
    return {
      carsList: (filters: Record<string, unknown>) => {
        const { page, limit, sortBy, sortOrder, ...searchFilters } = filters;
        const filterString = Object.entries(searchFilters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        return `cars:list:${page || 1}:${limit || 12}:${
          sortBy || 'createdAt'
        }:${sortOrder || 'desc'}:${filterString}`;
      },
      carDetails: (id: string) => `car:${id}`,
      dashboardMetrics: (
        period: string,
        category?: string,
        condition?: string
      ) =>
        `dashboard:metrics:${period}:${category || 'all'}:${
          condition || 'all'
        }`,
      featuredCars: () => 'cars:featured',
    };
  }

  /**
   * Get cached car list
   */
  async getCachedCarsList(filters: Record<string, unknown>) {
    const key = this.getCacheKeys().carsList(filters);
    return await cacheService.get(key);
  }

  /**
   * Cache car list
   */
  async setCachedCarsList(
    filters: Record<string, unknown>,
    data: unknown,
    ttl = 300
  ) {
    const key = this.getCacheKeys().carsList(filters);
    return await cacheService.set(key, data, ttl);
  }

  /**
   * Get cached car details
   */
  async getCachedCarDetails(id: string) {
    const key = this.getCacheKeys().carDetails(id);
    return await cacheService.get(key);
  }

  /**
   * Cache car details
   */
  async setCachedCarDetails(id: string, data: unknown, ttl = 600) {
    const key = this.getCacheKeys().carDetails(id);
    return await cacheService.set(key, data, ttl);
  }

  /**
   * Get cached dashboard metrics
   */
  async getCachedDashboardMetrics(
    period: string,
    category?: string,
    condition?: string
  ) {
    const key = this.getCacheKeys().dashboardMetrics(
      period,
      category,
      condition
    );
    return await cacheService.get(key);
  }

  /**
   * Cache dashboard metrics
   */
  async setCachedDashboardMetrics(
    period: string,
    data: unknown,
    category?: string,
    condition?: string,
    ttl = 300
  ) {
    const key = this.getCacheKeys().dashboardMetrics(
      period,
      category,
      condition
    );
    return await cacheService.set(key, data, ttl);
  }

  /**
   * Get cached featured cars
   */
  async getCachedFeaturedCars() {
    const key = this.getCacheKeys().featuredCars();
    return await cacheService.get(key);
  }

  /**
   * Cache featured cars
   */
  async setCachedFeaturedCars(data: unknown, ttl = 600) {
    const key = this.getCacheKeys().featuredCars();
    return await cacheService.set(key, data, ttl);
  }

  /**
   * Invalidate all car-related cache
   */
  async invalidateAllCarCache() {
    await Promise.all([
      cacheService.delPattern('cars:*'),
      cacheService.delPattern('car:*'),
      cacheService.delPattern('dashboard:*'),
    ]);
  }

  /**
   * Invalidate specific car cache
   */
  async invalidateCarCache(id: string) {
    await cacheService.del(this.getCacheKeys().carDetails(id));
  }

  /**
   * Invalidate car list cache (all variations)
   */
  async invalidateCarListCache() {
    await cacheService.delPattern('cars:list:*');
  }

  /**
   * Invalidate dashboard cache
   */
  async invalidateDashboardCache() {
    await cacheService.delPattern('dashboard:*');
  }
}

export const vehicleCacheService = VehicleCacheService.getInstance();
