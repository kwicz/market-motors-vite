import { QueryClient } from '@tanstack/react-query';
import { OfflineSync, offlineManager } from './offline';
import { cacheKeys, CacheManager } from './cache';

// Background sync configuration
export interface BackgroundSyncConfig {
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  priorityEndpoints: string[];
  lowPriorityEndpoints: string[];
  syncOnFocus: boolean;
  syncOnVisibilityChange: boolean;
  syncOnNetworkReconnect: boolean;
}

export const defaultSyncConfig: BackgroundSyncConfig = {
  syncInterval: 1000 * 60 * 5, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000 * 30, // 30 seconds
  priorityEndpoints: ['/api/cars', '/api/user/favorites'],
  lowPriorityEndpoints: ['/api/makes', '/api/models', '/api/categories'],
  syncOnFocus: true,
  syncOnVisibilityChange: true,
  syncOnNetworkReconnect: true,
};

// Sync job interface
export interface SyncJob {
  id: string;
  type: 'query' | 'mutation' | 'custom';
  priority: 'high' | 'medium' | 'low';
  queryKey?: unknown[];
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  retryCount: number;
  lastAttempt: number;
  nextAttempt: number;
  createdAt: number;
  customHandler?: () => Promise<void>;
}

// Background sync manager
export class BackgroundSyncManager {
  private queryClient: QueryClient;
  private offlineSync: OfflineSync;
  private cacheManager: CacheManager;
  private config: BackgroundSyncConfig;
  private syncJobs: Map<string, SyncJob> = new Map();
  private isRunning = false;
  private intervalId: number | null = null;
  private priorityQueue: SyncJob[] = [];
  private regularQueue: SyncJob[] = [];
  private lowPriorityQueue: SyncJob[] = [];

  constructor(
    queryClient: QueryClient,
    offlineSync: OfflineSync,
    config: Partial<BackgroundSyncConfig> = {}
  ) {
    this.queryClient = queryClient;
    this.offlineSync = offlineSync;
    this.cacheManager = new CacheManager(queryClient);
    this.config = { ...defaultSyncConfig, ...config };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Sync on window focus
    if (this.config.syncOnFocus) {
      window.addEventListener('focus', this.handleWindowFocus.bind(this));
    }

    // Sync on visibility change
    if (this.config.syncOnVisibilityChange) {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange.bind(this)
      );
    }

    // Sync on network reconnect
    if (this.config.syncOnNetworkReconnect) {
      offlineManager.addListener(this.handleNetworkChange.bind(this));
    }

