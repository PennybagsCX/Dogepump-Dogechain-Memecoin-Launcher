import { ImageFormat } from '../types/index.js';

/**
 * MIME type to format mapping
 */
const MIME_TYPE_MAP: Record<string, ImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Format to MIME type mapping
 */
const FORMAT_MIME_MAP: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

/**
 * Format to file extension mapping
 */
const FORMAT_EXTENSION_MAP: Record<ImageFormat, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
  avif: '.avif',
};

/**
 * Get image format from MIME type
 */
export function getFormatFromMimeType(mimeType: string): ImageFormat | null {
  const normalizedMime = mimeType.toLowerCase();
  return MIME_TYPE_MAP[normalizedMime] || null;
}

/**
 * Get MIME type from image format
 */
export function getMimeTypeFromFormat(format: ImageFormat): string {
  return FORMAT_MIME_MAP[format];
}

/**
 * Get file extension from image format
 */
export function getExtensionFromFormat(format: ImageFormat): string {
  return FORMAT_EXTENSION_MAP[format];
}

/**
 * Get format from file extension
 */
export function getFormatFromExtension(filename: string): ImageFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;

  const extMap: Record<string, ImageFormat> = {
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'png': 'png',
    'webp': 'webp',
    'avif': 'avif',
  };

  return extMap[ext] || null;
}

/**
 * Validate if format is supported
 */
export function isSupportedFormat(format: string): format is ImageFormat {
  return ['jpeg', 'png', 'webp', 'avif'].includes(format);
}

/**
 * Validate MIME type
 */
export function isValidMimeType(mimeType: string): boolean {
  return mimeType.toLowerCase() in MIME_TYPE_MAP;
}

/**
 * Get all supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return Object.keys(MIME_TYPE_MAP);
}

/**
 * Get all supported formats
 */
export function getSupportedFormats(): ImageFormat[] {
  return Object.values(MIME_TYPE_MAP) as ImageFormat[];
}

/**
 * Generate filename with format
 */
export function generateFilename(
  baseName: string,
  format: ImageFormat,
  suffix?: string
): string {
  const ext = getExtensionFromFormat(format);
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const suffixStr = suffix ? `_${suffix}` : '';
  return `${sanitized}${suffixStr}${ext}`;
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) return 0;
  return width / height;
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'cover'
): { width: number; height: number } {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);

  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  if (fit === 'fill') {
    return {
      width: targetWidth || originalWidth,
      height: targetHeight || originalHeight,
    };
  }

  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * Validate image dimensions
 */
export function validateDimensions(
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number
): { valid: boolean; error?: string } {
  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}`,
    };
  }

  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      error: `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Parse quality value (ensure it's between 0 and 100)
 */
export function parseQuality(quality?: number): number {
  if (quality === undefined || quality === null) return 80;
  return Math.max(0, Math.min(100, quality));
}

/**
 * Get format-specific quality defaults
 */
export function getDefaultQuality(format: ImageFormat): number {
  switch (format) {
    case 'jpeg':
      return 85;
    case 'webp':
      return 80;
    case 'avif':
      return 75;
    case 'png':
      return 90;
    default:
      return 80;
  }
}

/**
 * Check if format supports transparency
 */
export function supportsTransparency(format: ImageFormat): boolean {
  return ['png', 'webp', 'avif'].includes(format);
}

/**
 * Get optimal format for web (prioritizes WebP or AVIF)
 */
export function getOptimalWebFormat(supportedFormats: ImageFormat[] = ['webp', 'avif', 'jpeg']): ImageFormat {
  // Priority: AVIF > WebP > JPEG
  if (supportedFormats.includes('avif')) return 'avif';
  if (supportedFormats.includes('webp')) return 'webp';
  if (supportedFormats.includes('jpeg')) return 'jpeg';
  return 'jpeg'; // fallback
}

/**
 * Generate color from hex string
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
