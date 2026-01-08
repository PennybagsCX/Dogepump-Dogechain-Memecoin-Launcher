/**
 * Historical Price Tracking Service
 *
 * Stores and manages DC price history for analytics, charting,
 * and monitoring trends over time.
 */

import { MAX_PRICE_DEVIATION } from '../constants';

interface PriceHistoryEntry {
  price: number;
  source: 'pool' | 'dexscreener' | 'geckoterminal' | 'cache';
  timestamp: number;
  volume?: number; // Trading volume (if available)
}

interface PriceStatistics {
  current: number;
  high24h: number;
  low24h: number;
  average24h: number;
  change24h: number;
  changePercent24h: number;
  volatility24h: number;
}

interface PriceTrend {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-100
  shortTerm: number; // 1 hour change
  mediumTerm: number; // 6 hour change
  longTerm: number; // 24 hour change
}

class PriceHistoryService {
  private history: PriceHistoryEntry[] = [];
  private maxHistorySize = 10000; // Keep last 10,000 entries
  private storageKey = 'dogepump_price_history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add price entry to history
   */
  addPrice(price: number, source: PriceHistoryEntry['source'], volume?: number): void {
    const entry: PriceHistoryEntry = {
      price,
      source,
      timestamp: Date.now(),
      volume
    };

    this.history.push(entry);

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Save to storage periodically (every 10 entries)
    if (this.history.length % 10 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Get price history for a time period
   */
  getHistory(durationMs: number = 24 * 60 * 60 * 1000): PriceHistoryEntry[] {
    const cutoff = Date.now() - durationMs;
    return this.history.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Get prices aggregated by interval
   * Useful for candlestick charts (OHLC)
   */
  getOHLC(intervalMs: number, durationMs: number = 24 * 60 * 60 * 1000): Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> {
    const history = this.getHistory(durationMs);
    const candles: Map<number, PriceHistoryEntry[]> = new Map();

    // Group by interval
    for (const entry of history) {
      const time = Math.floor(entry.timestamp / intervalMs) * intervalMs;
      if (!candles.has(time)) {
        candles.set(time, []);
      }
      candles.get(time)!.push(entry);
    }

    // Calculate OHLC for each candle
    return Array.from(candles.entries()).map(([time, entries]) => {
      const prices = entries.map(e => e.price);
      const volumes = entries.map(e => e.volume || 0);

      return {
        time,
        open: prices[0],
        high: Math.max(...prices),
        low: Math.min(...prices),
        close: prices[prices.length - 1],
        volume: volumes.reduce((a, b) => a + b, 0)
      };
    }).sort((a, b) => a.time - b.time);
  }

  /**
   * Calculate price statistics
   */
  getStatistics(): PriceStatistics {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recentHistory = this.history.filter(e => e.timestamp > dayAgo);

    if (recentHistory.length === 0) {
      return {
        current: 0,
        high24h: 0,
        low24h: 0,
        average24h: 0,
        change24h: 0,
        changePercent24h: 0,
        volatility24h: 0
      };
    }

    const prices = recentHistory.map(e => e.price);
    const current = prices[prices.length - 1];
    const first = prices[0];

    const high24h = Math.max(...prices);
    const low24h = Math.min(...prices);
    const average24h = prices.reduce((a, b) => a + b, 0) / prices.length;
    const change24h = current - first;
    const changePercent24h = first !== 0 ? (change24h / first) * 100 : 0;

    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - average24h, 2), 0) / prices.length;
    const volatility24h = Math.sqrt(variance);

    return {
      current,
      high24h,
      low24h,
      average24h,
      change24h,
      changePercent24h,
      volatility24h
    };
  }

  /**
   * Analyze price trend
   */
  getTrend(): PriceTrend {
    const stats = this.getStatistics();

    // Short term (1 hour)
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const hourHistory = this.history.filter(e => e.timestamp > hourAgo);
    const shortTerm = hourHistory.length > 0
      ? ((hourHistory[hourHistory.length - 1].price - hourHistory[0].price) / hourHistory[0].price) * 100
      : 0;

    // Medium term (6 hours)
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const sixHourHistory = this.history.filter(e => e.timestamp > sixHoursAgo);
    const mediumTerm = sixHourHistory.length > 0
      ? ((sixHourHistory[sixHourHistory.length - 1].price - sixHourHistory[0].price) / sixHourHistory[0].price) * 100
      : 0;

    // Long term (24 hours)
    const longTerm = stats.changePercent24h;

    // Determine overall direction
    const avgChange = (shortTerm + mediumTerm + longTerm) / 3;
    let direction: 'up' | 'down' | 'stable';
    let strength: number;

    if (avgChange > 1) {
      direction = 'up';
      strength = Math.min(100, avgChange);
    } else if (avgChange < -1) {
      direction = 'down';
      strength = Math.min(100, Math.abs(avgChange));
    } else {
      direction = 'stable';
      strength = 0;
    }

    return {
      direction,
      strength,
      shortTerm,
      mediumTerm,
      longTerm
    };
  }

  /**
   * Get price source distribution
   */
  getSourceDistribution(): Map<string, number> {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentHistory = this.history.filter(e => e.timestamp > dayAgo);

    const distribution = new Map<string, number>();
    for (const entry of recentHistory) {
      const count = distribution.get(entry.source) || 0;
      distribution.set(entry.source, count + 1);
    }

    return distribution;
  }

  /**
   * Export history as CSV
   */
  exportToCSV(durationMs: number = 7 * 24 * 60 * 60 * 1000): string {
    const history = this.getHistory(durationMs);

    const headers = ['Timestamp', 'Price', 'Source', 'Volume'];
    const rows = history.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.price.toFixed(6),
      entry.source,
      (entry.volume || 0).toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export history as JSON
   */
  exportToJSON(durationMs: number = 7 * 24 * 60 * 60 * 1000): string {
    const history = this.getHistory(durationMs);
    return JSON.stringify(history, null, 2);
  }

  /**
   * Clear old history to free memory
   */
  clearOldHistory(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    const beforeLength = this.history.length;

    this.history = this.history.filter(entry => entry.timestamp > cutoff);

    const cleared = beforeLength - this.history.length;
    if (cleared > 0) {
      console.log(`[PriceHistory] Cleared ${cleared} old entries`);
      this.saveToStorage();
    }
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    try {
      // Only save last 1000 entries to localStorage (to avoid quota limits)
      const recentHistory = this.history.slice(-1000);
      localStorage.setItem(this.storageKey, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('[PriceHistory] Failed to save to storage:', error);
    }
  }

  /**
   * Load history from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.history = JSON.parse(stored);
        console.log(`[PriceHistory] Loaded ${this.history.length} entries from storage`);
      }
    } catch (error) {
      console.error('[PriceHistory] Failed to load from storage:', error);
      this.history = [];
    }
  }

  /**
   * Get history size info
   */
  getInfo(): {
    totalEntries: number;
    memorySize: string;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const oldestEntry = this.history.length > 0 ? new Date(this.history[0].timestamp) : null;
    const newestEntry = this.history.length > 0 ? new Date(this.history[this.history.length - 1].timestamp) : null;

    // Rough memory estimate (each entry ~100 bytes)
    const memorySize = `${(this.history.length * 100 / 1024).toFixed(2)} KB`;

    return {
      totalEntries: this.history.length,
      memorySize,
      oldestEntry,
      newestEntry
    };
  }
}

// Singleton instance
export const priceHistoryService = new PriceHistoryService();

// Export class for testing
export { PriceHistoryService };
