import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startPerformanceMonitoring } from './utils/performance';
import { initSentry } from './utils/sentry';
import loggerUtils from './utils/logger.client';

// Initialize error tracking and logging
initSentry();
loggerUtils.info('Application starting', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
});

// Start performance monitoring
startPerformanceMonitoring();

// Log application startup
loggerUtils.performance('Application Startup', performance.now(), {
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
