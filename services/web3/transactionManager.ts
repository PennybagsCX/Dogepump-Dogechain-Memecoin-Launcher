/**
 * Transaction Retry Manager
 *
 * Provides automatic retry functionality for blockchain transactions with:
 * - Exponential backoff
 * - Gas price adjustment
 * - Nonce management
 * - Transaction replacement
 * - Comprehensive error handling
 */

import { ethers } from 'ethers';
import { logger } from '../server/utils/logger.js';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number; // Maximum number of retry attempts (default: 3)
  initialDelay?: number; // Initial delay before first retry in ms (default: 1000)
  maxDelay?: number; // Maximum delay between retries in ms (default: 30000)
  backoffMultiplier?: number; // Multiplier for exponential backoff (default: 2)
  gasPriceIncrease?: number; // Percentage to increase gas price (default: 10)
  gasLimitIncrease?: number; // Percentage to increase gas limit (default: 5)
  timeout?: number; // Timeout for transaction confirmation in ms (default: 60000)
}

/**
 * Transaction result with receipt
 */
export interface TransactionResult {
  receipt: ethers.ContractTransactionReceipt;
  attempts: number;
  totalDuration: number;
  finalGasPrice: bigint;
  finalGasLimit: bigint;
}

/**
 * Transaction error with retry information
 */
export interface TransactionError extends Error {
  code?: string;
  reason?: string;
  tx?: ethers.ContractTransactionResponse;
  attempts?: number;
  canRetry?: boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  gasPriceIncrease: 10, // 10% increase
  gasLimitIncrease: 5, // 5% increase
  timeout: 60000, // 60 seconds
};

/**
 * Transaction Retry Manager
 */
export class TransactionRetryManager {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  /**
   * Execute a transaction with automatic retry
   * @param transactionFunction - Function that returns the transaction promise
   * @param options - Override default retry options for this transaction
   * @returns Transaction receipt with retry metadata
   */
  async executeWithRetry(
    transactionFunction: () => Promise<ethers.ContractTransactionResponse>,
    options: RetryOptions = {}
  ): Promise<TransactionResult> {
    const retryOptions = { ...this.options, ...options };
    const startTime = Date.now();
    let lastError: Error | null = null;
    let currentGasPrice: bigint | null = null;
    let currentGasLimit: bigint | null = null;

    for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        logger.info({ attempt }, `Executing transaction (attempt ${attempt}/${retryOptions.maxRetries})`);

        // Execute transaction
        const tx = await transactionFunction();

        // Extract gas price and limit from transaction
        currentGasPrice = tx.gasPrice || null;
        currentGasLimit = tx.gasLimit || null;

        logger.info(
          {
            hash: tx.hash,
            gasPrice: currentGasPrice?.toString(),
            gasLimit: currentGasLimit?.toString(),
          },
          'Transaction sent, waiting for confirmation...'
        );

        // Wait for transaction confirmation
        const receipt = await tx.wait(retryOptions.timeout);

        const duration = Date.now() - startTime;

        logger.info(
          {
            hash: tx.hash,
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed.toString(),
            attempts: attempt,
            duration,
          },
          'Transaction confirmed successfully'
        );

        return {
          receipt: receipt!,
          attempts: attempt,
          totalDuration: duration,
          finalGasPrice: currentGasPrice || 0n,
          finalGasLimit: currentGasLimit || 0n,
        };
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          logger.error({ error, attempt }, 'Non-retryable error encountered');
          throw this.enrichError(error, attempt, false);
        }

        // Log retry attempt
        logger.warn(
          {
            error: (error as Error).message,
            attempt,
            maxRetries: retryOptions.maxRetries,
          },
          'Transaction failed, retrying...'
        );

        // If this is not the last attempt, wait before retrying
        if (attempt < retryOptions.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryOptions);
          logger.info({ delay }, `Waiting ${delay}ms before retry...`);

          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    logger.error(
      { attempts: retryOptions.maxRetries, error: lastError?.message },
      'Transaction failed after all retry attempts'
    );

