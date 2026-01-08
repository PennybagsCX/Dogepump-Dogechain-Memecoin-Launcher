import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  fallback?: string;
  enableWebP?: boolean;
}

/**
 * Optimized image component with WebP support, srcset, and graceful fallbacks
 * Features:
 * - WebP format with automatic fallback
 * - Responsive srcset for different screen sizes
 * - Blur-up placeholder effect
 * - Error handling with fallback image
 * - Lazy loading by default
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fallback = '/images/default-token.svg',
  enableWebP = true,
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Generate srcset with different sizes and quality
  const generateSrcSet = (baseSrc: string, format: 'webp' | 'jpg' | 'png' = 'jpg') => {
    const sizes = [320, 640, 960, 1280, 1920];
    const quality = format === 'webp' ? 85 : 80;
    return sizes
      .map(size => {
        // Add format parameter to URL
        const separator = baseSrc.includes('?') ? '&' : '?';
        return `${baseSrc}${separator}w=${size}&q=${quality}&f=${format} ${size}w`;
      })
      .join(', ');
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // If WebP is enabled, use picture element with fallback
  if (enableWebP && !hasError) {
    return (
      <picture className={className}>
        <source srcSet={generateSrcSet(imageSrc, 'webp')} type="image/webp" />
        <source srcSet={generateSrcSet(imageSrc, 'jpg')} type="image/jpeg" />
        <source srcSet={generateSrcSet(imageSrc, 'png')} type="image/png" />
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-all duration-300 ${
            isLoaded ? 'opacity-100 blur-0' : 'opacity-50 blur-xl'
          } ${className}`}
          loading={loading}
          fetchPriority={fetchPriority}
          sizes={sizes}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>
    );
  }

  // Fallback to simple img element
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      srcSet={hasError ? undefined : generateSrcSet(imageSrc)}
      alt={alt}
      width={width}
      height={height}
      className={`transition-all duration-300 ${
        isLoaded ? 'opacity-100 blur-0' : 'opacity-50 blur-xl'
      } ${className}`}
      loading={loading}
      fetchPriority={fetchPriority}
      sizes={sizes}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
