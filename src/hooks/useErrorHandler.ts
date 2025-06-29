import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Error types
export interface AppError {
  id: string;
  message: string;
  type: ErrorType;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export type ErrorType =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'client'
  | 'unknown';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  type?: ErrorType;
  onRetry?: () => void;
  onError?: (error: AppError) => void;
}

// Error classification utility
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'authentication';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'authorization';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'not_found';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('server') || message.includes('500')) {
      return 'server';
    }
  }

  return 'unknown';
}

// Error message mapping
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Network error. Please check your connection and try again.',
  validation: 'Please check your input and try again.',
  authentication: 'Authentication required. Please log in.',
  authorization: 'You do not have permission to perform this action.',
  not_found: 'The requested resource was not found.',
  server: 'Server error. Please try again later.',
  client: 'An error occurred. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// Create AppError from unknown error
export function createAppError(
  error: unknown,
  context?: Record<string, unknown>,
  options?: Partial<AppError>
): AppError {
  const type = classifyError(error);
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: ERROR_MESSAGES[type] || message,
    type,
    timestamp: new Date(),
    context,
    stack,
    retryable: false,
    retryCount: 0,
    maxRetries: 3,
    ...options,
  };
}

/**
 * Hook for managing application errors
 */
export function useErrorHandler(defaultOptions?: ErrorHandlerOptions) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  const addError = useCallback(
    (
      error: unknown,
      context?: Record<string, unknown>,
      options?: ErrorHandlerOptions
    ) => {
      const finalOptions = { ...defaultOptions, ...options };
      const appError = createAppError(error, context, {
        retryable: finalOptions.retryable,
        maxRetries: finalOptions.maxRetries,
      });

      setErrors((prev) => [appError, ...prev.slice(0, 49)]); // Keep only last 50 errors

      // Log error if enabled
      if (finalOptions.logError !== false) {
        console.error('Application Error:', {
          ...appError,
          originalError: error,
        });
      }

      // Show toast if enabled
      if (finalOptions.showToast !== false) {
        toast.error(appError.message, {
          id: appError.id,
          duration: 5000,
        });
      }

      // Call error callback
      if (finalOptions.onError) {
        finalOptions.onError(appError);
      }

      return appError;
    },
    [defaultOptions]
  );

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
    toast.dismiss(errorId);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    toast.dismiss();
  }, []);

  const retryError = useCallback(
    async (errorId: string, retryFn: () => Promise<void>) => {
      const error = errors.find((e) => e.id === errorId);
      if (!error || !error.retryable) return;

      if ((error.retryCount || 0) >= (error.maxRetries || 3)) {
        toast.error('Maximum retry attempts reached');
        return;
      }

      setIsRetrying(true);

      try {
        await retryFn();
        removeError(errorId);
        toast.success('Operation completed successfully');
      } catch (retryError) {
        // Update retry count
        setErrors((prev) =>
          prev.map((e) =>
            e.id === errorId ? { ...e, retryCount: (e.retryCount || 0) + 1 } : e
          )
        );

        addError(retryError, { originalErrorId: errorId }, { showToast: true });
      } finally {
        setIsRetrying(false);
      }
    },
    [errors, addError, removeError]
  );

  const getErrorsByType = useCallback(
    (type: ErrorType) => {
      return errors.filter((error) => error.type === type);
    },
    [errors]
  );

  const hasErrors = errors.length > 0;
  const latestError = errors[0] || null;

  return {
    errors,
    hasErrors,
    latestError,
    isRetrying,
    addError,
    removeError,
    clearErrors,
    retryError,
    getErrorsByType,
  };
}

/**
 * Hook for handling async operations with error management
 */
export function useAsyncError() {
  const { addError } = useErrorHandler();

  const wrapAsync = useCallback(
    <T extends unknown[], R>(
      asyncFn: (...args: T) => Promise<R>,
      context?: Record<string, unknown>,
      options?: ErrorHandlerOptions
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          addError(error, context, options);
          return undefined;
        }
      };
    },
    [addError]
  );

  const executeAsync = useCallback(
    async <R>(
      asyncFn: () => Promise<R>,
      context?: Record<string, unknown>,
      options?: ErrorHandlerOptions
    ): Promise<R | undefined> => {
      try {
        return await asyncFn();
      } catch (error) {
        addError(error, context, options);
        return undefined;
      }
    },
    [addError]
  );

  return {
    wrapAsync,
    executeAsync,
  };
}

