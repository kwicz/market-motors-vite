import { useEffect, useCallback, useRef } from 'react';

interface UsePerformanceOptimizationOptions {
  preloadImages?: string[];
  enableResourceHints?: boolean;
  enablePrefetch?: boolean;
}

export const usePerformanceOptimization = (
  options: UsePerformanceOptimizationOptions = {}
) => {
  const {
    preloadImages: preloadImageUrls = [],
    enableResourceHints = true,
    enablePrefetch = true,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Image preloading utility
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Batch preload images
  const preloadImages = useCallback(
    async (imageSrcs: string[]) => {
      try {
        await Promise.all(imageSrcs.map((src) => preloadImage(src)));
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    },
    [preloadImage]
  );

  // Add resource hints to document head
  const addResourceHints = useCallback(() => {
    if (!enableResourceHints) return;

    // Add DNS prefetch for external domains
    const domains = [
      '//fonts.googleapis.com',
      '//fonts.gstatic.com',
      '//images.unsplash.com',
    ];

    domains.forEach((domain) => {
      if (
        !document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)
      ) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // Add preconnect for critical resources
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectDomains.forEach((domain) => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, [enableResourceHints]);

  // Lazy loading utility with intersection observer
  const createLazyLoader = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;

            // Handle lazy loading for images
            if (target.dataset.src) {
              const img = target as HTMLImageElement;
              img.src = target.dataset.src;
              img.classList.remove('lazy');
              img.classList.add('lazy-loaded');
              observerRef.current?.unobserve(target);
            }

            // Handle lazy loading for background images
            if (target.dataset.bgSrc) {
              target.style.backgroundImage = `url(${target.dataset.bgSrc})`;
              target.classList.remove('lazy-bg');
              target.classList.add('lazy-bg-loaded');
              observerRef.current?.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    return observerRef.current;
  }, []);

  // Observe element for lazy loading
  const observeElement = useCallback((element: HTMLElement) => {
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  // Prefetch route resources
  const prefetchRoute = useCallback(
    (route: string) => {
      if (!enablePrefetch) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    },
    [enablePrefetch]
  );

  // Critical resource loading
  const loadCriticalResources = useCallback(async () => {
    // Preload critical images
    if (preloadImageUrls.length > 0) {
      await preloadImages(preloadImageUrls);
    }

    // Add resource hints
    addResourceHints();
  }, [preloadImageUrls, preloadImages, addResourceHints]);

  // Performance measurement utilities
  const measurePerformance = useCallback(
    (name: string, fn: () => void | Promise<void>) => {
      const startTime = performance.now();

      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now();
          console.log(`${name} took ${endTime - startTime} milliseconds`);
        });
      } else {
        const endTime = performance.now();
        console.log(`${name} took ${endTime - startTime} milliseconds`);
        return result;
      }
    },
    []
  );

  // Debounce utility for performance optimization
  const debounce = useCallback(
    <T extends (...args: unknown[]) => unknown>(
      func: T,
      wait: number
    ): ((...args: Parameters<T>) => void) => {
      let timeout: NodeJS.Timeout;

      return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },
    []
  );

  // Throttle utility for performance optimization
  const throttle = useCallback(
    <T extends (...args: unknown[]) => unknown>(
      func: T,
      limit: number
    ): ((...args: Parameters<T>) => void) => {
      let inThrottle: boolean;

      return (...args: Parameters<T>) => {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },
    []
  );

  // Initialize performance optimizations
  useEffect(() => {
    loadCriticalResources();
    createLazyLoader();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadCriticalResources, createLazyLoader]);

  return {
    preloadImage,
    preloadImages,
    observeElement,
    prefetchRoute,
    measurePerformance,
    debounce,
    throttle,
    lazyLoader: observerRef.current,
  };
};
