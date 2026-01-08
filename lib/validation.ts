/**
 * Data Validation Utilities
 *
 * Provides validation functions for user inputs, particularly file uploads.
 * All file uploads must be validated both client-side and server-side.
 */

import type { Trade, Token } from '../types';

// File upload constraints
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSIONS = { width: 4096, height: 4096 };
const MIN_IMAGE_DIMENSIONS = { width: 32, height: 32 };

/**
 * Result of file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an image file upload
 * Checks file type, size, and dimensions
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * const file = event.target.files[0];
 * const validation = await validateImageUpload(file);
 * if (!validation.valid) {
 *   showToast('error', validation.error);
 *   return;
 * }
 */
export async function validateImageUpload(file: File): Promise<ValidationResult> {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file selected',
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Only JPG, PNG, GIF, WebP, and SVG allowed. Received: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is 5MB.`,
    };
  }

  // For SVG files, skip dimension check (vector graphics)
  if (file.type === 'image/svg+xml') {
    return { valid: true };
  }

  // Check dimensions for raster images
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width < MIN_IMAGE_DIMENSIONS.width || dimensions.height < MIN_IMAGE_DIMENSIONS.height) {
      return {
        valid: false,
        error: `Image too small. Minimum dimensions are ${MIN_IMAGE_DIMENSIONS.width}x${MIN_IMAGE_DIMENSIONS.height}px.`,
      };
    }

    if (dimensions.width > MAX_IMAGE_DIMENSIONS.width || dimensions.height > MAX_IMAGE_DIMENSIONS.height) {
      return {
        valid: false,
        error: `Image too large. Maximum dimensions are ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height}px.`,
      };
    }

    // Additional check: detect extremely wide or tall images that might be banners/spam
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      return {
        valid: false,
        error: 'Image aspect ratio too extreme. Please use a more square image.',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image. Please try a different file.',
    };
  }
}

/**
 * Get image dimensions from a file
 *
 * @param file - Image file to measure
 * @returns Promise resolving to width and height
 * @throws Error if image cannot be loaded
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension check'));
    };

    img.src = url;
  });
}

/**
 * Validate token data structure
 * Ensures token object has all required fields with valid values
 *
 * @param data - Unknown data to validate as token
 * @returns true if valid token, false otherwise
 */
export function isValidToken(data: unknown): data is Token {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const token = data as Record<string, unknown>;

  return (
    typeof token.id === 'string' &&
    token.id.length > 0 &&
    typeof token.name === 'string' &&
    token.name.length > 0 &&
    token.name.length <= 100 &&
    typeof token.ticker === 'string' &&
    token.ticker.length > 0 &&
    token.ticker.length <= 20 &&
    typeof token.price === 'number' &&
    token.price >= 0 &&
    !isNaN(token.price) &&
    typeof token.marketCap === 'number' &&
    token.marketCap >= 0 &&
    !isNaN(token.marketCap) &&
    typeof token.supply === 'number' &&
    token.supply > 0 &&
    !isNaN(token.supply) &&
    typeof token.contractAddress === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(token.contractAddress)
  );
}

/**
 * Validate trade data structure
 *
 * @param data - Unknown data to validate as trade
 * @returns true if valid trade, false otherwise
 */
export function isValidTrade(data: unknown): data is Trade {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const trade = data as Record<string, unknown>;

  return (
    typeof trade.id === 'string' &&
    trade.id.length > 0 &&
    typeof trade.type === 'string' &&
    ['buy', 'sell', 'burn'].includes(trade.type) &&
    typeof trade.amountDC === 'number' &&
    trade.amountDC > 0 &&
    !isNaN(trade.amountDC) &&
    typeof trade.amountToken === 'number' &&
    trade.amountToken > 0 &&
    !isNaN(trade.amountToken) &&
    typeof trade.price === 'number' &&
    trade.price > 0 &&
    !isNaN(trade.price) &&
    typeof trade.timestamp === 'number' &&
    trade.timestamp > 0 &&
    typeof trade.txHash === 'string' &&
    /^0x[a-fA-F0-9]{64}$/.test(trade.txHash) &&
    typeof trade.tokenId === 'string' &&
    trade.tokenId.length > 0
  );
}

/**
 * Validate comment text length
 *
 * @param text - Comment text to validate
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns true if valid length, false otherwise
 */
export function isValidCommentLength(text: string, maxLength: number = 5000): boolean {
  return text.length <= maxLength && text.length > 0;
}

/**
 * Validate username
 *
 * @param username - Username to validate
 * @returns true if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  // Username: 3-30 characters, alphanumeric plus underscores and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate token name
 *
 * @param name - Token name to validate
 * @returns true if valid, false otherwise
 */
export function isValidTokenName(name: string): boolean {
  return name.length > 0 && name.length <= 100;
}

/**
 * Validate token ticker/symbol
 *
 * @param ticker - Token ticker to validate
 * @returns true if valid, false otherwise
 */
export function isValidTokenTicker(ticker: string): boolean {
  // Ticker: 1-20 characters, uppercase letters, numbers, and underscores only
  const tickerRegex = /^[A-Z0-9_]{1,20}$/;
  return tickerRegex.test(ticker);
}

/**
 * Validate number is within range
 *
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if value is within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Validate positive number
 *
 * @param value - Number to validate
 * @returns true if positive number, false otherwise
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validate non-negative number
 *
 * @param value - Number to validate
 * @returns true if non-negative, false otherwise
 */
export function isNonNegativeNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}
