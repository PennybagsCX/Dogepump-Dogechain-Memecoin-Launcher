/**
 * DC Price Oracle Service
 *
 * Provides DC/USD price with multiple fallback sources:
 * 1. DC/wDOGE Pool (TWAP) - Primary, on-chain
 * 2. DEXScreener API - Fallback 1, free
 * 3. GeckoTerminal API - Fallback 2, free
 * 4. Cached Price - Ultimate fallback
 */

import {
  DC_TOKEN_ADDRESS,
  DEXSCREENER_API_BASE,
  GECKOTERMINAL_API_BASE,
  PRICE_CACHE_TTL,
  MAX_PRICE_DEVIATION,
  TWAP_WINDOW_SECONDS
} from '../constants';
import { poolPriceService } from './poolPriceService';
import { priceHistoryService } from './priceHistoryService';
import { validatePrice, sanitizeAPIResponse } from '../utils/validation';

interface PriceObservation {
  price: number;
  timestamp: number;
}

interface PriceSource {
  name: string;
  price: number;
  timestamp: number;
  source: 'pool' | 'dexscreener' | 'geckoterminal' | 'cache';
}

// Type definitions for external API responses
interface DexScreenerPair {
  baseToken: {
    address: string;
    symbol: string;
  };
  priceUsd: string;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

interface GeckoTerminalPool {
  attributes: {
    base_token_price_usd?: string;
  };
}

interface GeckoTerminalResponse {
  data: GeckoTerminalPool[];
}

class PriceOracleService {
  private cachedPrice: number | null = null; // No default fallback - security measure
  private cacheTimestamp: number = 0;
  private priceObservations: PriceObservation[] = [];
  private currentPrice: number | null = null;
  private lastUpdateTime: number = 0;
  private lastPriceSource: PriceSource['source'] = 'cache';
  private forceRefresh: boolean = false;

  /**
   * Get current DC price in USD with fallback chain
   */
  async getDCPriceUSD(): Promise<number> {
    const now = Date.now();

    // Check if we need to update (30 second cache)
    if (!this.forceRefresh && this.lastUpdateTime && now - this.lastUpdateTime < PRICE_CACHE_TTL && this.currentPrice !== null) {
      return this.currentPrice;
    }

    try {
      // Try Priority 1: Pool TWAP (on-chain, most reliable)
      const poolPrice = await this.getPriceFromPool();
      if (poolPrice && this.validatePrice(poolPrice)) {
        return this.updatePrice(poolPrice, 'pool');
      }
    } catch (error) {
      console.warn('[PriceOracle] Pool price fetch failed:', error);
    }

    try {
      // Try Priority 2: DEXScreener API
      const dexPrice = await this.getPriceFromDexScreener();
      if (dexPrice && this.validatePrice(dexPrice)) {
        return this.updatePrice(dexPrice, 'dexscreener');
      }
    } catch (error) {
      console.warn('[PriceOracle] DEXScreener API failed:', error);
    }

    try {
      // Try Priority 3: GeckoTerminal API
      const geckoPrice = await this.getPriceFromGeckoTerminal();
      if (geckoPrice && this.validatePrice(geckoPrice)) {
        return this.updatePrice(geckoPrice, 'geckoterminal');
      }
    } catch (error) {
      console.warn('[PriceOracle] GeckoTerminal API failed:', error);
    }

    // Fallback 4: Use cached price if available and not stale (skip if force refresh)
    if (!this.forceRefresh && this.cachedPrice !== null && this.currentPrice !== null) {
      const cacheAge = now - this.lastUpdateTime;
      const MAX_STALE_TIME = 5 * 60 * 1000; // 5 minutes

      if (cacheAge < MAX_STALE_TIME) {
        console.warn('[PriceOracle] All sources failed, using cached price (age: ' + Math.floor(cacheAge / 1000) + 's)');
        return this.currentPrice;
      } else {
        console.error('[PriceOracle] All sources failed and cached price is stale');
        throw new Error('Unable to fetch current DC price. Price sources are unavailable and cached data is too old.');
      }
    }

    // No cached price available - throw error
    console.error('[PriceOracle] All price sources failed and no cached price available');
    throw new Error('Unable to fetch DC price. Please check your internet connection and try again.');
  }

  /**
   * Calculate price from DC/wDOGE pool (TWAP)
   * This is the PRIMARY source - on-chain and manipulation-resistant
   */
  private async getPriceFromPool(): Promise<number | null> {
    try {
      // Use the pool price service to get on-chain TWAP price
      const price = await poolPriceService.getDCPriceFromPool();

      if (price && price > 0) {
        console.log(`[PriceOracle] Using pool price: $${price.toFixed(6)}`);
      }

      return price;
    } catch (error) {
      console.error('[PriceOracle] Pool price calculation error:', error);
      return null;
    }
  }

  /**
   * Calculate Time-Weighted Average Price (TWAP)
   * Prevents flash loan and manipulation attacks
   */
  private calculateTWAP(spotPrice: number): number {
    const now = Date.now();
    const windowStart = now - TWAP_WINDOW_SECONDS * 1000;

    // Add new observation
    this.priceObservations.push({ price: spotPrice, timestamp: now });

    // Remove old observations outside window
    this.priceObservations = this.priceObservations.filter(
      obs => obs.timestamp > windowStart
    );

    // Calculate average
    if (this.priceObservations.length === 0) {
      return spotPrice;
    }

    const sum = this.priceObservations.reduce((acc, obs) => acc + obs.price, 0);
    return sum / this.priceObservations.length;
  }