    throw this.enrichError(lastError!, retryOptions.maxRetries, true);
  }

  /**
   * Execute a transaction with gas price adjustment
   * @param transactionFunction - Function that receives gas price and returns transaction
   * @param options - Retry options
   * @returns Transaction receipt
   */
  async executeWithGasAdjustment(
    transactionFunction: (gasPrice?: bigint, gasLimit?: bigint) => Promise<ethers.ContractTransactionResponse>,
    options: RetryOptions = {}
  ): Promise<TransactionResult> {
    const retryOptions = { ...this.options, ...options };
    const startTime = Date.now();
    let currentGasPrice: bigint = 0n;
    let currentGasLimit: bigint = 0n;

    for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        logger.info({ attempt }, `Executing transaction with gas adjustment (attempt ${attempt})`);

        // Execute transaction with current gas parameters
        const tx = await transactionFunction(
          currentGasPrice || undefined,
          currentGasLimit || undefined
        );

        logger.info(
          {
            hash: tx.hash,
            gasPrice: tx.gasPrice?.toString(),
            gasLimit: tx.gasLimit?.toString(),
          },
          'Transaction sent, waiting for confirmation...'
        );

        // Wait for confirmation
        const receipt = await tx.wait(retryOptions.timeout);

        const duration = Date.now() - startTime;

        logger.info(
          {
            hash: tx.hash,
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed.toString(),
            attempts: attempt,
            duration,
          },
          'Transaction confirmed successfully'
        );

        return {
          receipt: receipt!,
          attempts: attempt,
          totalDuration: duration,
          finalGasPrice: tx.gasPrice || 0n,
          finalGasLimit: tx.gasLimit || 0n,
        };
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          logger.error({ error, attempt }, 'Non-retryable error encountered');
          throw this.enrichError(error, attempt, false);
        }

        // Calculate new gas price and limit for retry
        if (attempt < retryOptions.maxRetries) {
          // Get initial gas price if not set
          if (currentGasPrice === 0n) {
            try {
              const provider = await this.getProvider();
              const feeData = await provider.getFeeData();
              currentGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
              currentGasLimit = ethers.BigInt.from(300000); // Default gas limit
            } catch (providerError) {
              logger.error({ error: providerError }, 'Failed to get fee data, using defaults');
              currentGasPrice = ethers.parseUnits('20', 'gwei');
              currentGasLimit = ethers.BigInt.from(300000);
            }
          }

          // Increase gas price and limit
          currentGasPrice = this.increaseGasPrice(currentGasPrice, retryOptions.gasPriceIncrease);
          currentGasLimit = this.increaseGasLimit(currentGasLimit, retryOptions.gasLimitIncrease);

          logger.info(
            {
              attempt: attempt + 1,
              newGasPrice: currentGasPrice.toString(),
              newGasLimit: currentGasLimit.toString(),
            },
            'Increased gas price and limit for next retry'
          );
        }

        // Log retry attempt
        logger.warn(
          {
            error: errorMessage,
            attempt,
            maxRetries: retryOptions.maxRetries,
          },
          'Transaction failed, retrying with increased gas...'
        );

        // Wait before retrying
        if (attempt < retryOptions.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryOptions);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const finalError: TransactionError = new Error(
      `Transaction failed after ${retryOptions.maxRetries} attempts`
    ) as TransactionError;
    finalError.attempts = retryOptions.maxRetries;
    finalError.canRetry = false;

    throw finalError;
  }

  /**
   * Replace a pending transaction with higher gas price
   * @param originalTx - Original transaction to replace
   * @param newTransactionFunction - Function to create new transaction
   * @param gasPriceIncrease - Percentage to increase gas price
   * @returns New transaction receipt
   */
  async replaceTransaction(
    originalTx: ethers.ContractTransactionResponse,
    newTransactionFunction: (nonce: number, gasPrice: bigint) => Promise<ethers.ContractTransactionResponse>,
    gasPriceIncrease: number = this.options.gasPriceIncrease
  ): Promise<TransactionResult> {
    const originalGasPrice = originalTx.gasPrice || ethers.parseUnits('20', 'gwei');
    const newGasPrice = this.increaseGasPrice(originalGasPrice, gasPriceIncrease);

    logger.info(
      {
        originalTx: originalTx.hash,
        originalGasPrice: originalGasPrice.toString(),
        newGasPrice: newGasPrice.toString(),
      },
      'Replacing transaction with higher gas price'
    );

    try {
      // Get nonce from original transaction
      const nonce = originalTx.nonce;

      // Send new transaction with higher gas price
      const newTx = await newTransactionFunction(nonce, newGasPrice);

      logger.info({ newTx: newTx.hash }, 'Replacement transaction sent');

      // Wait for confirmation
      const receipt = await newTx.wait();

      logger.info(
        {
          originalTx: originalTx.hash,
          newTx: newTx.hash,
          blockNumber: receipt?.blockNumber,
        },
        'Replacement transaction confirmed'
      );

      return {
        receipt: receipt!,
        attempts: 1,
        totalDuration: 0,
        finalGasPrice: newGasPrice,
        finalGasLimit: newTx.gasLimit || 0n,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to replace transaction');
      throw error;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const errorMessage = (error as Error).message.toLowerCase();

    // Retryable errors
    const retryablePatterns = [
      'network error',
      'timeout',
      'nonce too low',
      'nonce too high',
      'replacement transaction underpriced',
      'transaction underpriced',
      'insufficient funds',
      'exceeds block gas limit',
      'try again later',
      'confl',
    ];

    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  /**
   * Enrich error with retry metadata
   */
  private enrichError(error: unknown, attempts: number, canRetry: boolean): TransactionError {
    const enrichedError = error as TransactionError;
    enrichedError.attempts = attempts;
    enrichedError.canRetry = canRetry;

    if (!enrichedError.message) {
      enrichedError.message = 'Unknown transaction error';
    }

    return enrichedError;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, options: Required<RetryOptions>): number {
    // Exponential backoff: delay = initialDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);

    // Cap at max delay
    return Math.min(exponentialDelay, options.maxDelay);
  }

  /**
   * Increase gas price by percentage
   */
  private increaseGasPrice(currentGasPrice: bigint, percentage: number): bigint {
    const increase = (currentGasPrice * BigInt(percentage)) / BigInt(100);
    return currentGasPrice + increase;
  }

  /**
   * Increase gas limit by percentage
   */
  private increaseGasLimit(currentGasLimit: bigint, percentage: number): bigint {
    const increase = (currentGasLimit * BigInt(percentage)) / BigInt(100);
    return currentGasLimit + increase;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get provider from first available signer
   */
  private async getProvider(): Promise<ethers.Provider> {
    // This is a placeholder - in real implementation, get provider from app context
    throw new Error('Provider not available in TransactionManager context');
  }
}

// Export singleton instance
export const transactionManager = new TransactionRetryManager();

/**
 * Helper function to execute transaction with retry
 * @param transactionFunction - Function that returns transaction promise
 * @param options - Retry options
 * @returns Transaction receipt
 */
export async function executeTxWithRetry(
  transactionFunction: () => Promise<ethers.ContractTransactionResponse>,
  options?: RetryOptions
): Promise<TransactionResult> {
  const manager = new TransactionRetryManager(options);
  return manager.executeWithRetry(transactionFunction);
}

/**
 * Helper function to get user-friendly error message
 * @param error - Transaction error
 * @returns User-friendly error message
 */
export function getTransactionErrorMessage(error: TransactionError): string {
  const message = error.message.toLowerCase();

  if (message.includes('insufficient funds')) {
    return 'Insufficient balance to complete this transaction. Please add more funds to your wallet.';
  }

  if (message.includes('nonce')) {
    return 'Transaction pending. Please wait a few seconds and try again.';
  }

  if (message.includes('gas required exceeds allowance')) {
    return 'Insufficient gas. Please increase gas limit and try again.';
  }

  if (message.includes('replacement transaction underpriced')) {
    return 'Gas price too low. Please increase gas price and try again.';
  }

  if (message.includes('network')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  if (message.includes('timeout')) {
    return 'Transaction timed out. The network may be congested. Please try again.';
  }

  if (message.includes('execution reverted')) {
    // Try to extract revert reason
    const match = message.match(/reason="([^"]+)"/);
    if (match) {
      return `Transaction failed: ${match[1]}`;
    }
    return 'Transaction failed. Please check your inputs and try again.';
  }

  // Default error message
  return 'Transaction failed. Please try again.';
}
