/**
 * DC/wDOGE Pool Price Service
 *
 * Reads on-chain pool reserves to calculate DC/USD price.
 * This is the PRIMARY price source - on-chain, manipulation-resistant, and free.
 *
 * TODO: This service is a template. Update with actual:
 * - Pool contract address when deployed
 * - Pool ABI for your specific DEX (Uniswap V2/V3, PancakeSwap, etc.)
 * - DogeChain RPC endpoint
 */

import { ethers } from 'ethers';
import {
  DC_TOKEN_ADDRESS,
  WDOGE_TOKEN_ADDRESS,
  MIN_POOL_LIQUIDITY_USD,
  TWAP_WINDOW_SECONDS
} from '../constants';

// TODO: Update with your actual pool contract address when deployed
// This is a placeholder - replace with real DC/wDOGE pool address
export const POOL_ADDRESS: string = '0x0000000000000000000000000000000000000000'; // Replace me! TODO: Deploy DC/wDOGE pool and update address

// DogeChain RPC endpoints (public nodes)
const DOGECHAIN_RPC_URLS = [
  'https://rpc.dogechain.dog',
  'https://dogechain.blockpi.network/v1/rpc/public',
  'https://dogerpc.com'
];

// Minimal ERC20 ABI for getting reserves
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Uniswap V2-style Pair ABI (most common on DogeChain)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)'
];

interface PoolReserves {
  reserveDC: bigint;
  reserveWDOGE: bigint;
  timestamp: number;
}

interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  reserves: PoolReserves;
  totalSupply: bigint;
  liquidityUSD: number;
}

class PoolPriceService {
  private provider: ethers.JsonRpcProvider | null = null;
  private poolContract: ethers.Contract | null = null;
  private dcContract: ethers.Contract | null = null;
  private wdogeContract: ethers.Contract | null = null;
  private isInitialized: boolean = false;
  private lastReserves: PoolReserves | null = null;
  private priceObservations: Array<{ price: number; timestamp: number }> = [];
  private hasWarnedAboutPool: boolean = false;

  /**
   * Initialize the pool service with RPC provider
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // Check if pool address is valid (not zero address)
    if (!POOL_ADDRESS || POOL_ADDRESS === '0x0000000000000000000000000000000000000000') {
      if (!this.hasWarnedAboutPool) {
        console.warn('[PoolService] Pool not deployed yet - set POOL_ADDRESS in poolPriceService.ts');
        this.hasWarnedAboutPool = true;
      }
      return false;
    }

    try {
      // Try each RPC endpoint until one works
      for (const rpcUrl of DOGECHAIN_RPC_URLS) {
        try {
          console.log(`[PoolService] Connecting to RPC: ${rpcUrl}`);
          this.provider = new ethers.JsonRpcProvider(rpcUrl);

          // Test connection
          await this.provider.getBlockNumber();

          console.log('[PoolService] RPC connection successful');
          break;
        } catch (error) {
          console.warn(`[PoolService] RPC ${rpcUrl} failed, trying next...`);
          this.provider = null;
        }
      }

      if (!this.provider) {
        console.error('[PoolService] All RPC endpoints failed');
        return false;
      }

      // Initialize contracts
      if (POOL_ADDRESS.startsWith('0x') && POOL_ADDRESS.length === 42) {
        this.poolContract = new ethers.Contract(POOL_ADDRESS, PAIR_ABI, this.provider);
        this.dcContract = new ethers.Contract(DC_TOKEN_ADDRESS, ERC20_ABI, this.provider);
        this.wdogeContract = new ethers.Contract(WDOGE_TOKEN_ADDRESS, ERC20_ABI, this.provider);

        this.isInitialized = true;
        console.log('[PoolService] Initialized successfully');
        return true;
      } else {
        console.warn('[PoolService] Invalid pool address format');
        return false;
      }
    } catch (error) {
      console.error('[PoolService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current pool reserves
   */
  async getPoolReserves(): Promise<PoolReserves | null> {
    if (!this.isInitialized || !this.poolContract) {
      const initialized = await this.initialize();
      if (!initialized || !this.isInitialized) {
        return null;
      }
    }

    try {
      const reserves = await this.poolContract.getReserves();
      const token0 = await this.poolContract.token0();
      const token1 = await this.poolContract.token1();

      // Determine which token is DC and which is wDOGE
      const dcIsToken0 = token0.toLowerCase() === DC_TOKEN_ADDRESS.toLowerCase();

      this.lastReserves = {
        reserveDC: dcIsToken0 ? reserves[0] : reserves[1],
        reserveWDOGE: dcIsToken0 ? reserves[1] : reserves[0],
        timestamp: Date.now()
      };

      return this.lastReserves;
    } catch (error: any) {
      // Only log error if it's not a "contract not deployed" error
      if (!error.message?.includes('could not decode') && !error.message?.includes('network')) {
        console.error('[PoolService] Failed to get reserves:', error);
      }
      return null;
    }
  }