    // Sync on page unload (cleanup)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private handleWindowFocus(): void {
    if (offlineManager.getIsOnline() && !this.isRunning) {
      this.syncPriorityData();
    }
  }

  private handleVisibilityChange(): void {
    if (
      document.visibilityState === 'visible' &&
      offlineManager.getIsOnline()
    ) {
      this.syncPriorityData();
    }
  }

  private handleNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      // Prioritize offline sync first, then background sync
      setTimeout(() => {
        this.syncAllQueues();
      }, 1000);
    }
  }

  private handleBeforeUnload(): void {
    this.stop();
  }

  // Start background sync
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduleNextSync();
    console.log('Background sync started');
  }

  // Stop background sync
  public stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    console.log('Background sync stopped');
  }

  // Schedule next sync cycle
  private scheduleNextSync(): void {
    if (!this.isRunning) return;

    this.intervalId = window.setTimeout(() => {
      this.performSyncCycle();
      this.scheduleNextSync();
    }, this.config.syncInterval);
  }

  // Perform a complete sync cycle
  private async performSyncCycle(): Promise<void> {
    if (!offlineManager.getIsOnline()) return;

    try {
      // Process queues in priority order
      await this.processQueue(this.priorityQueue, 'high');
      await this.processQueue(this.regularQueue, 'medium');
      await this.processQueue(this.lowPriorityQueue, 'low');

      // Sync critical data
      await this.syncCriticalData();

      // Clean up completed jobs
      this.cleanupCompletedJobs();
    } catch (error) {
      console.error('Background sync cycle failed:', error);
    }
  }

  // Process a specific queue
  private async processQueue(
    queue: SyncJob[],
    priority: string
  ): Promise<void> {
    const now = Date.now();
    const jobsToProcess = queue.filter((job) => job.nextAttempt <= now);

    for (const job of jobsToProcess) {
      try {
        await this.executeJob(job);
        this.removeJob(job.id);
      } catch (error) {
        this.handleJobFailure(job, error);
      }
    }
  }

  // Execute a sync job
  private async executeJob(job: SyncJob): Promise<void> {
    job.lastAttempt = Date.now();

    switch (job.type) {
      case 'query':
        await this.executeQueryJob(job);
        break;
      case 'mutation':
        await this.executeMutationJob(job);
        break;
      case 'custom':
        if (job.customHandler) {
          await job.customHandler();
        }
        break;
    }
  }

  // Execute query job
  private async executeQueryJob(job: SyncJob): Promise<void> {
    if (!job.queryKey) throw new Error('Query key required for query job');

    await this.queryClient.refetchQueries({
      queryKey: job.queryKey,
      type: 'active',
    });
  }

  // Execute mutation job
  private async executeMutationJob(job: SyncJob): Promise<void> {
    if (!job.endpoint || !job.method) {
      throw new Error('Endpoint and method required for mutation job');
    }

    const response = await fetch(job.endpoint, {
      method: job.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: job.data ? JSON.stringify(job.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Handle job failure
  private handleJobFailure(job: SyncJob, error: unknown): void {
    job.retryCount++;

    if (job.retryCount >= this.config.maxRetries) {
      console.error(
        `Job ${job.id} failed after ${this.config.maxRetries} retries:`,
        error
      );
      this.removeJob(job.id);
    } else {
      // Schedule retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, job.retryCount - 1);
      job.nextAttempt = Date.now() + delay;
      console.warn(`Job ${job.id} failed, retrying in ${delay}ms:`, error);
    }
  }

  // Add a sync job
  public addJob(
    job: Omit<
      SyncJob,
      'id' | 'retryCount' | 'lastAttempt' | 'nextAttempt' | 'createdAt'
    >
  ): string {
    const id = `sync-job-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const fullJob: SyncJob = {
      ...job,
      id,
      retryCount: 0,
      lastAttempt: 0,
      nextAttempt: Date.now(),
      createdAt: Date.now(),
    };

    this.syncJobs.set(id, fullJob);
    this.addToQueue(fullJob);

    return id;
  }

  // Add job to appropriate queue
  private addToQueue(job: SyncJob): void {
    switch (job.priority) {
      case 'high':
        this.priorityQueue.push(job);
        break;
      case 'medium':
        this.regularQueue.push(job);
        break;
      case 'low':
        this.lowPriorityQueue.push(job);
        break;
    }
  }

  // Remove a job
  public removeJob(jobId: string): boolean {
    const job = this.syncJobs.get(jobId);
    if (!job) return false;

    this.syncJobs.delete(jobId);
    this.removeFromQueue(job);
    return true;
  }

  // Remove job from queue
  private removeFromQueue(job: SyncJob): void {
    const queues = [
      this.priorityQueue,
      this.regularQueue,
      this.lowPriorityQueue,
    ];

    for (const queue of queues) {
      const index = queue.findIndex((j) => j.id === job.id);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }
  }

  // Sync priority data immediately
  public async syncPriorityData(): Promise<void> {
    if (!offlineManager.getIsOnline()) return;

    try {
      // Refetch active queries for priority endpoints
      await this.queryClient.refetchQueries({
        queryKey: cacheKeys.cars.all,
        type: 'active',
        stale: true,
      });

      // Sync user-specific data
      await this.queryClient.refetchQueries({
        predicate: (query) => {
          return query.queryKey.some(
            (key) => typeof key === 'string' && key.includes('user')
          );
        },
      });
    } catch (error) {
      console.error('Priority data sync failed:', error);
    }
  }

  // Sync all queues immediately
  public async syncAllQueues(): Promise<void> {
    if (!offlineManager.getIsOnline()) return;

    await this.processQueue(this.priorityQueue, 'high');
    await this.processQueue(this.regularQueue, 'medium');
    await this.processQueue(this.lowPriorityQueue, 'low');
  }

  // Sync critical data
  private async syncCriticalData(): Promise<void> {
    // Warm cache with featured cars
    await this.cacheManager.warmCache();

    // Refresh stale queries
    await this.queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });

    // Background refresh of popular data
    this.cacheManager.refreshCacheInBackground();
  }

  // Clean up old completed jobs
  private cleanupCompletedJobs(): void {
    const now = Date.now();
    const maxAge = 1000 * 60 * 60; // 1 hour

    for (const [id, job] of this.syncJobs.entries()) {
      if (now - job.createdAt > maxAge) {
        this.removeJob(id);
      }
    }
  }

  // Get sync statistics
  public getSyncStats(): {
    totalJobs: number;
    pendingJobs: number;
    failedJobs: number;
    completedJobs: number;
    isRunning: boolean;
    lastSyncTime: number;
  } {
    const pendingJobs = Array.from(this.syncJobs.values()).filter(
      (job) => job.retryCount === 0
    );
    const failedJobs = Array.from(this.syncJobs.values()).filter(
      (job) => job.retryCount > 0
    );

    return {
      totalJobs: this.syncJobs.size,
      pendingJobs: pendingJobs.length,
      failedJobs: failedJobs.length,
      completedJobs: 0, // Completed jobs are removed
      isRunning: this.isRunning,
      lastSyncTime: Math.max(
        ...Array.from(this.syncJobs.values()).map((job) => job.lastAttempt)
      ),
    };
  }

  // Update sync configuration
  public updateConfig(newConfig: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart if interval changed
    if (newConfig.syncInterval && this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Destroy the sync manager
  public destroy(): void {
    this.stop();

    // Remove event listeners
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
    window.removeEventListener(
      'beforeunload',
      this.handleBeforeUnload.bind(this)
    );

    // Clear all jobs
    this.syncJobs.clear();
    this.priorityQueue = [];
    this.regularQueue = [];
    this.lowPriorityQueue = [];
  }
}

// Global background sync instance
let globalBackgroundSync: BackgroundSyncManager | null = null;

// Initialize background sync
export const initializeBackgroundSync = (
  queryClient: QueryClient,
  offlineSync: OfflineSync,
  config?: Partial<BackgroundSyncConfig>
): BackgroundSyncManager => {
  if (globalBackgroundSync) {
    globalBackgroundSync.destroy();
  }

  globalBackgroundSync = new BackgroundSyncManager(
    queryClient,
    offlineSync,
    config
  );
  return globalBackgroundSync;
};

// Get global background sync instance
export const getBackgroundSync = (): BackgroundSyncManager | null => {
  return globalBackgroundSync;
};
