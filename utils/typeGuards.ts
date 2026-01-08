/**
 * TypeScript Type Guards
 *
 * Runtime type validation utilities to ensure data integrity
 * and provide type safety when working with external data sources.
 */

import type { Token, Trade, Comment, Order, PriceAlert, User, Holding } from '../types';

/**
 * Check if data is a valid Token
 * @param data - Unknown data to validate
 * @returns True if data matches Token structure
 */
export function isValidToken(data: unknown): data is Token {
  if (typeof data !== 'object' || data === null) return false;

  const token = data as Record<string, unknown>;

  return (
    typeof token.id === 'string' &&
    typeof token.name === 'string' &&
    typeof token.ticker === 'string' &&
    typeof token.price === 'number' &&
    typeof token.marketCap === 'number' &&
    typeof token.supply === 'number' &&
    typeof token.contractAddress === 'string' &&
    typeof token.progress === 'number' &&
    typeof token.volume === 'number' &&
    typeof token.virtualLiquidity === 'number' &&
    (typeof token.imageUrl === 'string' || token.imageUrl === undefined) &&
    (typeof token.description === 'string' || token.description === undefined) &&
    (typeof token.website === 'string' || token.website === undefined) &&
    (typeof token.twitter === 'string' || token.twitter === undefined) &&
    (typeof token.telegram === 'string' || token.telegram === undefined) &&
    (typeof token.discord === 'string' || token.discord === undefined) &&
    typeof token.creator === 'string' &&
    (typeof token.isLive === 'boolean' || token.isLive === undefined) &&
    (typeof token.delisted === 'boolean' || token.delisted === undefined) &&
    (typeof token.streamViewers === 'number' || token.streamViewers === undefined) &&
    (typeof token.boosts === 'number' || token.boosts === undefined)
  );
}

/**
 * Check if data is a valid Trade
 * @param data - Unknown data to validate
 * @returns True if data matches Trade structure
 */
export function isValidTrade(data: unknown): data is Trade {
  if (typeof data !== 'object' || data === null) return false;

  const trade = data as Record<string, unknown>;

  return (
    typeof trade.id === 'string' &&
    typeof trade.type === 'string' &&
    ['buy', 'sell', 'burn'].includes(trade.type) &&
    typeof trade.amountDC === 'number' &&
    typeof trade.amountToken === 'number' &&
    typeof trade.price === 'number' &&
    typeof trade.timestamp === 'number' &&
    typeof trade.tokenId === 'string' &&
    (typeof trade.user === 'string' || trade.user === undefined) &&
    (typeof trade.txHash === 'string' || trade.txHash === undefined) &&
    (typeof trade.blockNumber === 'number' || trade.blockNumber === undefined) &&
    (typeof trade.gasUsed === 'number' || trade.gasUsed === undefined)
  );
}

/**
 * Check if data is a valid Comment
 * @param data - Unknown data to validate
 * @returns True if data matches Comment structure
 */
export function isValidComment(data: unknown): data is Comment {
  if (typeof data !== 'object' || data === null) return false;

  const comment = data as Record<string, unknown>;

  return (
    typeof comment.id === 'string' &&
    typeof comment.tokenId === 'string' &&
    typeof comment.text === 'string' &&
    typeof comment.timestamp === 'number' &&
    typeof comment.author === 'string' &&
    (typeof comment.likes === 'number' || comment.likes === undefined) &&
    (typeof comment.likedBy === 'object' || comment.likedBy === undefined) &&
    (typeof comment.imageUrl === 'string' || comment.imageUrl === undefined) &&
    (typeof comment.replyTo === 'string' || comment.replyTo === undefined)
  );
}

/**
 * Check if data is a valid Order
 * @param data - Unknown data to validate
 * @returns True if data matches Order structure
 */
export function isValidOrder(data: unknown): data is Order {
  if (typeof data !== 'object' || data === null) return false;

  const order = data as Record<string, unknown>;

  return (
    typeof order.id === 'string' &&
    typeof order.tokenId === 'string' &&
    typeof order.type === 'string' &&
    ['buy', 'sell'].includes(order.type) &&
    typeof order.amount === 'number' &&
    typeof order.price === 'number' &&
    (typeof order.filled === 'number' || order.filled === undefined) &&
    (typeof order.status === 'string' || order.status === undefined) &&
    typeof order.timestamp === 'number'
  );
}

/**
 * Check if data is a valid PriceAlert
 * @param data - Unknown data to validate
 * @returns True if data matches PriceAlert structure
 */
