import { ethers } from 'ethers';
import { Pool, Token } from '../../contexts/DexContext';

// Price cache with TTL
interface PriceCache {
  price: number;
  timestamp: number;
  ttl: number;
}

interface PoolPriceCache {
  price0: number;
  price1: number;
  tvl: number;
  apy: number;
  timestamp: number;
  ttl: number;
}

export class PriceService {
  private provider: ethers.Provider;
  private priceCache: Map<string, PriceCache>;
  private poolPriceCache: Map<string, PoolPriceCache>;
  private dcPrice: number;
  private dcPriceTimestamp: number;
  private wdogePrice: number;
  private wdogePriceTimestamp: number;

  // Cache TTL in milliseconds
  private readonly PRICE_CACHE_TTL = 30000; // 30 seconds
  private readonly POOL_PRICE_CACHE_TTL = 30000; // 30 seconds

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.priceCache = new Map();
    this.poolPriceCache = new Map();
    this.dcPrice = 0;
    this.dcPriceTimestamp = 0;
    this.wdogePrice = 0;
    this.wdogePriceTimestamp = 0;
  }

  /**
   * Calculate price from pool reserves
   */
  calculatePoolPrice(reserve0: string, reserve1: string, decimals0: number, decimals1: number): number {
    const r0 = parseFloat(ethers.formatUnits(reserve0, decimals0));
    const r1 = parseFloat(ethers.formatUnits(reserve1, decimals1));

    if (r0 === 0) return 0;
    return r1 / r0;
  }

  /**
   * Calculate TVL for a pool
   */
  calculateTVL(pool: Pool, tokenPrices: Map<string, number>): number {
    const price0 = tokenPrices.get(pool.tokenA.address) || 0;
    const price1 = tokenPrices.get(pool.tokenB.address) || 0;

    const amount0 = parseFloat(ethers.formatUnits(pool.reserve0, pool.tokenA.decimals));
    const amount1 = parseFloat(ethers.formatUnits(pool.reserve1, pool.tokenB.decimals));

    return (amount0 * price0) + (amount1 * price1);
  }

  /**
   * Calculate APY for a pool
   */
  calculateAPY(pool: Pool, tokenPrices: Map<string, number>): number {
    const tvl = this.calculateTVL(pool, tokenPrices);
    if (tvl === 0) return 0;

    // Assuming daily fees are stored in pool or calculated elsewhere
    // This is a simplified calculation
    const dailyFees = pool.volume24h * pool.fee;
    const yearlyFees = dailyFees * 365;
    const apy = (yearlyFees / tvl) * 100;

    return apy;
  }

  /**
   * Calculate price impact for a swap
   */
  calculatePriceImpact(
    amountIn: string,
    amountOut: string,
    reserveIn: string,
    reserveOut: string,
    decimalsIn: number,
    decimalsOut: number
  ): number {
    const inAmount = parseFloat(ethers.formatUnits(amountIn, decimalsIn));
    const outAmount = parseFloat(ethers.formatUnits(amountOut, decimalsOut));
    const inReserve = parseFloat(ethers.formatUnits(reserveIn, decimalsIn));
    const outReserve = parseFloat(ethers.formatUnits(reserveOut, decimalsOut));

    if (inReserve === 0 || outReserve === 0 || outAmount === 0) return 0;

    // Calculate expected output using constant product formula
    const expectedOutput = (outAmount * inReserve) / (inReserve + inAmount);
    const priceImpact = ((outAmount - expectedOutput) / outAmount) * 100;

    return Math.abs(priceImpact);
  }

  /**
   * Calculate TWAP (Time-Weighted Average Price)
   */
  calculateTWAP(
    price0CumulativeLast: string,
    price1CumulativeLast: string,
    blockTimestampLast: number,
    currentTimestamp: number
  ): { price0: number; price1: number } {
    const timeElapsed = currentTimestamp - blockTimestampLast;
    if (timeElapsed === 0) {
      return { price0: 0, price1: 0 };
    }

    const price0 = parseFloat(ethers.formatUnits(price0CumulativeLast, 112)) / timeElapsed;
    const price1 = parseFloat(ethers.formatUnits(price1CumulativeLast, 112)) / timeElapsed;

    return { price0, price1 };
  }

  /**
   * Get pool price with caching
   */
  async getPoolPrice(pool: Pool): Promise<{ price0: number; price1: number; tvl: number; apy: number }> {
    const cacheKey = pool.address;
    const cached = this.poolPriceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        price0: cached.price0,
        price1: cached.price1,
        tvl: cached.tvl,
        apy: cached.apy,
      };
    }

    // Calculate prices from reserves
    const price0 = this.calculatePoolPrice(pool.reserve0, pool.reserve1, pool.tokenA.decimals, pool.tokenB.decimals);
    const price1 = this.calculatePoolPrice(pool.reserve1, pool.reserve0, pool.tokenB.decimals, pool.tokenA.decimals);

    // Get token prices for TVL and APY calculation
    const tokenPrices = new Map<string, number>();
    tokenPrices.set(pool.tokenA.address, price0);
    tokenPrices.set(pool.tokenB.address, price1);

    const tvl = this.calculateTVL(pool, tokenPrices);
    const apy = this.calculateAPY(pool, tokenPrices);

    // Cache the result
    this.poolPriceCache.set(cacheKey, {
      price0,
      price1,
      tvl,
      apy,
      timestamp: Date.now(),
      ttl: this.POOL_PRICE_CACHE_TTL,
    });

    return { price0, price1, tvl, apy };
  }

  /**
   * Get token price from pool
   */
  async getTokenPrice(token: Token, pool: Pool): Promise<number> {
    if (token.address === pool.tokenA.address) {
      const { price0 } = await this.getPoolPrice(pool);
      return price0;
    } else if (token.address === pool.tokenB.address) {
      const { price1 } = await this.getPoolPrice(pool);
      return price1;
    }
    return 0;
  }

  /**
   * Set DC price (base token)
   */
  setDCPrice(price: number): void {
    this.dcPrice = price;
    this.dcPriceTimestamp = Date.now();
  }

  /**
   * Get DC price with caching
   */
  getDCPrice(): number {
    // Check if price is stale (1 hour TTL)
    if (Date.now() - this.dcPriceTimestamp > 3600000) {
      return 0;
    }
    return this.dcPrice;
  }

  /**
   * Set wDOGE price
   */
  setWDOGEPrice(price: number): void {
    this.wdogePrice = price;
    this.wdogePriceTimestamp = Date.now();
  }

  /**
   * Get wDOGE price with caching
   */
  getWDOGEPrice(): number {
    // Check if price is stale (1 hour TTL)
    if (Date.now() - this.wdogePriceTimestamp > 3600000) {
      return 0;
    }
    return this.wdogePrice;
  }

  /**
   * Cache a token price
   */
  cacheTokenPrice(tokenAddress: string, price: number, ttl: number = this.PRICE_CACHE_TTL): void {
    this.priceCache.set(tokenAddress, {
      price,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached token price
   */
  getCachedTokenPrice(tokenAddress: string): number | null {
    const cached = this.priceCache.get(tokenAddress);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.priceCache.delete(tokenAddress);
      return null;
    }

    return cached.price;
  }

  /**
   * Clear price cache for a specific token
   */
  clearTokenPriceCache(tokenAddress: string): void {
    this.priceCache.delete(tokenAddress);
  }

  /**
   * Clear all price caches
   */
  clearAllCaches(): void {
    this.priceCache.clear();
    this.poolPriceCache.clear();
  }

  /**
   * Get price impact for a swap
   */
  async getSwapPriceImpact(
    amountIn: string,
    tokenIn: Token,
    tokenOut: Token,
    pool: Pool
  ): Promise<number> {
    // Determine which reserve is in and which is out
    let reserveIn: string;
    let reserveOut: string;
    let decimalsIn: number;
    let decimalsOut: number;

    if (tokenIn.address === pool.tokenA.address) {
      reserveIn = pool.reserve0;
      reserveOut = pool.reserve1;
      decimalsIn = pool.tokenA.decimals;
      decimalsOut = pool.tokenB.decimals;
    } else {
      reserveIn = pool.reserve1;
      reserveOut = pool.reserve0;
      decimalsIn = pool.tokenB.decimals;
      decimalsOut = pool.tokenA.decimals;
    }

    // Calculate amount out using constant product formula
    const amountInBN = ethers.parseUnits(amountIn, decimalsIn);
    const reserveInBN = ethers.parseUnits(reserveIn, decimalsIn);
    const reserveOutBN = ethers.parseUnits(reserveOut, decimalsOut);

    const amountOutBN = (amountInBN * reserveOutBN * 997n) / (reserveInBN * 1000n + amountInBN * 997n);

    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(
      amountIn,
      amountOutBN.toString(),
      reserveIn,
      reserveOut,
      decimalsIn,
      decimalsOut
    );

    return priceImpact;
  }

  /**
   * Format price for display
   */
  formatPrice(price: number, decimals: number = 6): string {
    if (price === 0) return '0';
    if (price < 0.000001) return '<0.000001';
    return price.toFixed(decimals);
  }

  /**
   * Format TVL for display
   */
  formatTVL(tvl: number): string {
    if (tvl === 0) return '$0';
    if (tvl < 1000) return `$${tvl.toFixed(2)}`;
    if (tvl < 1000000) return `$${(tvl / 1000).toFixed(2)}K`;
    if (tvl < 1000000000) return `$${(tvl / 1000000).toFixed(2)}M`;
    return `$${(tvl / 1000000000).toFixed(2)}B`;
  }

  /**
   * Format APY for display
   */
  formatAPY(apy: number): string {
    return `${apy.toFixed(2)}%`;
  }

  /**
   * Get price change percentage
   */
  getPriceChange(currentPrice: number, previousPrice: number): number {
    if (previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }

  /**
   * Check if price is valid
   */
  isValidPrice(price: number): boolean {
    return !isNaN(price) && isFinite(price) && price > 0;
  }

  /**
   * Get average price from multiple pools
   */
  getAveragePrice(token: Token, pools: Pool[]): number {
    const prices: number[] = [];

    for (const pool of pools) {
      if (pool.tokenA.address === token.address) {
        prices.push(pool.price0);
      } else if (pool.tokenB.address === token.address) {
        prices.push(pool.price1);
      }
    }

    if (prices.length === 0) return 0;

    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  /**
   * Get best price from multiple pools
   */
  getBestPrice(token: Token, pools: Pool[]): { price: number; pool: Pool | null } {
    let bestPrice = 0;
    let bestPool: Pool | null = null;

    for (const pool of pools) {
      let price = 0;
      if (pool.tokenA.address === token.address) {
        price = pool.price0;
      } else if (pool.tokenB.address === token.address) {
        price = pool.price1;
      }

      if (price > bestPrice) {
        bestPrice = price;
        bestPool = pool;
      }
    }

    return { price: bestPrice, pool: bestPool };
  }
}

export default PriceService;
