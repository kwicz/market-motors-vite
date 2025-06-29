import * as Sentry from '@sentry/react';

// Sentry configuration
export const initSentry = () => {
  // Only initialize in production or when explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
      console.warn('Sentry DSN not found. Error tracking will be disabled.');
      return;
    }

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      debug: import.meta.env.DEV,

      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Session replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'development',

      // Error filtering
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (
          import.meta.env.DEV &&
          import.meta.env.VITE_ENABLE_SENTRY !== 'true'
        ) {
          return null;
        }

        // Filter out common non-critical errors
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message).toLowerCase();

          // Skip network errors that are often temporary
          if (
            message.includes('network error') ||
            message.includes('fetch error') ||
            message.includes('cors')
          ) {
            return null;
          }

          // Skip common browser extension errors
          if (
            message.includes('extension') ||
            message.includes('chrome-extension')
          ) {
            return null;
          }
        }

        return event;
      },

      // User context
      initialScope: {
        tags: {
          component: 'market-motors',
        },
      },
    });

    console.log('Sentry initialized for error tracking');
  }
};

// Utility functions for error tracking
export const sentryUtils = {
  // Set user context
  setUserContext: (user: { id: string; email?: string; role?: string }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  },

  // Log errors with context
  logError: (error: Error, context?: Record<string, unknown>) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('error_context', context);
      }
      Sentry.captureException(error);
    });
  },

  // Log messages with different levels
  logMessage: (
    message: string,
    level: Sentry.SeverityLevel = 'info',
    extra?: Record<string, unknown>
  ) => {
    Sentry.withScope((scope) => {
      if (extra) {
        scope.setContext('message_context', extra);
      }
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  },

  addBreadcrumb: (
    message: string,
    category: string,
    level: Sentry.SeverityLevel = 'info'
  ) => {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  },

  // Clear user context (for logout)
  clearUser: () => {
    Sentry.setUser(null);
  },

  // Set custom tags
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  // Set custom context
  setContext: (key: string, context: Record<string, unknown>) => {
    Sentry.setContext(key, context);
  },
};

// Export Sentry for direct use
export { Sentry };
