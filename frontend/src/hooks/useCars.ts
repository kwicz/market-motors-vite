import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiResponse, PaginatedResponse } from '../lib/api';
import { Car, NewCar } from '../../lib/db/schema';
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  cacheKeys,
  cacheUtils,
  createCacheManager,
  STALE_TIMES,
} from '../lib/cache';
import type { CarFilters, CreateCarData, UpdateCarData } from '../types/car';

// Query keys for consistent cache management
export const carQueryKeys = {
  all: ['cars'] as const,
  lists: () => [...carQueryKeys.all, 'list'] as const,
  list: (filters?: CarFilters) =>
    [...carQueryKeys.lists(), { filters }] as const,
  details: () => [...carQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...carQueryKeys.details(), id] as const,
  featured: () => [...carQueryKeys.all, 'featured'] as const,
  search: (query: string) => [...carQueryKeys.all, 'search', query] as const,
};

// Filter and search interfaces
export interface CarFilters {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  category?: string;
  isFeatured?: boolean;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CarSearchParams {
  query: string;
  filters?: Omit<CarFilters, 'page' | 'limit'>;
  page?: number;
  limit?: number;
}

// Bulk operation interfaces
export interface BulkOperationData {
  carIds: string[];
  operation:
    | 'delete'
    | 'feature'
    | 'unfeature'
    | 'stock'
    | 'unstock'
    | 'update';
  updateData?: Partial<
    Pick<
      Car,
      | 'category'
      | 'condition'
      | 'fuelType'
      | 'transmission'
      | 'color'
      | 'isFeatured'
      | 'inStock'
    >
  >;
}

export interface BulkOperationResult {
  operation: string;
  affectedCount: number;
  affectedCars: Array<{ id: string; [key: string]: unknown }>;
  updateData?: Record<string, unknown>;
}

// Hook for fetching all cars with filters
export const useCars = (
  filters?: CarFilters
): UseQueryResult<PaginatedResponse<Car>, Error> & {
  isInitialLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
} => {
  const query = useQuery({
    queryKey: carQueryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get<PaginatedResponse<Car>>(
        `/api/cars?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch cars');
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error.message.includes('40')) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
    isEmpty:
      !query.isLoading && (!query.data?.data || query.data.data.length === 0),
  };
};

// Hook for fetching a single car
export const useCar = (
  id: string
): UseQueryResult<Car, Error> & {
  isInitialLoading: boolean;
  isRefetching: boolean;
} => {
  const query = useQuery({
    queryKey: carQueryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Car>(`/api/cars/${id}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch car');
      }

      return response.data!;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 or other 4xx errors
      if (error.message.includes('40')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
  };
};

// Hook for fetching featured cars
export const useFeaturedCars = (): UseQueryResult<Car[], Error> & {
  isInitialLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
} => {
  const query = useQuery({
    queryKey: carQueryKeys.featured(),
    queryFn: async () => {
      const response = await api.get<Car[]>('/api/cars/featured');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured cars');
      }

      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('40')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
    isEmpty: !query.isLoading && (!query.data || query.data.length === 0),
  };
};

// Hook for searching cars
export const useCarSearch = (
  searchParams: CarSearchParams
): UseQueryResult<PaginatedResponse<Car>, Error> & {
  isInitialLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
  isSearching: boolean;
} => {
  const query = useQuery({
    queryKey: carQueryKeys.search(searchParams.query),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('q', searchParams.query);

      if (searchParams.filters) {
        Object.entries(searchParams.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      if (searchParams.page) {
        params.append('page', searchParams.page.toString());
      }

      if (searchParams.limit) {
        params.append('limit', searchParams.limit.toString());
      }

      const response = await api.get<PaginatedResponse<Car>>(
        `/api/cars/search?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to search cars');
      }

      return response.data!;
    },
    enabled: !!searchParams.query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('40')) return false;
      return failureCount < 2; // Fewer retries for search
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
  });

  return {
    ...query,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
    isEmpty:
      !query.isLoading && (!query.data?.data || query.data.data.length === 0),
    isSearching: query.isFetching,
  };
};

// Hook for creating a new car
export const useCreateCar = (): UseMutationResult<Car, Error, NewCar> & {
  isCreating: boolean;
} => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newCar: NewCar) => {
      const response = await api.post<Car>('/api/cars', newCar);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create car');
      }

      return response.data!;
    },
    // Optimistic update - immediately add to UI
    onMutate: async (newCar) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: carQueryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: carQueryKeys.featured() });

      // Create optimistic car with temporary ID
      const optimisticCar: Car = {
        id: `temp_${Date.now()}`,
        ...newCar,
        isFeatured: newCar.isFeatured ?? false,
        inStock: newCar.inStock ?? true,
        features: newCar.features ?? [],
        images: newCar.images ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null, // Will be set by server
      };

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData<PaginatedResponse<Car>>({
        queryKey: carQueryKeys.lists(),
      });
      const previousFeatured = queryClient.getQueryData<Car[]>(
        carQueryKeys.featured()
      );

      // Add to lists optimistically
      queryClient.setQueriesData<PaginatedResponse<Car>>(
        { queryKey: carQueryKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [optimisticCar, ...old.data],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        }
      );

      // Add to featured if applicable
      if (newCar.isFeatured) {
        queryClient.setQueriesData<Car[]>(
          { queryKey: carQueryKeys.featured() },
          (old) => {
            return old ? [optimisticCar, ...old] : [optimisticCar];
          }
        );
      }

      return { optimisticCar, previousLists, previousFeatured };
    },
    onSuccess: (data, newCar, context) => {
      // Replace optimistic car with real data
      if (context?.optimisticCar) {
        // Update lists with real car data
        queryClient.setQueriesData<PaginatedResponse<Car>>(
          { queryKey: carQueryKeys.lists() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((car) =>
                car.id === context.optimisticCar.id ? data : car
              ),
            };
          }
        );

        // Update featured cars with real data
        if (data.isFeatured) {
          queryClient.setQueriesData<Car[]>(
            { queryKey: carQueryKeys.featured() },
            (old) => {
              if (!old) return old;
              return old.map((car) =>
                car.id === context.optimisticCar.id ? data : car
              );
            }
          );
        }
      }

      // Set the individual car data
      queryClient.setQueryData(carQueryKeys.detail(data.id), data);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: carQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carQueryKeys.featured() });

      toast.success('Car created successfully');
    },
    onError: (error, newCar, context) => {
      // Revert optimistic updates on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousFeatured) {
        queryClient.setQueryData(
          carQueryKeys.featured(),
          context.previousFeatured
        );
      }

      // Enhanced error handling
      const errorMessage = error.message || 'Failed to create car';
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Car creation failed:', {
        error,
        newCar,
        timestamp: new Date().toISOString(),
      });
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors (4xx)
      if (error.message.includes('40')) return false;
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return {
    ...mutation,
    isCreating: mutation.isPending,
  };
};

// Hook for updating a car
export const useUpdateCar = (): UseMutationResult<
  Car,
  Error,
  { id: string; data: Partial<NewCar> }
> & {
  isUpdating: boolean;
} => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<Car>(`/api/cars/${id}`, data);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update car');
      }

      return response.data!;
    },
    // Optimistic update - immediately update UI before server responds
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: carQueryKeys.detail(id) });

      // Snapshot the previous value
      const previousCar = queryClient.getQueryData<Car>(
        carQueryKeys.detail(id)
      );

      // Optimistically update to the new value
      if (previousCar) {
        queryClient.setQueryData<Car>(carQueryKeys.detail(id), {
          ...previousCar,
          ...data,
          updatedAt: new Date(),
        });

        // Also update any lists that might contain this car
        queryClient.setQueriesData<PaginatedResponse<Car>>(
          { queryKey: carQueryKeys.lists() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((car) =>
                car.id === id ? { ...car, ...data } : car
              ),
            };
          }
        );

        // Update featured cars if this car is featured
        if (data.isFeatured !== undefined) {
          queryClient.setQueriesData<Car[]>(
            { queryKey: carQueryKeys.featured() },
            (old) => {
              if (!old) return old;
              if (data.isFeatured) {
                // Add to featured if not already there
                const exists = old.some((car) => car.id === id);
                return exists
                  ? old.map((car) =>
                      car.id === id ? { ...car, ...data } : car
                    )
                  : [...old, { ...previousCar, ...data }];
              } else {
                // Remove from featured
                return old.filter((car) => car.id !== id);
              }
            }
          );
        }
      }

      // Return a context object with the snapshotted value
      return { previousCar };
    },
    onSuccess: (data) => {
      // Update with actual server data
      queryClient.setQueryData(carQueryKeys.detail(data.id), data);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: carQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carQueryKeys.featured() });

      toast.success('Car updated successfully');
    },
    onError: (error, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousCar) {
        queryClient.setQueryData(
          carQueryKeys.detail(variables.id),
          context.previousCar
        );
      }

      // Invalidate queries to refetch actual data
      queryClient.invalidateQueries({
        queryKey: carQueryKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: carQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carQueryKeys.featured() });

      // Enhanced error handling
      const errorMessage = error.message || 'Failed to update car';
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Car update failed:', {
        error,
        carId: variables.id,
        timestamp: new Date().toISOString(),
      });
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors (4xx)
      if (error.message.includes('40')) return false;
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return {
    ...mutation,
    isUpdating: mutation.isPending,
  };
};

// Hook for deleting a car
export const useDeleteCar = (): UseMutationResult<void, Error, string> & {
  isDeleting: boolean;
} => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/cars/${id}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete car');
      }
    },
    // Optimistic update - immediately remove from UI
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: carQueryKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: carQueryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: carQueryKeys.featured() });

      // Snapshot the previous values
      const previousCar = queryClient.getQueryData<Car>(
        carQueryKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData<PaginatedResponse<Car>>({
        queryKey: carQueryKeys.lists(),
      });
      const previousFeatured = queryClient.getQueryData<Car[]>(
        carQueryKeys.featured()
      );

      // Optimistically remove the car
      queryClient.removeQueries({ queryKey: carQueryKeys.detail(id) });

      // Remove from all lists
      queryClient.setQueriesData<PaginatedResponse<Car>>(
        { queryKey: carQueryKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((car) => car.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      // Remove from featured cars
      queryClient.setQueriesData<Car[]>(
        { queryKey: carQueryKeys.featured() },
        (old) => {
          if (!old) return old;
          return old.filter((car) => car.id !== id);
        }
      );

      return { previousCar, previousLists, previousFeatured };
    },
    onSuccess: () => {
      toast.success('Car deleted successfully');
    },
    onError: (error, id, context) => {
      // Revert the optimistic updates on error
      if (context?.previousCar) {
        queryClient.setQueryData(carQueryKeys.detail(id), context.previousCar);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousFeatured) {
        queryClient.setQueryData(
          carQueryKeys.featured(),
          context.previousFeatured
        );
      }

      // Enhanced error handling
      const errorMessage = error.message || 'Failed to delete car';
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Car deletion failed:', {
        error,
        carId: id,
        timestamp: new Date().toISOString(),
      });
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors (4xx)
      if (error.message.includes('40')) return false;
      // Retry network errors up to 1 time for deletion
      return failureCount < 1;
    },
    retryDelay: 2000,
  });

  return {
    ...mutation,
    isDeleting: mutation.isPending,
  };
};

// Hook for bulk operations
export const useBulkCarOperation = (): UseMutationResult<
  BulkOperationResult,
  Error,
  BulkOperationData
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkOperationData) => {
      const response = await api.post<BulkOperationResult>(
        '/api/cars/bulk',
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to perform bulk operation');
      }

      return response.data!;
    },
    onSuccess: (result) => {
      // Invalidate all car-related queries
      queryClient.invalidateQueries({ queryKey: carQueryKeys.all });

      toast.success(
        `Bulk operation completed: ${result.affectedCount} cars ${result.operation}`
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to perform bulk operation');
    },
  });
};

// Hook for uploading car images
export const useUploadCarImage = (): UseMutationResult<
  { url: string },
  Error,
  { carId: string; file: File }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('carId', carId);

      const response = await api.uploadFile<{ url: string }>(
        '/api/upload/car-image',
        formData
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to upload image');
      }

      return response.data!;
    },
    onSuccess: (_, { carId }) => {
      // Invalidate the specific car to refetch with new image
      queryClient.invalidateQueries({ queryKey: carQueryKeys.detail(carId) });

      toast.success('Image uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

// Enhanced optimistic update hook for advanced use cases
export const useOptimisticCarUpdate = () => {
  const queryClient = useQueryClient();

  const updateCarOptimistically = useCallback(
    (id: string, updates: Partial<Car>) => {
      // Update individual car
      queryClient.setQueryData<Car>(carQueryKeys.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...updates, updatedAt: new Date() };
      });

      // Update in all lists
      queryClient.setQueriesData<PaginatedResponse<Car>>(
        { queryKey: carQueryKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((car) =>
              car.id === id ? { ...car, ...updates } : car
            ),
          };
        }
      );

      // Update featured cars if relevant
      if (updates.isFeatured !== undefined) {
        queryClient.setQueriesData<Car[]>(
          { queryKey: carQueryKeys.featured() },
          (old) => {
            if (!old) return old;

            const existingIndex = old.findIndex((car) => car.id === id);

            if (updates.isFeatured) {
              // Add or update in featured
              if (existingIndex >= 0) {
                return old.map((car) =>
                  car.id === id ? { ...car, ...updates } : car
                );
              } else {
                // Need to get the full car data to add to featured
                const fullCar = queryClient.getQueryData<Car>(
                  carQueryKeys.detail(id)
                );
                return fullCar ? [...old, { ...fullCar, ...updates }] : old;
              }
            } else {
              // Remove from featured
              return old.filter((car) => car.id !== id);
            }
          }
        );
      }
    },
    [queryClient]
  );

  const revertOptimisticUpdate = useCallback(
    (id: string, originalData: Car) => {
      queryClient.setQueryData(carQueryKeys.detail(id), originalData);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: carQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carQueryKeys.featured() });
    },
    [queryClient]
  );

  const batchOptimisticUpdate = useCallback(
    (updates: Array<{ id: string; data: Partial<Car> }>) => {
      updates.forEach(({ id, data }) => {
        updateCarOptimistically(id, data);
      });
    },
    [updateCarOptimistically]
  );

  return {
    updateCarOptimistically,
    revertOptimisticUpdate,
    batchOptimisticUpdate,
  };
};

// Hook for prefetching car data
export const usePrefetchCar = () => {
  const queryClient = useQueryClient();

  const prefetchCar = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: carQueryKeys.detail(id),
      queryFn: async () => {
        const response = await api.get<Car>(`/api/cars/${id}`);
        return response.data!;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchCar };
};
