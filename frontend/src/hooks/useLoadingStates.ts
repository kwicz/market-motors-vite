import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  isInitialLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
  error: Error | null;
}

export interface MutationLoadingState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for managing loading states with enhanced UI feedback
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isInitialLoading, setIsInitialLoading] = useState(initialLoading);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback((isInitial = false) => {
    setIsLoading(true);
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsRefetching(true);
    }
    setError(null);
  }, []);

  const stopLoading = useCallback((dataEmpty = false) => {
    setIsLoading(false);
    setIsInitialLoading(false);
    setIsRefetching(false);
    setIsEmpty(dataEmpty);
  }, []);

  const setLoadingError = useCallback((err: Error | null) => {
    setError(err);
    setIsLoading(false);
    setIsInitialLoading(false);
    setIsRefetching(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsInitialLoading(false);
    setIsRefetching(false);
    setIsEmpty(false);
    setError(null);
  }, []);

  return {
    isLoading,
    isInitialLoading,
    isRefetching,
    isEmpty,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
  };
}

/**
 * Hook for managing mutation loading states
 */
export function useMutationLoadingState() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startMutation = useCallback(() => {
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  const completeMutation = useCallback((success = true, err?: Error) => {
    setIsPending(false);
    setIsSuccess(success);
    setIsError(!success);
    setError(err || null);
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    startMutation,
    completeMutation,
    reset,
  };
}

/**
 * Hook for error handling with toast notifications
 */
export function useErrorHandling() {
  const handleError = useCallback(
    (error: Error | unknown, context?: string) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const displayMessage = context
        ? `${context}: ${errorMessage}`
        : errorMessage;

      toast.error(displayMessage);

      // Log error for debugging
      console.error('Error occurred:', {
        error,
        context,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
}

/**
 * Hook for retry logic with exponential backoff
 */
export function useRetryLogic(maxRetries = 3) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const shouldRetry = useCallback(
    (error: Error) => {
      // Don't retry client errors (4xx)
      if (error.message.includes('40')) return false;

      return retryCount < maxRetries;
    },
    [retryCount, maxRetries]
  );

  const calculateDelay = useCallback((attemptIndex: number) => {
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  }, []);

  const retry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (!shouldRetry(new Error())) {
        throw new Error('Max retries exceeded');
      }

      setIsRetrying(true);
      const delay = calculateDelay(retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        const result = await fn();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        setRetryCount((prev) => prev + 1);
        setIsRetrying(false);
        throw error;
      }
    },
    [retryCount, shouldRetry, calculateDelay]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retryCount,
    isRetrying,
    shouldRetry,
    retry,
    reset,
    canRetry: retryCount < maxRetries,
  };
}

/**
 * Hook for managing loading states across multiple operations
 */
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const getLoadingState = useCallback(
    (key: string) => loadingStates[key] || false,
    [loadingStates]
  );

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
    getLoadingState,
    clearAll,
  };
}

/**
 * Hook for managing async operations with comprehensive error handling
 */
export function useAsyncOperation<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  options?: {
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    retries?: number;
    showToast?: boolean;
  }
) {
  const [state, setState] = useState<{
    isLoading: boolean;
    data: R | null;
    error: Error | null;
  }>({
    isLoading: false,
    data: null,
    error: null,
  });

  const { handleError, handleSuccess } = useErrorHandling();
  const {
    retry,
    shouldRetry,
    reset: resetRetry,
  } = useRetryLogic(options?.retries);

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await operation(...args);

        setState({
          isLoading: false,
          data: result,
          error: null,
        });

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        resetRetry();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        setState({
          isLoading: false,
          data: null,
          error: err,
        });

        if (shouldRetry(err)) {
          try {
            return await retry(() => operation(...args));
          } catch (retryError) {
            const finalError =
              retryError instanceof Error
                ? retryError
                : new Error(String(retryError));

            if (options?.showToast !== false) {
              handleError(finalError);
            }

            if (options?.onError) {
              options.onError(finalError);
            }
          }
        } else {
          if (options?.showToast !== false) {
            handleError(err);
          }

          if (options?.onError) {
            options.onError(err);
          }
        }

        return undefined;
      }
    },
    [operation, options, handleError, shouldRetry, retry, resetRetry]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
    });
    resetRetry();
  }, [resetRetry]);

  return {
    ...state,
    execute,
    reset,
  };
}
