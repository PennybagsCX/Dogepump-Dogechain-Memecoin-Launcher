/**
 * DEX Logger Utility
 *
 * Provides structured logging for DEX operations with Sentry integration.
 * Replaces console.log statements throughout the DEX codebase.
 */

import { captureMessage, addBreadcrumb, captureException as captureSentryException } from '../services/sentryClient';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Log a message with the specified level
 */
export const logMessage = (level: LogLevel, message: string, context?: LogContext) => {
  // Map LogLevel to sentry level
  const sentryLevel: 'info' | 'warning' | 'error' = level === 'debug' ? 'info' : level === 'warn' ? 'warning' : level;

  // Add breadcrumb for all log levels
  addBreadcrumb('dex', message, sentryLevel, context);

  // Capture message based on level
  if (level === 'error') {
    captureMessage(message, 'error', context);
  } else if (level === 'warn') {
    captureMessage(message, 'warning', context);
  } else {
    captureMessage(message, 'info', context);
  }

  // Still log to console in development for debugging
  if (import.meta.env.DEV) {
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[DEX ${level.toUpperCase()}]`, message, context || '');
  }
};

/**
 * Debug level logging
 */
export const logDebug = (message: string, context?: LogContext) => {
  logMessage('debug', message, context);
};

/**
 * Info level logging
 */
export const logInfo = (message: string, context?: LogContext) => {
  logMessage('info', message, context);
};

/**
 * Warning level logging
 */
export const logWarn = (message: string, context?: LogContext) => {
  logMessage('warn', message, context);
};

/**
 * Error level logging
 */
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => {
  const errorContext = {
    ...context,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  };

  logMessage('error', message, errorContext);

  // Capture exception separately for better error tracking
  if (error instanceof Error) {
    captureSentryException(error, context);
  }
};

/**
 * Log DEX swap operations
 */
export const logSwap = (action: string, data: {
  fromToken?: string;
  toToken?: string;
  amountIn?: string;
  amountOut?: string;
  txHash?: string;
  error?: string;
}) => {
  logInfo(`DEX Swap: ${action}`, {
    category: 'dex_swap',
    ...data
  });
};

/**
 * Log liquidity operations
 */
export const logLiquidity = (action: 'add' | 'remove' | 'stake' | 'unstake', data: {
  poolAddress?: string;
  lpTokenAmount?: string;
  tokenA?: string;
  tokenB?: string;
  amountA?: string;
  amountB?: string;
  txHash?: string;
  error?: string;
}) => {
  logInfo(`DEX Liquidity: ${action}`, {
    category: 'dex_liquidity',
    ...data
  });
};

/**
 * Log pool operations
 */
export const logPool = (action: string, data: {
  poolAddress?: string;
  tokenA?: string;
  tokenB?: string;
  error?: string;
}) => {
  logInfo(`DEX Pool: ${action}`, {
    category: 'dex_pool',
    ...data
  });
};

/**
 * Log transaction operations
 */
export const logTransaction = (action: 'pending' | 'confirmed' | 'failed' | 'cancelled', data: {
  txType?: string;
  txHash?: string;
  fromToken?: string;
  toToken?: string;
  amount?: string;
  error?: string;
  gasUsed?: string;
}) => {
  const level = action === 'failed' ? 'error' : 'info';
  logMessage(level, `Transaction ${action}`, {
    category: 'dex_transaction',
    ...data
  });
};

/**
 * Log wallet operations
 */
export const logWallet = (action: 'connect' | 'disconnect' | 'switch_network' | 'account_change', data: {
  address?: string;
  chainId?: number;
  network?: string;
  error?: string;
}) => {
  logInfo(`Wallet: ${action}`, {
    category: 'wallet',
    ...data
  });
};
