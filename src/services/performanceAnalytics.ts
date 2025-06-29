interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  sessionId: string;
  timestamp: number;
  pageLoadTime: number;
  resourceLoadTimes: Record<string, number>;
  navigationTiming: PerformanceNavigationTiming | null;
}

class PerformanceAnalyticsService {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private reportingInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startReporting();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add a performance metric
  addMetric(
    metric: Omit<PerformanceMetric, 'timestamp' | 'url' | 'userAgent'>
  ) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(fullMetric);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get current performance report
  getPerformanceReport(): PerformanceReport {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    const pageLoadTime =
      navigationTiming?.loadEventEnd && navigationTiming?.fetchStart
        ? navigationTiming.loadEventEnd - navigationTiming.fetchStart
        : 0;

    return {
      metrics: [...this.metrics],
      sessionId: this.sessionId,
      timestamp: Date.now(),
      pageLoadTime,
      resourceLoadTimes: this.getResourceLoadTimes(),
      navigationTiming: navigationTiming || null,
    };
  }

  // Get resource load times
  private getResourceLoadTimes(): Record<string, number> {
    const resourceEntries = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];
    const resourceTimes: Record<string, number> = {};

    resourceEntries.forEach((entry) => {
      const resourceName = this.getResourceName(entry.name);
      resourceTimes[resourceName] = entry.duration;
    });

    return resourceTimes;
  }

  private getResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || pathname;
    } catch {
      return url;
    }
  }

  // Get performance insights
  getPerformanceInsights(): {
    slowestResources: Array<{ name: string; duration: number }>;
    criticalMetrics: PerformanceMetric[];
    recommendations: string[];
  } {
    const resourceTimes = this.getResourceLoadTimes();
    const slowestResources = Object.entries(resourceTimes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, duration]) => ({ name, duration }));

    const criticalMetrics = this.metrics.filter(
      (metric) => metric.rating === 'poor'
    );

    const recommendations = this.generateRecommendations(
      slowestResources,
      criticalMetrics
    );

    return {
      slowestResources,
      criticalMetrics,
      recommendations,
    };
  }

  private generateRecommendations(
    slowestResources: Array<{ name: string; duration: number }>,
    criticalMetrics: PerformanceMetric[]
  ): string[] {
    const recommendations: string[] = [];

    // Resource-based recommendations
    if (slowestResources.length > 0) {
      const slowestResource = slowestResources[0];
      if (slowestResource.duration > 1000) {
        recommendations.push(
          `Consider optimizing ${slowestResource.name} which took ${Math.round(
            slowestResource.duration
          )}ms to load`
        );
      }
    }

    // Metric-based recommendations
    criticalMetrics.forEach((metric) => {
      switch (metric.name) {
        case 'LCP':
          if (metric.value > 2500) {
            recommendations.push(
              'Largest Contentful Paint is slow. Consider optimizing images and reducing server response time.'
            );
          }
          break;
        case 'FID':
          if (metric.value > 100) {
            recommendations.push(
              'First Input Delay is high. Consider reducing JavaScript execution time.'
            );
          }
          break;
        case 'CLS':
          if (metric.value > 0.1) {
            recommendations.push(
              'Cumulative Layout Shift is high. Ensure proper image dimensions and avoid inserting content above existing content.'
            );
          }
          break;
        case 'FCP':
          if (metric.value > 1800) {
            recommendations.push(
              'First Contentful Paint is slow. Consider reducing render-blocking resources.'
            );
          }
          break;
        case 'TTFB':
          if (metric.value > 800) {
            recommendations.push(
              'Time to First Byte is slow. Consider optimizing server response time.'
            );
          }
          break;
      }
    });

    return recommendations;
  }

  // Export performance data
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    const insights = this.getPerformanceInsights();

    const exportData = {
      report,
      insights,
      exportTimestamp: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Clear stored metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Start automatic reporting
  private startReporting() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.reportPerformance();
    }, this.reportingInterval);
  }

  // Stop automatic reporting
  stopReporting() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Report performance (can be extended to send to analytics service)
  private reportPerformance() {
    const report = this.getPerformanceReport();

    // In development, log to console
    if (import.meta.env.DEV) {
      console.group('Performance Report');
      console.log('Session ID:', report.sessionId);
      console.log('Page Load Time:', `${Math.round(report.pageLoadTime)}ms`);
      console.log('Metrics:', report.metrics);
      console.log('Insights:', this.getPerformanceInsights());
      console.groupEnd();
    }

    // In production, you could send this to your analytics service
    // Example: sendToAnalytics(report);
  }

  // Set reporting interval
  setReportingInterval(interval: number) {
    this.reportingInterval = interval;
    this.startReporting();
  }
}

// Create singleton instance
export const performanceAnalytics = new PerformanceAnalyticsService();

// Export types for use in other modules
export type { PerformanceMetric, PerformanceReport };
