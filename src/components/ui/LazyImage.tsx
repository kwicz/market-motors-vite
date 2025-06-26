import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  errorClassName?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  showPlaceholder?: boolean;
  placeholderSrc?: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholderClassName,
  errorClassName,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  showPlaceholder = true,
  placeholderSrc,
  sizes,
  srcSet,
  loading = 'lazy',
  priority = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer setup
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, priority, loading]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    onError?.();
  }, [onError]);

  // Preload image when it comes into view
  useEffect(() => {
    if (isInView && !isLoaded && !isError) {
      const img = new Image();
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = src;
      if (srcSet) img.srcset = srcSet;
      if (sizes) img.sizes = sizes;
    }
  }, [
    isInView,
    isLoaded,
    isError,
    src,
    srcSet,
    sizes,
    handleLoad,
    handleError,
  ]);

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Placeholder */}
      {showPlaceholder && !isLoaded && !isError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            placeholderClassName
          )}
        >
          {placeholderSrc && (
            <img
              src={placeholderSrc}
              alt=''
              className='w-full h-full object-cover opacity-50'
              loading='eager'
            />
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center',
            errorClassName
          )}
        >
          <div className='text-center text-gray-500'>
            <svg
              className='w-8 h-8 mx-auto mb-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <p className='text-sm'>Failed to load image</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = () => {
  const preloadImage = useCallback(
    (src: string, srcSet?: string, sizes?: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
        if (srcSet) img.srcset = srcSet;
        if (sizes) img.sizes = sizes;
      });
    },
    []
  );

  const preloadImages = useCallback(
    async (images: Array<{ src: string; srcSet?: string; sizes?: string }>) => {
      try {
        await Promise.all(
          images.map((img) => preloadImage(img.src, img.srcSet, img.sizes))
        );
      } catch (error) {
        console.warn('Failed to preload some images:', error);
      }
    },
    [preloadImage]
  );

  return { preloadImage, preloadImages };
};

export default LazyImage;
