/**
 * DEX Utility Functions
 * Helper functions for DEX operations, price calculations, and validations
 */

import { ethers } from 'ethers';
import { TokenInfo, DexPool } from '../types';

/**
 * Format token amount with proper decimal places
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const formatted = ethers.formatUnits(amount, decimals);
  const [integer, decimal] = formatted.split('.');
  
  if (decimal) {
    // Show up to 6 decimal places for better readability
    return `${integer}.${decimal.slice(0, 6)}`;
  }
  
  return integer;
}

/**
 * Parse user input to bigint with decimals
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return ethers.parseUnits(amount, decimals);
  } catch {
    return BigInt(0);
  }
}

/**
 * Calculate price from reserves
 * Price = reserve1 / reserve0
 */
export function calculatePriceFromReserves(
  reserve0: bigint,
  reserve1: bigint,
  decimals0: number,
  decimals1: number
): number {
  if (reserve0 === BigInt(0)) return 0;
  
  const reserve0Number = Number(ethers.formatUnits(reserve0, decimals0));
  const reserve1Number = Number(ethers.formatUnits(reserve1, decimals1));
  
  return reserve1Number / reserve0Number;
}

/**
 * Calculate price impact for a swap
 * Price Impact = (idealPrice - actualPrice) / idealPrice * 100
 */
export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  decimalsIn: number,
  decimalsOut: number
): number {
  if (reserveIn === BigInt(0)) return 100;
  
  // Calculate ideal price (no slippage)
  const idealPrice = calculatePriceFromReserves(reserveIn, reserveOut, decimalsIn, decimalsOut);
  const idealAmountOut = Number(ethers.formatUnits(amountIn, decimalsIn)) * idealPrice;
  
  // Calculate actual price
  const actualAmountOut = Number(ethers.formatUnits(amountOut, decimalsOut));
  const actualPrice = actualAmountOut / Number(ethers.formatUnits(amountIn, decimalsIn));
  
  // Price impact as percentage
  const priceImpact = ((idealPrice - actualPrice) / idealPrice) * 100;
  
  return Math.abs(priceImpact);
}

/**
 * Calculate minimum output with slippage tolerance
 */
export function calculateMinimumOutput(
  amountOut: bigint,
  slippagePercent: number
): bigint {
  const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
  return (amountOut * slippageMultiplier) / BigInt(10000);
}

/**
 * Calculate output amount using constant product formula
 * amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
 */
export function calculateAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
    return BigInt(0);
  }
  
  const amountInWithFee = amountIn * BigInt(997);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;
  
  return numerator / denominator;
}

/**
 * Calculate required input for desired output
 * amountIn = (amountOut * reserveIn * 1000) / ((reserveOut - amountOut) * 997)
 */
export function calculateAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (reserveOut <= amountOut) {
    return BigInt(0);
  }
  
  const numerator = amountOut * reserveIn * BigInt(1000);
  const denominator = (reserveOut - amountOut) * BigInt(997);
  
  return (numerator / denominator) + BigInt(1);
}

/**
 * Calculate TVL from reserves and prices
 */
export function calculateTVL(
  reserve0: bigint,
  reserve1: bigint,
  price0USD: number,
  price1USD: number,
  decimals0: number,
  decimals1: number
): number {
  const amount0 = Number(ethers.formatUnits(reserve0, decimals0));
  const amount1 = Number(ethers.formatUnits(reserve1, decimals1));
  
  return (amount0 * price0USD) + (amount1 * price1USD);
}

/**
 * Calculate APY from fees and TVL
 * APY = (fees * 365) / TVL * 100
 */
export function calculateAPY(fees24h: number, tvl: number): number {
  if (tvl === 0) return 0;
  const annualFees = fees24h * 365;
  return (annualFees / tvl) * 100;
}

/**
 * Format gas estimate to USD
 */
export function formatGasEstimate(gasLimit: bigint, gasPrice: bigint, dcPriceUSD: number): number {
  const gasCost = gasLimit * gasPrice;
  const gasCostDC = Number(ethers.formatUnits(gasCost, 18));
  
  return gasCostDC * dcPriceUSD;
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(
  amountIn: bigint,
  amountOut: bigint,
  slippage: number,
  deadline: number
): { valid: boolean; error?: string } {
  if (amountIn <= BigInt(0)) {
    return { valid: false, error: 'Amount in must be greater than 0' };
  }
  
  if (amountOut <= BigInt(0)) {
    return { valid: false, error: 'Amount out must be greater than 0' };
  }
  
  if (slippage < 0.01 || slippage > 50) {
    return { valid: false, error: 'Slippage must be between 0.01% and 50%' };
  }
  
  if (deadline < 60 || deadline > 3600) {
    return { valid: false, error: 'Deadline must be between 1 and 60 minutes' };
  }
  
  return { valid: true };
}

/**
 * Validate liquidity parameters
 */
export function validateLiquidityParams(
  amount0: bigint,
  amount1: bigint,
  token0Balance: bigint,
  token1Balance: bigint
): { valid: boolean; error?: string } {
  if (amount0 <= BigInt(0)) {
    return { valid: false, error: 'Token 0 amount must be greater than 0' };
  }
  
  if (amount1 <= BigInt(0)) {
    return { valid: false, error: 'Token 1 amount must be greater than 0' };
  }
  
  if (amount0 > token0Balance) {
    return { valid: false, error: 'Insufficient token 0 balance' };
  }
  
  if (amount1 > token1Balance) {
    return { valid: false, error: 'Insufficient token 1 balance' };
  }
  
  return { valid: true };
}

/**
 * Check if price impact is acceptable
 */
export function isPriceImpactAcceptable(priceImpact: number): boolean {
  // Warn if price impact > 1%
  if (priceImpact > 1) {
    console.warn(`High price impact: ${priceImpact.toFixed(2)}%`);
  }
  
  // Reject if price impact > 5%
  if (priceImpact > 5) {
    return false;
  }
  
  return true;
}

/**
 * Sort token addresses for pair creation
 * Ensures consistent ordering (token0 < token1)
 */
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  const normalizedA = tokenA.toLowerCase();
  const normalizedB = tokenB.toLowerCase();
  
  return normalizedA < normalizedB ? [tokenA, tokenB] : [tokenB, tokenA];
}

