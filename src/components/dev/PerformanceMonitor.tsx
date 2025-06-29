import React, { useState, useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import {
  getPerformanceRating,
  PERFORMANCE_THRESHOLDS,
} from '@/utils/performance';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface MetricData {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceMetrics {
  cls: MetricData | null;
  inp: MetricData | null;
  fcp: MetricData | null;
  lcp: MetricData | null;
  ttfb: MetricData | null;
}

const PerformanceMonitor: React.FC = () => {
  const { user } = useAuthContext();
  // Only allow Super Admins
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    inp: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.DEV) {
      // Initialize Web Vitals monitoring
      onCLS((metric) => {
        setMetrics((prev) => ({
          ...prev,
          cls: {
            value: metric.value,
            rating: getPerformanceRating('CLS', metric.value),
            timestamp: Date.now(),
          },
        }));
      });

      onINP((metric) => {
        setMetrics((prev) => ({
          ...prev,
          inp: {
            value: metric.value,
            rating: getPerformanceRating('INP', metric.value),
            timestamp: Date.now(),
          },
        }));
      });

      onFCP((metric) => {
        setMetrics((prev) => ({
          ...prev,
          fcp: {
            value: metric.value,
            rating: getPerformanceRating('FCP', metric.value),
            timestamp: Date.now(),
          },
        }));
      });

      onLCP((metric) => {
        setMetrics((prev) => ({
          ...prev,
          lcp: {
            value: metric.value,
            rating: getPerformanceRating('LCP', metric.value),
            timestamp: Date.now(),
          },
        }));
      });

      onTTFB((metric) => {
        setMetrics((prev) => ({
          ...prev,
          ttfb: {
            value: metric.value,
            rating: getPerformanceRating('TTFB', metric.value),
            timestamp: Date.now(),
          },
        }));
      });
    }
  }, []);

  // Don't render in production
  if (import.meta.env.PROD) {
    return null;
  }

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (metric: string, value: number) => {
    if (metric === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const getThresholds = (metric: keyof typeof PERFORMANCE_THRESHOLDS) => {
    const thresholds = PERFORMANCE_THRESHOLDS[metric];
    return `Good: ≤${thresholds.good}${metric === 'CLS' ? '' : 'ms'}, Poor: >${
      thresholds.poor
    }${metric === 'CLS' ? '' : 'ms'}`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className='fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors'
        title='Show Performance Monitor'
      >
        📊
      </button>
    );
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='text-sm font-semibold text-gray-900'>
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className='text-gray-400 hover:text-gray-600 text-lg leading-none'
          title='Hide Performance Monitor'
        >
          ×
        </button>
      </div>

      <div className='space-y-2'>
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className='text-xs'>
            <div className='flex justify-between items-center mb-1'>
              <span className='font-medium text-gray-700 uppercase'>{key}</span>
              {metric && (
                <span
                  className={`px-2 py-1 rounded border text-xs font-medium ${getRatingColor(
                    metric.rating
                  )}`}
                >
                  {formatValue(key, metric.value)}
                </span>
              )}
            </div>
            <div className='text-gray-500 text-xs'>
              {getThresholds(
                key.toUpperCase() as keyof typeof PERFORMANCE_THRESHOLDS
              )}
            </div>
            {!metric && (
              <div className='text-gray-400 text-xs'>Waiting for data...</div>
            )}
          </div>
        ))}
      </div>

      <div className='mt-3 pt-3 border-t border-gray-200'>
        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            <span>Good</span>
            <span className='w-2 h-2 bg-yellow-500 rounded-full ml-2'></span>
            <span>Needs Improvement</span>
            <span className='w-2 h-2 bg-red-500 rounded-full ml-2'></span>
            <span>Poor</span>
          </div>
          <div className='text-xs text-gray-400 mt-2'>
            Based on Google's Core Web Vitals thresholds
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