export function isValidPriceAlert(data: unknown): data is PriceAlert {
  if (typeof data !== 'object' || data === null) return false;

  const alert = data as Record<string, unknown>;

  return (
    typeof alert.id === 'string' &&
    typeof alert.tokenId === 'string' &&
    typeof alert.price === 'number' &&
    typeof alert.condition === 'string' &&
    ['above', 'below'].includes(alert.condition)
  );
}

/**
 * Check if data is a valid User
 * @param data - Unknown data to validate
 * @returns True if data matches User structure
 */
export function isValidUser(data: unknown): data is User {
  if (typeof data !== 'object' || data === null) return false;

  const user = data as Record<string, unknown>;

  return (
    typeof user.address === 'string' &&
    typeof user.username === 'string' &&
    (typeof user.avatar === 'string' || user.avatar === undefined) &&
    (typeof user.bio === 'string' || user.bio === undefined) &&
    (typeof user.twitter === 'string' || user.twitter === undefined) &&
    (typeof user.createdAt === 'number' || user.createdAt === undefined)
  );
}

/**
 * Check if data is a valid Holding
 * @param data - Unknown data to validate
 * @returns True if data matches Holding structure
 */
export function isValidHolding(data: unknown): data is Holding {
  if (typeof data !== 'object' || data === null) return false;

  const holding = data as Record<string, unknown>;

  return (
    typeof holding.tokenId === 'string' &&
    typeof holding.balance === 'number'
  );
}

/**
 * Assert that data is a valid Token
 * @throws Error if data is not a valid Token
 * @param data - Data to validate
 */
export function assertValidToken(data: unknown): asserts data is Token {
  if (!isValidToken(data)) {
    throw new Error('Invalid token data');
  }
}

/**
 * Assert that data is a valid Trade
 * @throws Error if data is not a valid Trade
 * @param data - Data to validate
 */
export function assertValidTrade(data: unknown): asserts data is Trade {
  if (!isValidTrade(data)) {
    throw new Error('Invalid trade data');
  }
}

/**
 * Assert that data is a valid Comment
 * @throws Error if data is not a valid Comment
 * @param data - Data to validate
 */
export function assertValidComment(data: unknown): asserts data is Comment {
  if (!isValidComment(data)) {
    throw new Error('Invalid comment data');
  }
}

/**
 * Assert that data is a valid Order
 * @throws Error if data is not a valid Order
 * @param data - Data to validate
 */
export function assertValidOrder(data: unknown): asserts data is Order {
  if (!isValidOrder(data)) {
    throw new Error('Invalid order data');
  }
}

/**
 * Validate an array of items
 * @param items - Array of unknown items
 * @param validator - Type guard function
 * @returns True if all items are valid
 */
export function isValidArray<T>(
  items: unknown[],
  validator: (item: unknown) => item is T
): items is T[] {
  return items.every(validator);
}

/**
 * Filter valid items from an array
 * @param items - Array of unknown items
 * @param validator - Type guard function
 * @returns Array of only valid items
 */
export function filterValidItems<T>(
  items: unknown[],
  validator: (item: unknown) => item is T
): T[] {
  return items.filter(validator) as T[];
}

/**
 * Parse and validate JSON data
 * @param json - JSON string to parse
 * @param validator - Type guard function
 * @returns Parsed and validated data
 * @throws Error if JSON is invalid or doesn't match type
 */
export function parseJsonSafe<T>(
  json: string,
  validator: (data: unknown) => data is T
): T {
  try {
    const data = JSON.parse(json);

    if (!validator(data)) {
      throw new Error('Parsed data does not match expected type');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON');
    }
    throw error;
  }
}

/**
 * Validate API response data
 * @param response - Fetch response object
 * @param validator - Type guard function
 * @returns Validated data
 * @throws Error if response is not OK or data is invalid
 */
export async function validateApiResponse<T>(
  response: Response,
  validator: (data: unknown) => data is T
): Promise<T> {
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!validator(data)) {
    throw new Error('Invalid API response data');
  }

  return data;
}

/**
 * Check if a string is a valid Ethereum address
 * @param address - Address string to validate
 * @returns True if valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if a string is a valid URL
 * @param url - URL string to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol as any);
  } catch {
    return false;
  }
}

/**
 * Check if a number is a valid price
 * @param price - Price to validate
 * @returns True if price is valid (positive number)
 */
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && Number.isFinite(price);
}

/**
 * Check if a string is a valid token ticker
 * @param ticker - Ticker string to validate
 * @returns True if valid ticker (1-10 uppercase letters)
 */
export function isValidTicker(ticker: string): boolean {
  return /^[A-Z]{1,10}$/.test(ticker);
}
