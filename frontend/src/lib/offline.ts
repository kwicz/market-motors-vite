import { QueryClient } from '@tanstack/react-query';
import { memoryCache, lruCache } from './cache';

// Offline detection utilities
export class OfflineManager {
  private isOnline = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private retryQueue: Array<() => Promise<void>> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners();
    this.processRetryQueue();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  private async processRetryQueue() {
    const queue = [...this.retryQueue];
    this.retryQueue = [];

    for (const retry of queue) {
      try {
        await retry();
      } catch (error) {
        console.error('Failed to retry operation:', error);
        // Re-add to queue if it fails
        this.retryQueue.push(retry);
      }
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public addToRetryQueue(operation: () => Promise<void>): void {
    this.retryQueue.push(operation);
  }

  public clearRetryQueue(): void {
    this.retryQueue = [];
  }

  public getQueueSize(): number {
    return this.retryQueue.length;
  }

  public destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners = [];
    this.retryQueue = [];
  }
}

// Persistent storage for offline data
export class OfflineStorage {
  private dbName = 'market-motors-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cars')) {
          const carsStore = db.createObjectStore('cars', { keyPath: 'id' });
          carsStore.createIndex('make', 'make', { unique: false });
          carsStore.createIndex('model', 'model', { unique: false });
          carsStore.createIndex('year', 'year', { unique: false });
          carsStore.createIndex('price', 'price', { unique: false });
        }

        if (!db.objectStoreNames.contains('searches')) {
          db.createObjectStore('searches', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'carId' });
        }

        if (!db.objectStoreNames.contains('pending-operations')) {
          db.createObjectStore('pending-operations', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        if (!db.objectStoreNames.contains('query-cache')) {
          db.createObjectStore('query-cache', { keyPath: 'key' });
        }
      };
    });
  }

  async storeCars(cars: unknown[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['cars'], 'readwrite');
    const store = transaction.objectStore('cars');

    const promises = cars.map((car) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(car);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getCars(filters?: Record<string, unknown>): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cars'], 'readonly');
      const store = transaction.objectStore('cars');
      const request = store.getAll();

      request.onsuccess = () => {
        let cars = request.result;

        // Apply filters if provided
        if (filters) {
          cars = cars.filter((car: Record<string, unknown>) => {
            return Object.entries(filters).every(([key, value]) => {
              if (value === undefined || value === null) return true;
              return car[key] === value;
            });
          });
        }

        resolve(cars);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storeQueryCache(
    key: string,
    data: unknown,
    timestamp: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['query-cache'], 'readwrite');
      const store = transaction.objectStore('query-cache');
      const request = store.put({ key, data, timestamp });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueryCache(
    key: string
  ): Promise<{ data: unknown; timestamp: number } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['query-cache'], 'readonly');
      const store = transaction.objectStore('query-cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(
          result ? { data: result.data, timestamp: result.timestamp } : null
        );
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storePendingOperation(operation: {
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: unknown;
    timestamp: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pending-operations'],
        'readwrite'
      );
      const store = transaction.objectStore('pending-operations');
      const request = store.add(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<
    Array<{
      id: number;
      type: 'create' | 'update' | 'delete';
      endpoint: string;
      data?: unknown;
      timestamp: number;
    }>
  > {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pending-operations'],
        'readonly'
      );
      const store = transaction.objectStore('pending-operations');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingOperation(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pending-operations'],
        'readwrite'
      );
      const store = transaction.objectStore('pending-operations');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeNames = [
      'cars',
      'searches',
      'favorites',
      'pending-operations',
      'query-cache',
    ];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    const promises = storeNames.map((storeName) => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }
}

// Offline-first data synchronization
export class OfflineSync {
  private offlineManager: OfflineManager;
  private offlineStorage: OfflineStorage;
  private queryClient: QueryClient;
  private syncInProgress = false;

  constructor(queryClient: QueryClient) {
    this.offlineManager = new OfflineManager();
    this.offlineStorage = new OfflineStorage();
    this.queryClient = queryClient;
    this.setupSync();
  }

  async initialize(): Promise<void> {
    await this.offlineStorage.initialize();
    this.setupOnlineListener();
  }

  private setupSync(): void {
    // Sync when coming back online
    this.offlineManager.addListener((isOnline) => {
      if (isOnline && !this.syncInProgress) {
        this.syncPendingOperations();
      }
    });
  }

  private setupOnlineListener(): void {
    this.offlineManager.addListener((isOnline) => {
      // Invalidate queries when coming back online to refresh data
      if (isOnline) {
        this.queryClient.invalidateQueries();
      }
    });
  }

  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.offlineManager.getIsOnline()) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingOperations =
        await this.offlineStorage.getPendingOperations();

      for (const operation of pendingOperations) {
        try {
          await this.executePendingOperation(operation);
          await this.offlineStorage.removePendingOperation(operation.id);
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
          // Keep the operation in the queue for later retry
        }
      }
    } catch (error) {
      console.error('Failed to sync pending operations:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executePendingOperation(operation: {
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: unknown;
  }): Promise<void> {
    // This would integrate with your API client
    // For now, we'll simulate the API call
    const response = await fetch(operation.endpoint, {
      method:
        operation.type === 'create'
          ? 'POST'
          : operation.type === 'update'
          ? 'PUT'
          : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: operation.data ? JSON.stringify(operation.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async queueOperation(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data?: unknown
  ): Promise<void> {
    await this.offlineStorage.storePendingOperation({
      type,
      endpoint,
      data,
      timestamp: Date.now(),
    });
  }

  isOnline(): boolean {
    return this.offlineManager.getIsOnline();
  }

  getQueueSize(): number {
    return this.offlineManager.getQueueSize();
  }

  async clearOfflineData(): Promise<void> {
    await this.offlineStorage.clearAllData();
    memoryCache.clear();
    lruCache.clear();
  }
}

// Simple query client persistence using localStorage
export const createPersistentQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: (failureCount, error) => {
          // Don't retry if offline
          if (!navigator.onLine) return false;
          // Retry up to 3 times for network errors
          return failureCount < 3;
        },
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: (failureCount, error) => {
          if (!navigator.onLine) return false;
          return failureCount < 3;
        },
      },
    },
  });

  return queryClient;
};

