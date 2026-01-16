/**
 * Gas Price Spike Protection
 *
 * Prevents excessive gas fees during network congestion or gas price spikes
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

/**
 * Gas price configuration
 */
export interface GasPriceConfig {
  // Maximum gas price in gwei (100 gwei = 100,000,000,000 wei)
  maxGasPrice: number;

  // Warning threshold as percentage of max (0-100)
  warningThreshold: number;

  // Recommended gas price multiplier (1.0 = current, 1.1 = 10% higher)
  recommendedMultiplier: number;

  // Minimum gas price in gwei
  minGasPrice: number;
}

/**
 * Gas price status
 */
export enum GasPriceStatus {
  LOW = 'LOW',           // Below 50% of max
  NORMAL = 'NORMAL',     // 50-75% of max
  HIGH = 'HIGH',         // 75-90% of max
  EXTREME = 'EXTREME',   // 90-100% of max
  BLOCKED = 'BLOCKED',   // Above max
}

/**
 * Gas price analysis result
 */
export interface GasPriceAnalysis {
  currentGasPrice: bigint;       // Current gas price in wei
  currentGasPriceGwei: number;   // Current gas price in gwei
  maxGasPrice: bigint;           // Maximum allowed gas price in wei
  maxGasPriceGwei: number;       // Maximum allowed gas price in gwei
  percentageOfMax: number;       // Current as percentage of max
  status: GasPriceStatus;        // Status category
  recommendedGasPrice: bigint;   // Recommended gas price in wei
  recommendedGasPriceGwei: number; // Recommended gas price in gwei
  warning?: string;              // Warning message if applicable
  canTransact: boolean;          // Whether transactions are allowed
}

/**
 * Default gas price configuration
 */
export const DEFAULT_GAS_CONFIG: GasPriceConfig = {
  maxGasPrice: 100,      // 100 gwei maximum
  warningThreshold: 75,  // Warn at 75% of max
  recommendedMultiplier: 1.1, // Recommend 10% above current
  minGasPrice: 1,         // 1 gwei minimum
};

/**
 * Gas price protection service
 */
export class GasPriceProtection {
  private config: GasPriceConfig;
  private provider: ethers.Provider;

  constructor(
    provider: ethers.Provider,
    config: GasPriceConfig = DEFAULT_GAS_CONFIG
  ) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Get current gas price from network
   */
  async getCurrentGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();

      // EIP-1559 networks use maxFeePerGas, legacy uses gasPrice
      if (feeData.maxFeePerGas) {
        return feeData.maxFeePerGas;
      }

      if (feeData.gasPrice) {
        return feeData.gasPrice;
      }

