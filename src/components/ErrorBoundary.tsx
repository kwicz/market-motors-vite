import React from 'react';
import * as Sentry from '@sentry/react';

// Default error fallback component
const DefaultErrorFallback = ({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) => (
  <div className='min-h-screen flex items-center justify-center bg-gray-50'>
    <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
      <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full'>
        <svg
          className='w-6 h-6 text-red-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
          />
        </svg>
      </div>
      <div className='mt-4 text-center'>
        <h3 className='text-lg font-medium text-gray-900'>
          Something went wrong
        </h3>
        <p className='mt-2 text-sm text-gray-500'>
          We've been notified about this error and will fix it soon.
        </p>
        {import.meta.env.DEV && (
          <details className='mt-4 text-left'>
            <summary className='cursor-pointer text-sm font-medium text-gray-700'>
              Error Details (Development)
            </summary>
            <pre className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto'>
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={resetError}
          className='mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Error boundary component using Sentry
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// HOC for wrapping components with error boundaries
export const withSentryErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    beforeCapture?: (scope: Sentry.Scope, error: Error) => void;
  }
) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: options?.fallback || DefaultErrorFallback,
    beforeCapture: options?.beforeCapture,
  });
};

export default DefaultErrorFallback;