// Service Worker registration for offline support
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  };

// Background sync for periodic data updates
export class BackgroundSync {
  private intervalId: number | null = null;
  private syncInterval = 1000 * 60 * 5; // 5 minutes

  constructor(
    private offlineSync: OfflineSync,
    private queryClient: QueryClient
  ) {}

  start(interval = this.syncInterval): void {
    this.stop(); // Clear any existing interval

    this.intervalId = window.setInterval(async () => {
      if (this.offlineSync.isOnline()) {
        // Sync pending operations
        await this.offlineSync.syncPendingOperations();

        // Refresh critical data in background
        this.queryClient.refetchQueries({
          type: 'active',
          stale: true,
        });
      }
    }, interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSyncInterval(interval: number): void {
    this.syncInterval = interval;
    if (this.intervalId) {
      this.start(interval);
    }
  }
}

// Global offline manager instance
export const offlineManager = new OfflineManager();

// Utility functions
export const offlineUtils = {
  // Check if a request should be cached for offline use
  shouldCacheForOffline: (url: string): boolean => {
    const cacheableEndpoints = ['/api/cars', '/api/makes', '/api/models'];
    return cacheableEndpoints.some((endpoint) => url.includes(endpoint));
  },

  // Get cached data when offline
  getCachedData: async (key: string): Promise<unknown | null> => {
    // Try memory cache first
    const memoryData = memoryCache.get(key);
    if (memoryData) return memoryData;

    // Try LRU cache
    const lruData = lruCache.get(key);
    if (lruData) return lruData;

    // Try localStorage
    try {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    } catch {
      return null;
    }
  },

  // Store data for offline use
  setCachedData: (key: string, data: unknown, persistent = false): void => {
    // Always store in memory cache
    memoryCache.set(key, data);
    lruCache.set(key, data);

    // Optionally store in localStorage for persistence
    if (persistent) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to store data in localStorage:', error);
      }
    }
  },

  // Check network connectivity with ping
  checkConnectivity: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