/**
 * Calculate pool share percentage
 */
export function calculatePoolShare(
  lpBalance: bigint,
  totalSupply: bigint
): number {
  if (totalSupply === BigInt(0)) return 0;
  
  return (Number(lpBalance) / Number(totalSupply)) * 100;
}

/**
 * Calculate liquidity position value
 */
export function calculatePositionValue(
  token0Amount: bigint,
  token1Amount: bigint,
  price0USD: number,
  price1USD: number,
  decimals0: number,
  decimals1: number
): number {
  const amount0 = Number(ethers.formatUnits(token0Amount, decimals0));
  const amount1 = Number(ethers.formatUnits(token1Amount, decimals1));
  
  return (amount0 * price0USD) + (amount1 * price1USD);
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 6): string {
  return price.toFixed(decimals);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, length: number = 6): string {
  return `${address.slice(0, length)}...${address.slice(-4)}`;
}

/**
 * Check if address is a token contract
 */
export function isTokenAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address) && address !== '0x0000000000000000000000000000000000000000000000';
}

/**
 * Calculate deadline timestamp
 */
export function calculateDeadline(minutes: number): number {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}

/**
 * Get token info from pool
 */
export function getTokenFromPool(pool: DexPool, tokenAddress: string): TokenInfo | null {
  if (pool.token0.address.toLowerCase() === tokenAddress.toLowerCase()) {
    return pool.token0;
  }
  if (pool.token1.address.toLowerCase() === tokenAddress.toLowerCase()) {
    return pool.token1;
  }
  return null;
}

/**
 * Calculate optimal liquidity amounts
 * Ensures balanced liquidity provision
 */
export function calculateOptimalLiquidity(
  reserve0: bigint,
  reserve1: bigint,
  desiredAmount0: bigint,
  decimals0: number,
  decimals1: number
): { amount0: bigint; amount1: bigint } {
  if (reserve0 === BigInt(0) && reserve1 === BigInt(0)) {
    // First liquidity provider - use desired amounts
    return { amount0: desiredAmount0, amount1: desiredAmount0 };
  }
  
  // Calculate optimal amount1 based on pool ratio
  const ratio = Number(ethers.formatUnits(reserve1, decimals1)) / Number(ethers.formatUnits(reserve0, decimals0));
  const optimalAmount1 = parseTokenAmount(
    (Number(ethers.formatUnits(desiredAmount0, decimals0)) * ratio).toFixed(decimals1),
    decimals1
  );
  
  return { amount0: desiredAmount0, amount1: optimalAmount1 };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if two tokens form a valid pair
 */
export function isValidPair(tokenA: string, tokenB: string): boolean {
  return tokenA.toLowerCase() !== tokenB.toLowerCase() && isTokenAddress(tokenA) && isTokenAddress(tokenB);
}

/**
 * Calculate LP token amount for liquidity provision
 * LP = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
 */
export function calculateLPTokenAmount(
  amount0: bigint,
  amount1: bigint,
  totalSupply: bigint,
  reserve0: bigint,
  reserve1: bigint
): bigint {
  const MINIMUM_LIQUIDITY = BigInt(10 ** 3); // 1000
  
  if (totalSupply === BigInt(0)) {
    // First liquidity provision
    const sqrtAmount = BigInt(Math.floor(Math.sqrt(Number(amount0 * amount1))));
    return sqrtAmount - MINIMUM_LIQUIDITY;
  }
  
  // Calculate based on existing pool ratio
  const amount0LP = (amount0 * totalSupply) / reserve0;
  const amount1LP = (amount1 * totalSupply) / reserve1;
  
  // Return minimum of the two calculations
  return amount0LP < amount1LP ? amount0LP : amount1LP;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get token pair key for caching
 */
export function getPairKey(tokenA: string, tokenB: string): string {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  return `${token0}-${token1}`;
}

/**
 * Parse error message from contract error
 */
export function parseContractError(error: any): string {
  if (error?.reason) {
    return error.reason;
  }
  
  if (error?.message) {
    // Common error patterns
    if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
      return 'Insufficient output amount. Try increasing slippage tolerance.';
    }
    if (error.message.includes('INSUFFICIENT_LIQUIDITY')) {
      return 'Insufficient liquidity in pool. Try a smaller amount.';
    }
    if (error.message.includes('TRANSFER_FAILED')) {
      return 'Token transfer failed. Check your allowance.';
    }
    if (error.message.includes('K')) {
      return 'Invalid price. Try again.';
    }
    if (error.message.includes('EXPIRED')) {
      return 'Transaction expired. Please try again.';
    }
    
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Check if user has sufficient balance
 */
export function hasSufficientBalance(balance: bigint, required: bigint): boolean {
  return balance >= required;
}

/**
 * Calculate fee amount
 */
export function calculateFee(amount: bigint, feePercent: number = 0.3): bigint {
  const feeMultiplier = BigInt(Math.floor(feePercent * 10));
  return (amount * feeMultiplier) / BigInt(1000);
}
