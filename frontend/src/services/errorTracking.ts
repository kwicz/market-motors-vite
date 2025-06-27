import { sentryUtils } from '../utils/sentry';
import loggerUtils from '../utils/logger';

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  [key: string]: unknown;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

class ErrorTrackingService {
  private sessionId: string;
  private userId?: string;
  private userContext?: {
    id: string;
    email?: string;
    role?: string;
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandledrejection',
        reason: event.reason,
        promise: event.promise,
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.logError(new Error(event.message), {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  // Set user context for tracking
  setUser(user: { id: string; email?: string; role?: string }): void {
    this.userId = user.id;
    this.userContext = user;

    // Set context in both Sentry and logger
    sentryUtils.setUserContext(user);
    loggerUtils.info('User context set', {
      userId: user.id,
      userRole: user.role,
      sessionId: this.sessionId,
    });
  }

  // Clear user context (for logout)
  clearUser(): void {
    this.userId = undefined;
    this.userContext = undefined;
    sentryUtils.clearUser();
    loggerUtils.info('User context cleared', {
      sessionId: this.sessionId,
    });
  }

  // Log errors with context
  logError(error: Error, context?: ErrorContext): void {
    const errorContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      buildVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };

    // Log to both Sentry and Winston
    sentryUtils.logError(error, errorContext);
    loggerUtils.error(error.message, error, errorContext);

    // Add breadcrumb for error tracking
    sentryUtils.addBreadcrumb(`Error: ${error.message}`, 'error', 'error');
  }

  // Log warnings
  logWarning(message: string, context?: ErrorContext): void {
    const warningContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    sentryUtils.logMessage(message, 'warning', warningContext);
    loggerUtils.warn(message, warningContext);
  }

  // Log info messages
  logInfo(message: string, context?: ErrorContext): void {
    const infoContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    sentryUtils.logMessage(message, 'info', infoContext);
    loggerUtils.info(message, infoContext);
  }

  // Log user actions
  logUserAction(action: string, context?: ErrorContext): void {
    if (!this.userId) {
      loggerUtils.warn('User action logged without user context', { action });
      return;
    }

    const actionContext: ErrorContext = {
      ...context,
      userId: this.userId,
      action,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    loggerUtils.userAction(this.userId, action, actionContext);
    sentryUtils.addBreadcrumb(`User Action: ${action}`, 'user', 'info');
  }

  // Log performance metrics
  logPerformanceMetric(
    metric: PerformanceMetric,
    context?: ErrorContext
  ): void {
    const perfContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    };

    loggerUtils.performance(metric.name, metric.value, perfContext);

    // Log poor performance as warnings
    if (metric.rating === 'poor') {
      sentryUtils.logMessage(
        `Poor performance detected: ${metric.name}`,
        'warning',
        perfContext
      );
    }
  }

  // Log API requests
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: ErrorContext
  ): void {
    const apiContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      method,
      url,
      statusCode,
      duration,
    };

    loggerUtils.apiRequest(method, url, statusCode, duration, apiContext);

    // Log failed requests as errors
    if (statusCode >= 400) {
      const errorMessage = `API request failed: ${method} ${url} - ${statusCode}`;
      sentryUtils.logMessage(errorMessage, 'error', apiContext);
    }
  }

  // Log security events
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: ErrorContext
  ): void {
    const securityContext: ErrorContext = {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      securityEvent: event,
      severity,
    };

    loggerUtils.security(event, severity, securityContext);
    sentryUtils.logMessage(
      `Security Event: ${event}`,
      'warning',
      securityContext
    );
    sentryUtils.addBreadcrumb(`Security: ${event}`, 'security', 'warning');
  }

  // Add custom breadcrumb
  addBreadcrumb(message: string, category: string = 'custom'): void {
    sentryUtils.addBreadcrumb(message, category, 'info');
  }

  // Set custom tags
  setTag(key: string, value: string): void {
    sentryUtils.setTag(key, value);
  }

  // Get session information
  getSessionInfo(): { sessionId: string; userId?: string } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}

// Create singleton instance
const errorTrackingService = new ErrorTrackingService();

export default errorTrackingService;
export { ErrorTrackingService };