/**
 * Hook for form validation errors
 */
export function useFormErrors<T extends Record<string, unknown>>() {
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof T, string>>
  >({});
  const [formError, setFormError] = useState<string>('');

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setFieldErrors(errors);
  }, []);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setFormError('');
  }, []);

  const hasFieldError = useCallback(
    (field: keyof T) => {
      return Boolean(fieldErrors[field]);
    },
    [fieldErrors]
  );

  const getFieldError = useCallback(
    (field: keyof T) => {
      return fieldErrors[field] || '';
    },
    [fieldErrors]
  );

  const hasErrors = Object.keys(fieldErrors).length > 0 || Boolean(formError);

  return {
    fieldErrors,
    formError,
    hasErrors,
    setFieldError,
    clearFieldError,
    setFormError,
    setErrors,
    clearErrors,
    hasFieldError,
    getFieldError,
  };
}

/**
 * Hook for network error handling with retry logic
 */
export function useNetworkError() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { addError } = useErrorHandler();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkError = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      if (!isOnline) {
        addError(
          new Error(
            'You are currently offline. Please check your internet connection.'
          ),
          context,
          { type: 'network', retryable: true }
        );
      } else {
        addError(error, context, { retryable: true });
      }
    },
    [isOnline, addError]
  );

  return {
    isOnline,
    handleNetworkError,
  };
}

/**
 * Hook for API error handling
 */
export function useApiError() {
  const { addError } = useErrorHandler();

  const handleApiError = useCallback(
    (error: unknown, endpoint?: string, method?: string) => {
      const context = {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
      };

      // Handle different types of API errors
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          addError(
            new Error('Your session has expired. Please log in again.'),
            context,
            { type: 'authentication' }
          );
        } else if (error.message.includes('403')) {
          addError(
            new Error('You do not have permission to access this resource.'),
            context,
            { type: 'authorization' }
          );
        } else if (error.message.includes('404')) {
          addError(
            new Error('The requested resource was not found.'),
            context,
            { type: 'not_found' }
          );
        } else if (error.message.includes('500')) {
          addError(
            new Error('Server error. Our team has been notified.'),
            context,
            { type: 'server', retryable: true }
          );
        } else {
          addError(error, context, { retryable: true });
        }
      } else {
        addError(error, context);
      }
    },
    [addError]
  );

  return {
    handleApiError,
  };
}

/**
 * Global error boundary hook
 */
export function useGlobalErrorHandler() {
  const { addError, errors, clearErrors } = useErrorHandler({
    showToast: true,
    logError: true,
  });

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError(event.reason, { type: 'unhandled_promise_rejection' });
    };

    const handleError = (event: ErrorEvent) => {
      addError(event.error || event.message, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
    };
  }, [addError]);

  return {
    errors,
    clearErrors,
  };
}

/**
 * Error recovery hook with automatic retry
 */
export function useErrorRecovery() {
  const [recoveryAttempts, setRecoveryAttempts] = useState<
    Record<string, number>
  >({});

  const attemptRecovery = useCallback(
    async (
      errorId: string,
      recoveryFn: () => Promise<void>,
      maxAttempts = 3
    ) => {
      const currentAttempts = recoveryAttempts[errorId] || 0;

      if (currentAttempts >= maxAttempts) {
        throw new Error('Maximum recovery attempts exceeded');
      }

      setRecoveryAttempts((prev) => ({
        ...prev,
        [errorId]: currentAttempts + 1,
      }));

      await recoveryFn();
      // Clear recovery attempts on success
      setRecoveryAttempts((prev) => {
        const newAttempts = { ...prev };
        delete newAttempts[errorId];
        return newAttempts;
      });
    },
    [recoveryAttempts]
  );

  const clearRecoveryAttempts = useCallback((errorId?: string) => {
    if (errorId) {
      setRecoveryAttempts((prev) => {
        const newAttempts = { ...prev };
        delete newAttempts[errorId];
        return newAttempts;
      });
    } else {
      setRecoveryAttempts({});
    }
  }, []);

  return {
    recoveryAttempts,
    attemptRecovery,
    clearRecoveryAttempts,
  };
}
