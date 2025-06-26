import React from 'react';
import { LazyImage } from './LazyImage';
import { cn } from '@/lib/utils';

interface ImageSize {
  width: number;
  height: number;
  quality?: number;
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  errorClassName?: string;
  sizes?: ImageSize[];
  aspectRatio?: 'auto' | 'square' | '16/9' | '4/3' | '3/2';
  priority?: boolean;
  quality?: number;
  format?: 'auto' | 'jpeg' | 'webp' | 'png';
  blur?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

// Utility function to generate srcSet from base URL
const generateSrcSet = (
  baseUrl: string,
  sizes: ImageSize[],
  format: string = 'jpeg'
): string => {
  return sizes
    .map(({ width, height, quality = 85 }) => {
      // For data URLs (base64 images), return as-is
      if (baseUrl.startsWith('data:')) {
        return `${baseUrl} ${width}w`;
      }

      // For regular URLs, we would typically have different sized versions
      // Since we're using base64 images from the server, we'll return the same image
      // In a real implementation, you'd have multiple sizes generated server-side
      return `${baseUrl} ${width}w`;
    })
    .join(', ');
};

// Utility function to generate sizes attribute
const generateSizes = (sizes: ImageSize[]): string => {
  if (sizes.length === 1) return `${sizes[0].width}px`;

  return sizes
    .map((size, index) => {
      if (index === sizes.length - 1) {
        return `${size.width}px`;
      }
      return `(max-width: ${size.width}px) ${size.width}px`;
    })
    .join(', ');
};

// Detect WebP support
const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  placeholderClassName,
  errorClassName,
  sizes = [{ width: 800, height: 600 }],
  aspectRatio = 'auto',
  priority = false,
  quality = 85,
  format = 'auto',
  blur = false,
  onLoad,
  onError,
  threshold,
  rootMargin,
}) => {
  // Determine optimal format
  const optimalFormat = React.useMemo(() => {
    if (format !== 'auto') return format;
    return supportsWebP() ? 'webp' : 'jpeg';
  }, [format]);

  // Generate responsive image attributes
  const { srcSet, sizesAttr } = React.useMemo(() => {
    const srcSet = generateSrcSet(src, sizes, optimalFormat);
    const sizesAttr = generateSizes(sizes);

    return { srcSet, sizesAttr };
  }, [src, sizes, optimalFormat]);

  // Aspect ratio classes
  const aspectRatioClass = React.useMemo(() => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '16/9':
        return 'aspect-video';
      case '4/3':
        return 'aspect-[4/3]';
      case '3/2':
        return 'aspect-[3/2]';
      default:
        return '';
    }
  }, [aspectRatio]);

  return (
    <LazyImage
      src={src}
      alt={alt}
      srcSet={srcSet}
      sizes={sizesAttr}
      className={cn(
        aspectRatioClass,
        blur && 'blur-sm hover:blur-none transition-all duration-300',
        className
      )}
      placeholderClassName={placeholderClassName}
      errorClassName={errorClassName}
      priority={priority}
      onLoad={onLoad}
      onError={onError}
      threshold={threshold}
      rootMargin={rootMargin}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
};

// Specialized components for common use cases
export const CarThumbnail: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, priority = false, onLoad, onError }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    className={className}
    aspectRatio='16/9'
    sizes={[
      { width: 300, height: 200, quality: 80 },
      { width: 600, height: 400, quality: 85 },
      { width: 800, height: 533, quality: 90 },
    ]}
    priority={priority}
    onLoad={onLoad}
    onError={onError}
  />
);

export const CarDetailImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, priority = false, onLoad, onError }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    className={className}
    aspectRatio='16/9'
    sizes={[
      { width: 800, height: 533, quality: 85 },
      { width: 1200, height: 800, quality: 90 },
      { width: 1600, height: 1067, quality: 95 },
    ]}
    priority={priority}
    onLoad={onLoad}
    onError={onError}
  />
);

export const HeroImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, priority = true, onLoad, onError }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    className={className}
    sizes={[
      { width: 1200, height: 800, quality: 90 },
      { width: 1600, height: 1067, quality: 95 },
      { width: 1920, height: 1280, quality: 95 },
    ]}
    priority={priority}
    format='webp'
    onLoad={onLoad}
    onError={onError}
  />
);

export default OptimizedImage;
