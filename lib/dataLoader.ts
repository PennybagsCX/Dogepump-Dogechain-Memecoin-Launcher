/**
 * Environment-Aware Data Loading
 *
 * Provides data loading utilities that automatically use test data in development
 * when enabled, but always use real data in production.
 *
 * This ensures:
 * - Production builds NEVER use mock data
 * - Development can use test data when VITE_ENABLE_TEST_DATA=true
 * - Real data is always preferred when available
 */

import { generateTestTrades, generateTestHolders, isTestDataEnabled, logTestDataUsage } from './testData';
import type { Trade } from '../types';

/**
 * Load trades for a token
 *
 * In production: Always returns real trades
 * In development: Uses test data if enabled AND no real data available
 *
 * @param tokenId - Token ID to load trades for
 * @param realTrades - Actual trades from API/blockchain
 * @returns Trade array (real or test data)
 *
 * @example
 * const realTrades = await fetchTrades(tokenId);
 * const trades = loadTrades(tokenId, realTrades);
 */
export function loadTrades(tokenId: string, realTrades: Trade[]): Trade[] {
  // Production: Always use real data
  if (import.meta.env.PROD) {
    return realTrades;
  }

  // Development: Use test data if enabled AND no real data available
  if (isTestDataEnabled && realTrades.length === 0) {
    logTestDataUsage('loadTrades', { tokenId, count: 50 });
    return generateTestTrades(tokenId, 50);
  }

  // Otherwise use real data (even if empty)
  return realTrades;
}

/**
 * Load holder distribution for a token
 *
 * @param tokenId - Token ID to load holders for
 * @param realHolders - Actual holders from API/blockchain
 * @returns Holder array (real or test data)
 */
export function loadHolders(tokenId: string, realHolders: any[]): any[] {
  // Production: Always use real data
  if (import.meta.env.PROD) {
    return realHolders;
  }

  // Development: Use test data if enabled AND no real data available
  if (isTestDataEnabled && realHolders.length === 0) {
    logTestDataUsage('loadHolders', { tokenId, count: 20 });
    return generateTestHolders(20);
  }

  // Otherwise use real data (even if empty)
  return realHolders;
}

/**
 * Check if test data warning should be displayed
 * Only true in development with test data enabled
 *
 * @returns true if test data mode is active
 */
export function shouldShowTestDataWarning(): boolean {
  return isTestDataEnabled;
}

/**
 * Get data source description for debugging
 *
 * @param dataType - Type of data (e.g., 'trades', 'holders')
 * @param realCount - Number of real data items available
 * @returns Description of data source
 */
export function getDataSourceInfo(dataType: string, realCount: number): {
  source: 'real' | 'test' | 'empty';
  description: string;
} {
  if (realCount > 0) {
    return {
      source: 'real',
      description: `Using ${realCount} real ${dataType} from API/blockchain`,
    };
  }

  if (import.meta.env.PROD) {
    return {
      source: 'empty',
      description: `No ${dataType} available (production - no test data fallback)`,
    };
  }

  if (isTestDataEnabled) {
    return {
      source: 'test',
      description: `Using mock ${dataType} for development (VITE_ENABLE_TEST_DATA=true)`,
    };
  }

  return {
    source: 'empty',
    description: `No ${dataType} available - waiting for real data`,
  };
}

/**
 * Wrapper for async data loading with test data fallback
 *
 * @param tokenId - Token ID
 * @param fetchFunction - Function to fetch real data
 * @param testDataGenerator - Function to generate test data (optional)
 * @returns Promise resolving to data (real or test)
 *
 * @example
 * const trades = await loadWithTestDataFallback(
 *   'token-123',
 *   () => api.getTrades('token-123'),
 *   (id) => generateTestTrades(id, 50)
 * );
 */
export async function loadWithTestDataFallback<T>(
  tokenId: string,
  fetchFunction: () => Promise<T>,
  testDataGenerator?: (tokenId: string) => T
): Promise<T> {
  try {
    // Try to fetch real data first
    const realData = await fetchFunction();

    // Check if real data is empty
    const isEmpty = Array.isArray(realData) ? realData.length === 0 : !realData;

    if (isEmpty && !import.meta.env.PROD && isTestDataEnabled && testDataGenerator) {
      // Use test data in development
      logTestDataUsage('loadWithTestDataFallback', { tokenId });
      return testDataGenerator(tokenId);
    }

    return realData;
  } catch (error) {
    // On error, use test data in development (if enabled)
    if (!import.meta.env.PROD && isTestDataEnabled && testDataGenerator) {
      console.warn('Failed to fetch real data, using test data:', error);
      logTestDataUsage('loadWithTestDataFallback (error fallback)', { tokenId });
      return testDataGenerator(tokenId);
    }

    // Re-throw error in production or if no test data available
    throw error;
  }
}

/**
 * Validate data before using it
 * Ensures data structure matches expected format
 *
 * @param data - Data to validate
 * @param validator - Validation function
 * @returns true if valid, false otherwise
 */
export function isValidData<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): data is T {
  return validator(data);
}
