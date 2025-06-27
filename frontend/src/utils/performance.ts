import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { performanceAnalytics } from '../services/performanceAnalytics';

// Performance metrics interface
export interface PerformanceMetrics {
  cls: number | null;
  inp: number | null; // Interaction to Next Paint (replaces FID)
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
  timestamp: number;
  url: string;
  userAgent: string;
}

// Performance thresholds (based on Google's recommendations)
export const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint thresholds
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

// Performance rating helper
export const getPerformanceRating = (
  metric: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = PERFORMANCE_THRESHOLDS[metric];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

// Analytics endpoint (would be replaced with actual analytics service)
const sendToAnalytics = (metrics: Partial<PerformanceMetrics>) => {
  // In production, this would send to your analytics service
  // For now, we'll just log to console in development
  if (import.meta.env.DEV) {
    console.group('🚀 Performance Metrics');
    Object.entries(metrics).forEach(([key, value]) => {
      if (
        value !== null &&
        key !== 'timestamp' &&
        key !== 'url' &&
        key !== 'userAgent'
      ) {
        const rating = getPerformanceRating(
          key.toUpperCase() as keyof typeof PERFORMANCE_THRESHOLDS,
          value as number
        );
        const emoji =
          rating === 'good'
            ? '✅'
            : rating === 'needs-improvement'
            ? '⚠️'
            : '❌';
        console.log(`${emoji} ${key.toUpperCase()}: ${value}ms (${rating})`);
      }
    });
    console.groupEnd();
  }

  // In production, send to analytics service
  if (import.meta.env.PROD) {
    // Example: Send to Google Analytics, Mixpanel, or custom endpoint
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metrics)
    // });
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  const metrics: Partial<PerformanceMetrics> = {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Cumulative Layout Shift (CLS)
  onCLS((metric) => {
    metrics.cls = metric.value;
    sendToAnalytics({ ...metrics, cls: metric.value });
  });

  // Interaction to Next Paint (INP) - replaces FID in web-vitals v5
  onINP((metric) => {
    metrics.inp = metric.value;
    sendToAnalytics({ ...metrics, inp: metric.value });
  });

  // First Contentful Paint (FCP)
  onFCP((metric) => {
    metrics.fcp = metric.value;
    sendToAnalytics({ ...metrics, fcp: metric.value });
  });

  // Largest Contentful Paint (LCP)
  onLCP((metric) => {
    metrics.lcp = metric.value;
    sendToAnalytics({ ...metrics, lcp: metric.value });
  });

  // Time to First Byte (TTFB)
  onTTFB((metric) => {
    metrics.ttfb = metric.value;
    sendToAnalytics({ ...metrics, ttfb: metric.value });
  });
};

// Resource loading performance monitoring
export const monitorResourceLoading = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Monitor slow resources (>1s load time)
          if (resourceEntry.duration > 1000) {
            console.warn(
              `Slow resource detected: ${resourceEntry.name} took ${resourceEntry.duration}ms`
            );

            // Send to analytics in production
            if (import.meta.env.PROD) {
              sendToAnalytics({
                timestamp: Date.now(),
                url: resourceEntry.name,
                userAgent: navigator.userAgent,
                cls: null,
                inp: null,
                fcp: null,
                lcp: null,
                ttfb: resourceEntry.duration,
              });
            }
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};

// Memory usage monitoring with proper typing
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memoryInfo = (performance as { memory: MemoryInfo }).memory;

    setInterval(() => {
      const memoryUsage = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      };

      // Warn if memory usage is high (>50MB)
      if (memoryUsage.usedJSHeapSize > 50 * 1024 * 1024) {
        console.warn('High memory usage detected:', memoryUsage);
      }

      if (import.meta.env.DEV) {
        console.log('Memory usage:', {
          used: `${(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        });
      }
    }, 30000); // Check every 30 seconds
  }
};

// Long task monitoring
export const monitorLongTasks = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.warn(
          `Long task detected: ${entry.duration}ms at ${entry.startTime}ms`
        );

        // Send to analytics in production
        if (import.meta.env.PROD) {
          sendToAnalytics({
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            cls: null,
            inp: entry.duration,
            fcp: null,
            lcp: null,
            ttfb: null,
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // longtask observer not supported
      console.log('Long task monitoring not supported in this browser');
    }
  }
};

// Start performance monitoring with analytics integration
export const startPerformanceMonitoring = () => {
  // Core Web Vitals monitoring with analytics integration
  onCLS((metric) => {
    const rating = getPerformanceRating('CLS', metric.value);
    console.log(`CLS: ${metric.value.toFixed(3)} (${rating})`);

    // Add to analytics
    performanceAnalytics.addMetric({
      name: 'CLS',
      value: metric.value,
      rating,
    });
  });

  onINP((metric) => {
    const rating = getPerformanceRating('INP', metric.value);
    console.log(`INP: ${Math.round(metric.value)}ms (${rating})`);

    // Add to analytics
    performanceAnalytics.addMetric({
      name: 'INP',
      value: metric.value,
      rating,
    });
  });

  onFCP((metric) => {
    const rating = getPerformanceRating('FCP', metric.value);
    console.log(`FCP: ${Math.round(metric.value)}ms (${rating})`);

    // Add to analytics
    performanceAnalytics.addMetric({
      name: 'FCP',
      value: metric.value,
      rating,
    });
  });

  onLCP((metric) => {
    const rating = getPerformanceRating('LCP', metric.value);
    console.log(`LCP: ${Math.round(metric.value)}ms (${rating})`);

    // Add to analytics
    performanceAnalytics.addMetric({
      name: 'LCP',
      value: metric.value,
      rating,
    });
  });

  onTTFB((metric) => {
    const rating = getPerformanceRating('TTFB', metric.value);
    console.log(`TTFB: ${Math.round(metric.value)}ms (${rating})`);

    // Add to analytics
    performanceAnalytics.addMetric({
      name: 'TTFB',
      value: metric.value,
      rating,
    });
  });

  // Monitor additional performance metrics
  monitorResourceTiming();
  monitorNavigationTiming();

  console.log('🚀 Performance monitoring started with analytics integration');
};

// Monitor resource timing
const monitorResourceTiming = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Log slow resources
        if (resourceEntry.duration > 1000) {
          console.warn(
            `Slow resource detected: ${resourceEntry.name} took ${Math.round(
              resourceEntry.duration
            )}ms`
          );
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
};

// Monitor navigation timing
const monitorNavigationTiming = () => {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigationTiming) {
        const domContentLoaded =
          navigationTiming.domContentLoadedEventEnd -
          navigationTiming.domContentLoadedEventStart;
        const loadComplete =
          navigationTiming.loadEventEnd - navigationTiming.loadEventStart;

        console.log(`DOM Content Loaded: ${Math.round(domContentLoaded)}ms`);
        console.log(`Load Complete: ${Math.round(loadComplete)}ms`);

        // Add custom metrics to analytics
        performanceAnalytics.addMetric({
          name: 'DOM_CONTENT_LOADED',
          value: domContentLoaded,
          rating:
            domContentLoaded < 1000
              ? 'good'
              : domContentLoaded < 2000
              ? 'needs-improvement'
              : 'poor',
        });

        performanceAnalytics.addMetric({
          name: 'LOAD_COMPLETE',
          value: loadComplete,
          rating:
            loadComplete < 500
              ? 'good'
              : loadComplete < 1000
              ? 'needs-improvement'
              : 'poor',
        });
      }
    }, 0);
  });
};

// Export performance analytics for external use
export { performanceAnalytics };

// Export individual monitoring functions for selective use
export { onCLS, onINP, onFCP, onLCP, onTTFB };