      // Fallback to reasonable default
      return ethers.parseUnits('20', 'gwei');
    } catch (error) {
      logger.error('Failed to get gas price', error);
      // Return conservative estimate on error
      return ethers.parseUnits('50', 'gwei');
    }
  }

  /**
   * Convert wei to gwei
   */
  weiToGwei(wei: bigint): number {
    return Number(ethers.formatUnits(wei, 'gwei'));
  }

  /**
   * Convert gwei to wei
   */
  gweiToWei(gwei: number): bigint {
    return ethers.parseUnits(gwei.toString(), 'gwei');
  }

  /**
   * Analyze current gas price
   */
  async analyzeGasPrice(): Promise<GasPriceAnalysis> {
    const currentGasPrice = await this.getCurrentGasPrice();
    const currentGwei = this.weiToGwei(currentGasPrice);
    const maxWei = this.gweiToWei(this.config.maxGasPrice);
    const maxGwei = this.config.maxGasPrice;
    const percentageOfMax = (currentGwei / maxGwei) * 100;

    // Determine status
    let status: GasPriceStatus;
    let warning: string | undefined;

    if (currentGwei >= maxGwei) {
      status = GasPriceStatus.BLOCKED;
      warning = 'Gas prices are too high. Transactions are blocked.';
    } else if (percentageOfMax >= 90) {
      status = GasPriceStatus.EXTREME;
      warning = 'Extreme gas prices! Transactions will be very expensive.';
    } else if (percentageOfMax >= this.config.warningThreshold) {
      status = GasPriceStatus.HIGH;
      warning = 'High gas prices. Consider waiting for lower fees.';
    } else if (percentageOfMax >= 50) {
      status = GasPriceStatus.NORMAL;
    } else {
      status = GasPriceStatus.LOW;
    }

    // Calculate recommended gas price
    const recommendedMultiplier = status === GasPriceStatus.EXTREME
      ? 1.0 // Don't recommend increase when extreme
      : this.config.recommendedMultiplier;

    const recommendedGasPrice = (currentGasPrice * BigInt(Math.floor(recommendedMultiplier * 100))) / BigInt(100);

    return {
      currentGasPrice,
      currentGasPriceGwei: currentGwei,
      maxGasPrice: maxWei,
      maxGasPriceGwei: maxGwei,
      percentageOfMax,
      status,
      recommendedGasPrice,
      recommendedGasPriceGwei: this.weiToGwei(recommendedGasPrice),
      warning,
      canTransact: currentGwei < maxGwei,
    };
  }

  /**
   * Check if transaction should be allowed
   */
  async canTransact(customGasPrice?: bigint): Promise<{
    allowed: boolean;
    reason?: string;
    analysis: GasPriceAnalysis;
  }> {
    const analysis = await this.analyzeGasPrice();

    if (customGasPrice) {
      const customGwei = this.weiToGwei(customGasPrice);

      if (customGwei > this.config.maxGasPrice) {
        return {
          allowed: false,
          reason: `Custom gas price (${customGwei.toFixed(2)} gwei) exceeds maximum (${this.config.maxGasPrice} gwei)`,
          analysis,
        };
      }

      return {
        allowed: true,
        analysis,
      };
    }

    return {
      allowed: analysis.canTransact,
      reason: analysis.warning,
      analysis,
    };
  }

  /**
   * Estimate transaction cost in native token
   */
  async estimateTransactionCost(
    gasLimit: number | bigint,
    gasPrice?: bigint
  ): Promise<{
    gasPrice: bigint;
    gasPriceGwei: number;
    gasLimit: bigint;
    totalCost: bigint;
    totalCostFormatted: string;
  }> {
    const actualGasPrice = gasPrice || await this.getCurrentGasPrice();
    const gasLimitBig = BigInt(gasLimit);
    const totalCost = actualGasPrice * gasLimitBig;

    return {
      gasPrice: actualGasPrice,
      gasPriceGwei: this.weiToGwei(actualGasPrice),
      gasLimit: gasLimitBig,
      totalCost,
      totalCostFormatted: ethers.formatEther(totalCost),
    };
  }

  /**
   * Format gas price for display
   */
  formatGasPrice(gwei: number): string {
    if (gwei < 1) {
      return `${(gwei * 1000).toFixed(2)} nwei`;
    } else if (gwei < 1000) {
      return `${gwei.toFixed(2)} gwei`;
    } else {
      return `${(gwei / 1000).toFixed(2)} mwei`;
    }
  }

  /**
   * Get gas price recommendation
   */
  async getRecommendation(): Promise<{
    recommended: boolean;
    message: string;
    analysis: GasPriceAnalysis;
  }> {
    const analysis = await this.analyzeGasPrice();

    let recommended = true;
    let message = '';

    switch (analysis.status) {
      case GasPriceStatus.BLOCKED:
        recommended = false;
        message = `Gas prices are too high (${analysis.currentGasPriceGwei.toFixed(2)} gwei). Maximum allowed is ${analysis.maxGasPriceGwei} gwei. Please wait for gas prices to decrease.`;
        break;

      case GasPriceStatus.EXTREME:
        recommended = false;
        message = `Gas prices are extreme (${analysis.currentGasPriceGwei.toFixed(2)} gwei)! This transaction will cost significantly more than usual. We recommend waiting until gas prices drop below ${(analysis.maxGasPriceGwei * 0.75).toFixed(0)} gwei.`;
        break;

      case GasPriceStatus.HIGH:
        recommended = true;
        message = `Gas prices are elevated (${analysis.currentGasPriceGwei.toFixed(2)} gwei). Consider waiting for lower fees, or proceed if urgent.`;
        break;

      case GasPriceStatus.NORMAL:
        recommended = true;
        message = `Gas prices are normal (${analysis.currentGasPriceGwei.toFixed(2)} gwei). Good time to transact.`;
        break;

      case GasPriceStatus.LOW:
        recommended = true;
        message = `Gas prices are low (${analysis.currentGasPriceGwei.toFixed(2)} gwei)! Great time to transact.`;
        break;
    }

    return {
      recommended,
      message,
      analysis,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GasPriceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GasPriceConfig {
    return { ...this.config };
  }
}

/**
 * Create a gas price protection instance
 */
export function createGasPriceProtection(
  provider: ethers.Provider,
  config?: GasPriceConfig
): GasPriceProtection {
  return new GasPriceProtection(provider, config);
}

/**
 * Quick check if gas price allows transactions
 */
export async function checkGasPrice(
  provider: ethers.Provider,
  config?: GasPriceConfig
): Promise<GasPriceAnalysis> {
  const protection = createGasPriceProtection(provider, config);
  return await protection.analyzeGasPrice();
}

/**
 * Validate transaction gas price
 */
export async function validateTransactionGas(
  provider: ethers.Provider,
  gasPrice: bigint,
  config?: GasPriceConfig
): Promise<boolean> {
  const protection = createGasPriceProtection(provider, config);
  const { allowed } = await protection.canTransact(gasPrice);
  return allowed;
}