  /**
   * Fetch price from DEXScreener API (Free tier)
   * Rate limit: 60-300 requests/minute
   */
  private async getPriceFromDexScreener(): Promise<number | null> {
    try {
      const url = `${DEXSCREENER_API_BASE}/dex/tokens/${DC_TOKEN_ADDRESS}`;
      const response = await fetch(url);
      const data = await response.json() as DexScreenerResponse;

      if (!data.pairs || data.pairs.length === 0) {
        console.warn('[PriceOracle] No pairs found on DEXScreener');
        return null;
      }

      // Find DC/wDOGE pair or use first pair
      const pair = data.pairs.find((p: DexScreenerPair) =>
        p.baseToken.address.toLowerCase() === DC_TOKEN_ADDRESS.toLowerCase()
      ) || data.pairs[0];

      const priceUsd = pair.priceUsd;
      if (!priceUsd) {
        console.warn('[PriceOracle] No priceUsd in DEXScreener response');
        return null;
      }

      return parseFloat(priceUsd);
    } catch (error) {
      console.error('[PriceOracle] DEXScreener API error:', error);
      return null;
    }
  }

  /**
   * Fetch price from GeckoTerminal API (Free tier)
   * Rate limit: ~30 requests/minute
   */
  private async getPriceFromGeckoTerminal(): Promise<number | null> {
    try {
      const url = `${GECKOTERMINAL_API_BASE}/networks/dogechain/tokens/${DC_TOKEN_ADDRESS}/pools`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('[PriceOracle] GeckoTerminal API returned non-OK status');
        return null;
      }

      const data = await response.json() as GeckoTerminalResponse;

      if (!data.data || data.data.length === 0) {
        console.warn('[PriceOracle] No pools found on GeckoTerminal');
        return null;
      }

      // Use first pool's price
      const pool = data.data[0];
      const priceUsd = pool.attributes?.base_token_price_usd;

      if (!priceUsd) {
        console.warn('[PriceOracle] No price in GeckoTerminal response');
        return null;
      }

      return parseFloat(priceUsd);
    } catch (error) {
      console.error('[PriceOracle] GeckoTerminal API error:', error);
      return null;
    }
  }

  /**
   * Validate price is within reasonable bounds
   * Prevents manipulation and bad data
   */
  private validatePrice(price: number): boolean {
    // Use validation utility
    if (!validatePrice(price)) {
      return false;
    }

    // Check for extreme deviation from last known price (anti-manipulation)
    // Always check deviation unless we have no valid price yet
    if (this.currentPrice !== null && this.currentPrice > 0) {
      const deviation = Math.abs(price - this.currentPrice) / this.currentPrice;
      if (deviation > MAX_PRICE_DEVIATION) {
        console.warn(
          `[PriceOracle] Price deviation too high: ${(deviation * 100).toFixed(1)}% ` +
          `(current: $${this.currentPrice}, new: $${price})`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Update current price with source tracking
   */
  private updatePrice(price: number, source: PriceSource['source']): number {
    const now = Date.now();

    this.currentPrice = price;
    this.lastUpdateTime = now;
    this.lastPriceSource = source;

    // Update cache
    this.cachedPrice = price;
    this.cacheTimestamp = now;

    // Record price history
    priceHistoryService.addPrice(price, source);

    console.log(
      `[PriceOracle] Price updated: $${price.toFixed(6)} ` +
      `(source: ${source}, age: ${now - this.cacheTimestamp}ms)`
    );

    return price;
  }

  /**
   * Get price source information (for monitoring/debugging)
   */
  getPriceSource(): PriceSource {
    return {
      name: this.lastPriceSource,
      price: this.currentPrice,
      timestamp: this.lastUpdateTime,
      source: this.lastPriceSource
    };
  }

  /**
   * Manually set cached price (for testing or admin override)
   */
  setCachedPrice(price: number): void {
    if (this.validatePrice(price)) {
      this.cachedPrice = price;
      this.currentPrice = price;
      this.cacheTimestamp = Date.now();
      this.lastUpdateTime = Date.now();
      console.log(`[PriceOracle] Manual cache update: $${price}`);
    }
  }

  /**
   * Get price age in milliseconds
   */
  getPriceAge(): number {
    return Date.now() - this.lastUpdateTime;
  }

  /**
   * Check if price is stale (older than cache TTL)
   */
  isPriceStale(): boolean {
    return this.getPriceAge() > PRICE_CACHE_TTL;
  }

  /**
   * Get current price without fetching (sync)
   * Returns null if no price is available
   */
  getCurrentPrice(): number | null {
    return this.currentPrice;
  }

  /**
   * Force refresh price (ignore cache)
   */
  async refreshPrice(): Promise<number> {
    this.forceRefresh = true;
    try {
      return await this.getDCPriceUSD();
    } finally {
      this.forceRefresh = false;
    }
  }
}

// Singleton instance
export const priceOracleService = new PriceOracleService();

// Export class for testing
export { PriceOracleService };
