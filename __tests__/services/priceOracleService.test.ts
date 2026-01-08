/**
 * Price Oracle Service Tests
 *
 * Testing suite for the price oracle with fallback chain and validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PriceOracleService } from '../../services/priceOracleService';
import { validatePrice } from '../../utils/validation';
import {
  PRICE_CACHE_TTL,
  MAX_PRICE_DEVIATION,
  TWAP_WINDOW_SECONDS
} from '../../constants';

// Mock dependencies
vi.mock('../../services/poolPriceService', () => ({
  poolPriceService: {
    getDCPriceFromPool: vi.fn()
  }
}));

vi.mock('../../services/priceHistoryService', () => ({
  priceHistoryService: {
    addPrice: vi.fn()
  }
}));

vi.mock('../../utils/validation', () => ({
  validatePrice: vi.fn((price: number) => {
    // Basic validation: must be finite positive number
    return typeof price === 'number' &&
           isFinite(price) &&
           price > 0 &&
           price < 1000000; // Upper bound
  }),
  sanitizeAPIResponse: vi.fn((data) => data)
}));

import { poolPriceService } from '../../services/poolPriceService';
import { priceHistoryService } from '../../services/priceHistoryService';

describe('PriceOracleService', () => {
  let priceOracle: PriceOracleService;

  beforeEach(() => {
    priceOracle = new PriceOracleService();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Fallback Chain', () => {
    it('should use pool price as primary source', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00001);
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalled();
      expect(priceOracle.getPriceSource().source).toBe('pool');
    });

    it('should fallback to DEXScreener when pool fails', async () => {
      // Pool fails
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // Mock DEXScreener API
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002);
      expect(priceOracle.getPriceSource().source).toBe('dexscreener');
    });

    it('should fallback to GeckoTerminal when both pool and DEXScreener fail', async () => {
      // Pool fails
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // DEXScreener fails
      global.fetch = vi.fn()
        .mockImplementationOnce(() =>
          // First call (DEXScreener) fails
          Promise.reject(new Error('Network error'))
        )
        .mockImplementationOnce(() =>
          // Second call (GeckoTerminal) succeeds
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [{
                attributes: {
                  base_token_price_usd: '0.00003'
                }
              }]
            })
          } as Response)
        );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00003);
      expect(priceOracle.getPriceSource().source).toBe('geckoterminal');
    });

    it('should fallback to cache when all sources fail', async () => {
      // Set up cache
      priceOracle.setCachedPrice(0.00004);

      // All sources fail
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00004);
      expect(priceOracle.getPriceSource().source).toBe('cache');
    });

    it('should throw error when all sources fail and no cache available', async () => {
      // All sources fail
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(priceOracle.getDCPriceUSD()).rejects.toThrow('Unable to fetch DC price');
    });

    it('should throw error when cache is stale (> 5 minutes)', async () => {
      // Set up stale cache
      priceOracle.setCachedPrice(0.00004);

      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);

      // All sources fail
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(priceOracle.getDCPriceUSD()).rejects.toThrow('cached data is too old');
    });
  });

  describe('Price Validation', () => {
    it('should accept valid positive price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00001);
    });

    it('should reject NaN price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(NaN);

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002); // Should use fallback
      expect(priceOracle.getPriceSource().source).toBe('dexscreener');
    });

    it('should reject Infinity price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(Infinity);

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002); // Should use fallback
    });

    it('should reject negative price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(-0.00001);

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002); // Should use fallback
    });

    it('should reject zero price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0);

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002); // Should use fallback
    });

    it('should reject extremely high prices', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(999999999);

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002); // Should use fallback
    });

    it('should reject price deviation > MAX_PRICE_DEVIATION', async () => {
      // Set initial price
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);
      await priceOracle.getDCPriceUSD();

      // Advance time to bypass cache
      vi.advanceTimersByTime(PRICE_CACHE_TTL + 1000);

      // Next price has > 15% deviation
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00002); // 100% increase

      // Should fallback to next source
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.000011'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.000011); // Should use fallback
      expect(priceOracle.getPriceSource().source).toBe('dexscreener');
    });

    it('should accept price deviation <= MAX_PRICE_DEVIATION', async () => {
      // Set initial price
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);
      await priceOracle.getDCPriceUSD();

      // Advance time to bypass cache
      vi.advanceTimersByTime(PRICE_CACHE_TTL + 1000);

      // Next price has 10% deviation (within 15% threshold)
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.000011);

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.000011); // Should accept
      expect(priceOracle.getPriceSource().source).toBe('pool');
    });
  });

  describe('Cache Management', () => {
    it('should return cached price within TTL', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      // First call
      const price1 = await priceOracle.getDCPriceUSD();
      expect(price1).toBe(0.00001);
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(1);

      // Second call within TTL (should use cache)
      const price2 = await priceOracle.getDCPriceUSD();
      expect(price2).toBe(0.00001);
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(1); // No new call
    });

    it('should fetch new price after cache TTL expires', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      // First call
      await priceOracle.getDCPriceUSD();
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(1);

      // Advance time beyond cache TTL
      vi.advanceTimersByTime(PRICE_CACHE_TTL + 1000);

      // Second call (should fetch new price)
      await priceOracle.getDCPriceUSD();
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(2);
    });

    it('should track price age correctly', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      await priceOracle.getDCPriceUSD();

      expect(priceOracle.getPriceAge()).toBe(0);

      // Advance 5 seconds
      vi.advanceTimersByTime(5000);

      expect(priceOracle.getPriceAge()).toBe(5000);
    });

    it('should detect stale price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      await priceOracle.getDCPriceUSD();

      expect(priceOracle.isPriceStale()).toBe(false);

      // Advance beyond cache TTL
      vi.advanceTimersByTime(PRICE_CACHE_TTL + 1000);

      expect(priceOracle.isPriceStale()).toBe(true);
    });

    it('should allow manual cache override', () => {
      priceOracle.setCachedPrice(0.00005);

      const source = priceOracle.getPriceSource();

      expect(source.price).toBe(0.00005);
    });
  });

  describe('TWAP Calculation', () => {
    it('should calculate time-weighted average price', async () => {
      // Mock multiple price points
      const prices = [0.00001, 0.000011, 0.000012, 0.000013, 0.000014];
      let callCount = 0;

      vi.mocked(poolPriceService.getDCPriceFromPool).mockImplementation(() =>
        Promise.resolve(prices[callCount++ % prices.length])
      );

      // Fetch prices over time
      for (let i = 0; i < 5; i++) {
        await priceOracle.getDCPriceUSD();
        vi.advanceTimersByTime(1000); // 1 second between observations
      }

      // TWAP should smooth out the prices
      const finalPrice = await priceOracle.getDCPriceUSD();
      expect(finalPrice).toBeGreaterThan(0);
      expect(finalPrice).toBeLessThan(0.00002);
    });

    it('should remove observations outside TWAP window', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      // Add observation
      await priceOracle.getDCPriceUSD();

      // Advance beyond TWAP window
      vi.advanceTimersByTime(TWAP_WINDOW_SECONDS * 1000 + 1000);

      // Add new observation
      await priceOracle.getDCPriceUSD();

      // Old observation should be removed
      const price = await priceOracle.getDCPriceUSD();
      expect(price).toBe(0.00001);
    });
  });

  describe('Utility Methods', () => {
    it('should return current price synchronously', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      await priceOracle.getDCPriceUSD();

      const currentPrice = priceOracle.getCurrentPrice();

      expect(currentPrice).toBe(0.00001);
    });

    it('should return null when no price available', () => {
      const currentPrice = priceOracle.getCurrentPrice();

      expect(currentPrice).toBeNull();
    });

    it('should return price source information', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      await priceOracle.getDCPriceUSD();

      const source = priceOracle.getPriceSource();

      expect(source).toEqual({
        name: 'pool',
        price: 0.00001,
        timestamp: expect.any(Number),
        source: 'pool'
      });
    });

    it('should force refresh price', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      // Initial call
      await priceOracle.getDCPriceUSD();
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(1);

      // Force refresh (should bypass cache)
      await priceOracle.refreshPrice();
      expect(poolPriceService.getDCPriceFromPool).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle pool service errors gracefully', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // Should fallback to DEXScreener
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pairs: [{
              baseToken: { address: '0x123', symbol: 'DC' },
              priceUsd: '0.00002'
            }]
          })
        } as Response)
      );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00002);
      expect(priceOracle.getPriceSource().source).toBe('dexscreener');
    });

    it('should handle DEXScreener API errors gracefully', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // First call (DEXScreener) fails, second call (GeckoTerminal) succeeds
      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('Network error')))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [{
                attributes: {
                  base_token_price_usd: '0.00003'
                }
              }]
            })
          } as Response)
        );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00003);
    });

    it('should handle GeckoTerminal API errors gracefully', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      // Set up cache as fallback
      priceOracle.setCachedPrice(0.00004);

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00004);
      expect(priceOracle.getPriceSource().source).toBe('cache');
    });

    it('should handle malformed API responses', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // DEXScreener returns malformed data
      global.fetch = vi.fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ invalid: 'data' })
          } as Response)
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [{
                attributes: {
                  base_token_price_usd: '0.00003'
                }
              }]
            })
          } as Response)
        );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00003);
      expect(priceOracle.getPriceSource().source).toBe('geckoterminal');
    });

    it('should handle empty API responses', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // DEXScreener returns empty pairs array
      global.fetch = vi.fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ pairs: [] })
          } as Response)
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [{
                attributes: {
                  base_token_price_usd: '0.00003'
                }
              }]
            })
          } as Response)
        );

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00003);
      expect(priceOracle.getPriceSource().source).toBe('geckoterminal');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete fallback chain in one request', async () => {
      // Pool fails
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      // All APIs fail
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('All APIs failed'))
      );

      // Set up cache as ultimate fallback
      priceOracle.setCachedPrice(0.00005);

      const price = await priceOracle.getDCPriceUSD();

      expect(price).toBe(0.00005);
      expect(priceOracle.getPriceSource().source).toBe('cache');
    });

    it('should recover after all sources fail and then succeed', async () => {
      // All sources fail initially
      vi.mocked(poolPriceService.getDCPriceFromPool).mockRejectedValue(new Error('Pool error'));

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('API failed'))
      );

      // Set up cache
      priceOracle.setCachedPrice(0.00001);

      // First call should use cache
      const price1 = await priceOracle.getDCPriceUSD();
      expect(price1).toBe(0.00001);
      expect(priceOracle.getPriceSource().source).toBe('cache');

      // Reset and set pool to succeed (within 15% deviation)
      vi.mocked(poolPriceService.getDCPriceFromPool).mockReset().mockResolvedValue(0.000011);

      // Second call should succeed with pool (use refreshPrice to bypass cache)
      const price2 = await priceOracle.refreshPrice();
      expect(price2).toBe(0.000011);
      expect(priceOracle.getPriceSource().source).toBe('pool');
    });

    it('should record price history on update', async () => {
      vi.mocked(poolPriceService.getDCPriceFromPool).mockResolvedValue(0.00001);

      await priceOracle.getDCPriceUSD();

      expect(priceHistoryService.addPrice).toHaveBeenCalledWith(
        0.00001,
        'pool'
      );
    });
  });
});
