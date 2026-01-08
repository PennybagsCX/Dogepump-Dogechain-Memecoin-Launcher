/**
 * Input Validation Utilities
 *
 * Provides type guards and validation functions for API responses
 * and user input to ensure data integrity and security.
 */

import { Token, Trade, Comment } from '../types';

/**
 * Type guard to check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Validate that a number is positive
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Validate that a number is within a range
 */
export function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return isNumber(value) && value >= min && value <= max;
}

/**
 * Validate token data structure
 */
export function validateToken(data: unknown): data is Token {
  if (!isObject(data)) {
    console.error('[Validation] Token data is not an object');
    return false;
  }

  const token = data as Partial<Token>;

  // Required string fields
  const requiredStrings: (keyof Token)[] = ['id', 'name', 'ticker', 'description', 'imageUrl', 'creator', 'contractAddress'];
  for (const field of requiredStrings) {
    if (!isString(token[field])) {
      console.error(`[Validation] Token missing or invalid field: ${field}`);
      return false;
    }
  }

  // Required number fields
  if (!isPositiveNumber(token.price)) {
    console.error('[Validation] Token has invalid price');
    return false;
  }

  if (!isPositiveNumber(token.marketCap)) {
    console.error('[Validation] Token has invalid marketCap');
    return false;
  }

  if (!isNumberInRange(token.progress, 0, 100)) {
    console.error('[Validation] Token has invalid progress (must be 0-100)');
    return false;
  }

  // Optional fields validation
  if (token.isLive !== undefined && typeof token.isLive !== 'boolean') {
    console.error('[Validation] Token isLive must be boolean');
    return false;
  }

  if (token.streamViewers !== undefined && !isPositiveNumber(token.streamViewers)) {
    console.error('[Validation] Token streamViewers must be positive number');
    return false;
  }

  return true;
}

/**
 * Validate trade data structure
 */
export function validateTrade(data: unknown): data is Trade {
  if (!isObject(data)) {
    console.error('[Validation] Trade data is not an object');
    return false;
  }

  const trade = data as Partial<Trade>;

  // Required string fields
  const requiredStrings: (keyof Trade)[] = ['id', 'type', 'user', 'tokenId', 'txHash'];
  for (const field of requiredStrings) {
    if (!isString(trade[field])) {
      console.error(`[Validation] Trade missing or invalid field: ${field}`);
      return false;
    }
  }

  // Validate trade type
  if (!['buy', 'sell', 'burn'].includes(trade.type!)) {
    console.error('[Validation] Trade type must be buy, sell, or burn');
    return false;
  }

  // Required number fields
  if (!isPositiveNumber(trade.price)) {
    console.error('[Validation] Trade has invalid price');
    return false;
  }

  if (!isNumber(trade.amountDC)) {
    console.error('[Validation] Trade has invalid amountDC');
    return false;
  }

  if (!isNumber(trade.amountToken)) {
    console.error('[Validation] Trade has invalid amountToken');
    return false;
  }

  return true;
}

/**
 * Validate comment data structure
 */
export function validateComment(data: unknown): data is Comment {
  if (!isObject(data)) {
    console.error('[Validation] Comment data is not an object');
    return false;
  }

  const comment = data as Partial<Comment>;

  // Required string fields
  if (!isString(comment.id) || !isString(comment.text) || !isString(comment.user)) {
    console.error('[Validation] Comment missing required string fields');
    return false;
  }

  // Content length validation
  if (comment.text.length > 1000) {
    console.error('[Validation] Comment content too long (max 1000 chars)');
    return false;
  }

  return true;
}

/**
 * Validate price data from oracle
 */
export function validatePrice(price: unknown): price is number {
  if (!isNumber(price)) {
    console.error('[Validation] Price is not a valid number');
    return false;
  }

  if (price <= 0) {
    console.error('[Validation] Price must be positive');
    return false;
  }

  // Reasonable range for DC: $0.000001 to $10
  if (price < 0.000001 || price > 10) {
    console.warn(`[Validation] Price outside reasonable range: $${price}`);
    return false;
  }

  return true;
}

/**
 * Sanitize and validate API response
 * @throws Error if validation fails
 */
export function sanitizeAPIResponse<T>(data: unknown, validator: (d: unknown) => d is T, context: string): T {
  if (!validator(data)) {
    throw new Error(`Invalid API response for ${context}`);
  }
  return data;
}

/**
 * Validate array of items
 */
export function validateArray<T>(data: unknown, validator: (item: unknown) => item is T): data is T[] {
  if (!Array.isArray(data)) {
    console.error('[Validation] Data is not an array');
    return false;
  }

  // Validate each item
  for (let i = 0; i < data.length; i++) {
    if (!validator(data[i])) {
      console.error(`[Validation] Array item at index ${i} is invalid`);
      return false;
    }
  }

  return true;
}

/**
 * Validate and sanitize user input string
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (!isString(input)) {
    throw new Error('Input must be a string');
  }

  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength}`);
  }

  // Remove any potentially dangerous HTML (basic sanitization)
  // For production, consider using a library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: unknown): address is string {
  if (!isString(address)) {
    return false;
  }

  // Basic Ethereum/Dogechain address format: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

/**
 * Validate URL format
 */
export function isValidURL(url: unknown): url is string {
  if (!isString(url)) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate token ID format
 */
export function isValidTokenId(tokenId: unknown): tokenId is string {
  if (!isString(tokenId)) {
    return false;
  }

  // Token IDs should be: token-{number}
  const tokenIdRegex = /^token-\d+$/;
  return tokenIdRegex.test(tokenId);
}

/**
 * Safe JSON parse with validation
 */
export function safeJSONParse<T>(json: string, validator: (data: unknown) => data is T): T | null {
  try {
    const data = JSON.parse(json);
    return validator(data) ? data : null;
  } catch (error) {
    console.error('[Validation] Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Batch validate multiple items
 */
export function validateBatch<T>(items: unknown[], validator: (item: unknown) => item is T): { valid: T[]; invalid: number } {
  const valid: T[] = [];
  let invalid = 0;

  for (const item of items) {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid++;
    }
  }

  return { valid, invalid };
}