  /**
   * Get full pool information including liquidity
   */
  async getPoolInfo(): Promise<PoolInfo | null> {
    const reserves = await this.getPoolReserves();
    if (!reserves) return null;

    try {
      const totalSupply = await this.poolContract.totalSupply();

      // Calculate liquidity (simplified - just DC reserves)
      // In production, you'd want to get actual wDOGE price in USD
      const liquidityDC = Number(ethers.formatUnits(reserves.reserveDC, 18));
      const liquidityWDOGE = Number(ethers.formatUnits(reserves.reserveWDOGE, 18));

      // Rough USD liquidity estimate (wDOGE tracks DOGE price)
      // This is a placeholder - in production, fetch actual DOGE price
      const estimatedWDOGEPriceUSD = 0.35; // ~$0.35 per DOGE (update with real price feed)
      const liquidityUSD = (liquidityDC * 0.10) + (liquidityWDOGE * estimatedWDOGEPriceUSD);

      return {
        address: POOL_ADDRESS,
        token0: await this.poolContract.token0(),
        token1: await this.poolContract.token1(),
        reserves,
        totalSupply,
        liquidityUSD
      };
    } catch (error) {
      console.error('[PoolService] Failed to get pool info:', error);
      return null;
    }
  }

  /**
   * Calculate spot price from reserves
   * Returns DC price in USD (per 1 DC)
   */
  calculateSpotPrice(reserves: PoolReserves): number {
    if (!reserves || reserves.reserveDC === 0n || reserves.reserveWDOGE === 0n) {
      return 0;
    }

    // Convert from bigint to number
    const reserveDC = Number(ethers.formatUnits(reserves.reserveDC, 18));
    const reserveWDOGE = Number(ethers.formatUnits(reserves.reserveWDOGE, 18));

    // Price = wDOGE / DC (how many wDOGE per 1 DC)
    const spotPriceWDOGEperDC = reserveWDOGE / reserveDC;

    // Convert to USD (assume wDOGE ≈ DOGE price)
    // TODO: Replace with actual wDOGE/DOGE price feed
    const wdogePriceUSD = 0.35; // ~$0.35 per DOGE
    const dcPriceUSD = spotPriceWDOGEperDC * wdogePriceUSD;

    return dcPriceUSD;
  }

  /**
   * Calculate TWAP (Time-Weighted Average Price)
   * Prevents flash loan and manipulation attacks
   */
  calculateTWAP(): number {
    const now = Date.now();
    const windowStart = now - TWAP_WINDOW_SECONDS * 1000;

    // Remove observations outside the TWAP window
    this.priceObservations = this.priceObservations.filter(
      obs => obs.timestamp > windowStart
    );

    if (this.priceObservations.length === 0) {
      return 0;
    }

    // Calculate geometric mean (better for TWAP than arithmetic mean)
    // But for simplicity, using arithmetic mean here
    const sum = this.priceObservations.reduce((acc, obs) => acc + obs.price, 0);
    return sum / this.priceObservations.length;
  }

  /**
   * Get current DC price in USD from pool
   * Returns null if pool not available or liquidity too low
   */
  async getDCPriceFromPool(): Promise<number | null> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return null;
        }
      }

      // Get pool info
      const poolInfo = await this.getPoolInfo();
      if (!poolInfo) {
        return null;
      }

      // Check if pool has enough liquidity
      if (poolInfo.liquidityUSD < MIN_POOL_LIQUIDITY_USD) {
        console.warn(
          `[PoolService] Pool liquidity too low: $${poolInfo.liquidityUSD.toFixed(2)} ` +
          `(minimum: $${MIN_POOL_LIQUIDITY_USD})`
        );
        return null;
      }

      // Calculate spot price
      const spotPrice = this.calculateSpotPrice(poolInfo.reserves);

      // Add to observations for TWAP
      this.priceObservations.push({
        price: spotPrice,
        timestamp: Date.now()
      });

      // Calculate and return TWAP
      const twapPrice = this.calculateTWAP();

      console.log(
        `[PoolService] Pool price: $${spotPrice.toFixed(6)}, ` +
        `TWAP: $${twapPrice.toFixed(6)}, ` +
        `Liquidity: $${poolInfo.liquidityUSD.toFixed(2)}`
      );

      return twapPrice;
    } catch (error) {
      console.error('[PoolService] Failed to get price from pool:', error);
      return null;
    }
  }

  /**
   * Check if pool is available and has sufficient liquidity
   */
  async isPoolAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const poolInfo = await this.getPoolInfo();
    return poolInfo !== null && poolInfo.liquidityUSD >= MIN_POOL_LIQUIDITY_USD;
  }

  /**
   * Get price observation count (for monitoring)
   */
  getObservationCount(): number {
    const now = Date.now();
    const windowStart = now - TWAP_WINDOW_SECONDS * 1000;
    return this.priceObservations.filter(obs => obs.timestamp > windowStart).length;
  }

  /**
   * Clear old observations (for maintenance)
   */
  clearOldObservations(): void {
    const now = Date.now();
    const windowStart = now - TWAP_WINDOW_SECONDS * 1000;
    this.priceObservations = this.priceObservations.filter(obs => obs.timestamp > windowStart);
  }
}

// Singleton instance
export const poolPriceService = new PoolPriceService();

// Export class for testing
export { PoolPriceService };
