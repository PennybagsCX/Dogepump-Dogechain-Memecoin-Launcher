import { ethers } from 'ethers';

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostUSD: number;
  estimatedTime: number;
}

export interface GasPriceCache {
  gasPrice: string;
  timestamp: number;
  ttl: number;
}

export class GasEstimator {
  private provider: ethers.Provider;
  private gasPriceCache: GasPriceCache | null;
  private gasCostUSD: number;

  // Cache TTL in milliseconds (1 minute)
  private readonly GAS_PRICE_CACHE_TTL = 60000;

  // Gas limits for different operations
  private readonly SWAP_GAS_LIMIT = 200000n;
  private readonly SWAP_MULTI_HOP_GAS_LIMIT = 300000n;
  private readonly ADD_LIQUIDITY_GAS_LIMIT = 250000n;
  private readonly REMOVE_LIQUIDITY_GAS_LIMIT = 200000n;

  // Base gas prices (in gwei)
  private readonly SLOW_GAS_PRICE = 5;
  private readonly AVERAGE_GAS_PRICE = 10;
  private readonly FAST_GAS_PRICE = 20;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.gasPriceCache = null;
    this.gasCostUSD = 0;
  }

  /**
   * Get current gas price with caching
   */
  async getGasPrice(): Promise<string> {
    const now = Date.now();

    // Check cache
    if (this.gasPriceCache && now - this.gasPriceCache.timestamp < this.gasPriceCache.ttl) {
      return this.gasPriceCache.gasPrice;
    }

    // Fetch from provider
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice?.toString() || ethers.parseUnits('10', 'gwei').toString();

    // Update cache
    this.gasPriceCache = {
      gasPrice,
      timestamp: now,
      ttl: this.GAS_PRICE_CACHE_TTL,
    };

    return gasPrice;
  }

  /**
   * Get gas price in gwei
   */
  async getGasPriceGwei(): Promise<number> {
    const gasPrice = await this.getGasPrice();
    return parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
  }

  /**
   * Get gas prices for different speeds
   */
  async getGasPrices(): Promise<{
    slow: string;
    average: string;
    fast: string;
  }> {
    const currentGasPrice = await this.getGasPrice();
    const currentGasPriceGwei = parseFloat(ethers.formatUnits(currentGasPrice, 'gwei'));

    const slowGwei = Math.max(currentGasPriceGwei * 0.5, this.SLOW_GAS_PRICE);
    const averageGwei = Math.max(currentGasPriceGwei, this.AVERAGE_GAS_PRICE);
    const fastGwei = Math.max(currentGasPriceGwei * 1.5, this.FAST_GAS_PRICE);

    return {
      slow: (BigInt(slowGwei) * BigInt(1e9)).toString(),
      average: (BigInt(averageGwei) * BigInt(1e9)).toString(),
      fast: (BigInt(fastGwei) * BigInt(1e9)).toString(),
    };
  }

  /**
   * Estimate gas for swap
   */
  async estimateSwapGas(multiHop: boolean = false): Promise<GasEstimate> {
    const gasLimit = multiHop ? this.SWAP_MULTI_HOP_GAS_LIMIT : this.SWAP_GAS_LIMIT;
    const gasPrice = await this.getGasPrice();

    return this.calculateGasEstimate(gasLimit, gasPrice);
  }

  /**
   * Estimate gas for add liquidity
   */
  async estimateAddLiquidityGas(): Promise<GasEstimate> {
    const gasLimit = this.ADD_LIQUIDITY_GAS_LIMIT;
    const gasPrice = await this.getGasPrice();

    return this.calculateGasEstimate(gasLimit, gasPrice);
  }

  /**
   * Estimate gas for remove liquidity
   */
  async estimateRemoveLiquidityGas(): Promise<GasEstimate> {
    const gasLimit = this.REMOVE_LIQUIDITY_GAS_LIMIT;
    const gasPrice = await this.getGasPrice();

    return this.calculateGasEstimate(gasLimit, gasPrice);
  }

  /**
   * Estimate gas for a custom operation
   */
  async estimateCustomGas(gasLimit: string | bigint): Promise<GasEstimate> {
    const gasPrice = await this.getGasPrice();
    return this.calculateGasEstimate(BigInt(gasLimit), gasPrice);
  }

  /**
   * Calculate gas estimate from gas limit and price
   */
  private calculateGasEstimate(gasLimit: bigint, gasPrice: string): GasEstimate {
    const gasPriceBN = BigInt(gasPrice);
    const gasCost = gasLimit * gasPriceBN;
    const gasCostUSD = this.convertGasCostToUSD(gasCost);

    return {
      gasLimit: gasLimit.toString(),
      gasPrice,
      gasCost: gasCost.toString(),
      gasCostUSD,
      estimatedTime: this.estimateConfirmationTime(gasPriceBN),
    };
  }

  /**
   * Convert gas cost to USD
   */
  convertGasCostToUSD(gasCost: string | bigint): number {
    const gasCostBN = BigInt(gasCost);
    const gasCostETH = parseFloat(ethers.formatEther(gasCostBN));
    return gasCostETH * this.gasCostUSD;
  }

  /**
   * Estimate confirmation time based on gas price
   */
  private estimateConfirmationTime(gasPrice: bigint): number {
    const gasPriceGwei = parseFloat(ethers.formatUnits(gasPrice, 'gwei'));

    if (gasPriceGwei < 5) return 300; // 5 minutes
    if (gasPriceGwei < 10) return 120; // 2 minutes
    if (gasPriceGwei < 20) return 60; // 1 minute
    return 30; // 30 seconds
  }

  /**
   * Set gas cost USD conversion rate
   */
  setGasCostUSD(rate: number): void {
    this.gasCostUSD = rate;
  }

  /**
   * Get gas cost USD conversion rate
   */
  getGasCostUSD(): number {
    return this.gasCostUSD;
  }

  /**
   * Format gas cost for display
   */
  formatGasCost(gasCost: string | bigint): string {
    const gasCostBN = BigInt(gasCost);
    const gasCostETH = parseFloat(ethers.formatEther(gasCostBN));

    if (gasCostETH < 0.001) {
      return `${(gasCostETH * 1000000).toFixed(2)} gwei`;
    }
    if (gasCostETH < 0.01) {
      return `${(gasCostETH * 1000).toFixed(2)} mETH`;
    }
    return `${gasCostETH.toFixed(4)} ETH`;
  }

  /**
   * Format gas cost in USD
   */
  formatGasCostUSD(gasCostUSD: number): string {
    if (gasCostUSD < 0.01) {
      return `<$0.01`;
    }
    if (gasCostUSD < 1) {
      return `$${gasCostUSD.toFixed(2)}`;
    }
    return `$${gasCostUSD.toFixed(2)}`;
  }

  /**
   * Format gas limit for display
   */
  formatGasLimit(gasLimit: string | bigint): string {
    const gasLimitNum = Number(gasLimit);
    if (gasLimitNum >= 1000000) {
      return `${(gasLimitNum / 1000000).toFixed(2)}M`;
    }
    if (gasLimitNum >= 1000) {
      return `${(gasLimitNum / 1000).toFixed(2)}K`;
    }
    return gasLimitNum.toString();
  }

  /**
   * Format gas price for display
   */
  formatGasPrice(gasPrice: string | bigint): string {
    const gasPriceGwei = parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
    return `${gasPriceGwei.toFixed(2)} gwei`;
  }

  /**
   * Format gas estimate for display
   */
  formatGasEstimate(estimate: GasEstimate): {
    gasLimit: string;
    gasPrice: string;
    gasCost: string;
    gasCostUSD: string;
    estimatedTime: string;
  } {
    return {
      gasLimit: this.formatGasLimit(estimate.gasLimit),
      gasPrice: this.formatGasPrice(estimate.gasPrice),
      gasCost: this.formatGasCost(estimate.gasCost),
      gasCostUSD: this.formatGasCostUSD(estimate.gasCostUSD),
      estimatedTime: this.formatEstimatedTime(estimate.estimatedTime),
    };
  }

  /**
   * Format estimated time for display
   */
  formatEstimatedTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  /**
   * Clear gas price cache
   */
  clearCache(): void {
    this.gasPriceCache = null;
  }

  /**
   * Estimate gas for transaction
   */
  async estimateTransactionGas(
    to: string,
    data: string,
    value: string = '0'
  ): Promise<GasEstimate> {
    const gasLimit = await this.provider.estimateGas({
      to,
      data,
      value,
    });

    const gasPrice = await this.getGasPrice();

    return this.calculateGasEstimate(gasLimit, gasPrice);
  }

  /**
   * Get recommended gas price for transaction
   */
  async getRecommendedGasPrice(priority: 'slow' | 'average' | 'fast' = 'average'): Promise<string> {
    const gasPrices = await this.getGasPrices();
    return gasPrices[priority];
  }

  /**
   * Check if gas price is high
   */
  async isGasPriceHigh(threshold: number = 20): Promise<boolean> {
    const gasPriceGwei = await this.getGasPriceGwei();
    return gasPriceGwei > threshold;
  }

  /**
   * Get gas savings estimate for lower gas price
   */
  async getGasSavings(currentGasPrice: string, targetGasPrice: string, gasLimit: string | bigint): Promise<{
    gasSaved: string;
    usdSaved: number;
  }> {
    const currentGasPriceBN = BigInt(currentGasPrice);
    const targetGasPriceBN = BigInt(targetGasPrice);
    const gasLimitBN = BigInt(gasLimit);

    const gasSaved = (currentGasPriceBN - targetGasPriceBN) * gasLimitBN;
    const usdSaved = this.convertGasCostToUSD(gasSaved);

    return {
      gasSaved: gasSaved.toString(),
      usdSaved,
    };
  }

  /**
   * Calculate max gas cost for a budget
   */
  calculateMaxGasCostForBudget(budgetUSD: number): {
    maxGasPrice: string;
    maxGasLimit: string;
  } {
    const maxGasCostETH = budgetUSD / this.gasCostUSD;
    const maxGasCostWei = ethers.parseEther(maxGasCostETH.toString());

    // Assuming average gas limit of 200,000
    const maxGasPrice = maxGasCostWei / 200000n;

    return {
      maxGasPrice: maxGasPrice.toString(),
      maxGasLimit: '200000',
    };
  }

  /**
   * Get gas statistics
   */
  async getGasStatistics(): Promise<{
    current: string;
    slow: string;
    average: string;
    fast: string;
    isHigh: boolean;
  }> {
    const [current, gasPrices] = await Promise.all([
      this.getGasPrice(),
      this.getGasPrices(),
    ]);

    const currentGwei = parseFloat(ethers.formatUnits(current, 'gwei'));

    return {
      current,
      slow: gasPrices.slow,
      average: gasPrices.average,
      fast: gasPrices.fast,
      isHigh: currentGwei > 20,
    };
  }
}

export default GasEstimator;
