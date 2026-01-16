/**
 * Web3 Transaction Error Handler
 *
 * Converts technical blockchain/Web3 errors into user-friendly messages
 */

export interface TransactionError {
  userMessage: string;
  technicalMessage: string;
  action?: string;
  errorCode: string;
}

/**
 * Maps technical error codes/patterns to user-friendly messages
 */
const ERROR_MAPPINGS: Record<string, Omit<TransactionError, 'errorCode'>> = {
  // Insufficient balance errors
  'INSUFFICIENT_FUNDS': {
    userMessage: 'Insufficient balance for this transaction.',
    technicalMessage: 'Insufficient funds to complete transaction',
    action: 'Please add more funds to your wallet and try again.',
  },
  'insufficient funds': {
    userMessage: 'Insufficient balance for this transaction.',
    technicalMessage: 'Insufficient funds to complete transaction',
    action: 'Please add more funds to your wallet and try again.',
  },

  // Gas-related errors
  'GAS_REQUIRED_EXCEEDS_ALLOWANCE': {
    userMessage: 'Insufficient gas for this transaction.',
    technicalMessage: 'Gas required exceeds allowance or gas limit too low',
    action: 'Please increase the gas limit and try again.',
  },
  'TRANSACTION_UNDERPRICED': {
    userMessage: 'Gas price too low.',
    technicalMessage: 'Replacement transaction underpriced',
    action: 'Please increase the gas price and try again.',
  },
  'replacement transaction underpriced': {
    userMessage: 'Gas price too low.',
    technicalMessage: 'Replacement transaction underpriced',
    action: 'Please increase the gas price and try again.',
  },

  // Nonce errors
  'NONCE_EXPIRED': {
    userMessage: 'Transaction nonce has expired.',
    technicalMessage: 'Nonce has already been used or too low',
    action: 'Please wait a moment and try again. If this persists, reset your account nonce.',
  },
  'nonce too low': {
    userMessage: 'Transaction nonce is too low.',
    technicalMessage: 'Nonce has already been used',
    action: 'Please wait for pending transactions to complete or reset your nonce.',
  },
  'nonce too high': {
    userMessage: 'Transaction nonce is too high.',
    technicalMessage: 'Nonce is ahead of expected value',
    action: 'Please wait and try again.',
  },

  // Network errors
  'NETWORK_ERROR': {
    userMessage: 'Network connection failed.',
    technicalMessage: 'Failed to connect to RPC endpoint',
    action: 'Please check your internet connection and try again.',
  },
  'TIMEOUT': {
    userMessage: 'Transaction timed out.',
    technicalMessage: 'Transaction request timed out',
    action: 'Please check if the transaction was confirmed and try again if needed.',
  },

  // Transaction reverted errors
  'EXECUTION_REVERTED': {
    userMessage: 'Transaction failed during execution.',
    technicalMessage: 'Transaction execution reverted',
    action: 'Please check your inputs and try again. Contact support if the issue persists.',
  },
  'execution reverted': {
    userMessage: 'Transaction failed during execution.',
    technicalMessage: 'Transaction execution reverted',
    action: 'Please check your inputs and try again.',
  },

  // User rejection
  'USER_REJECTED': {
    userMessage: 'Transaction was rejected.',
    technicalMessage: 'User rejected transaction',
    action: 'You cancelled the transaction in your wallet.',
  },
  'user rejected transaction': {
    userMessage: 'Transaction was rejected.',
    technicalMessage: 'User rejected transaction',
    action: 'You cancelled the transaction in your wallet.',
  },

  // Contract-specific errors
  'UNAUTHORIZED': {
    userMessage: 'You are not authorized to perform this action.',
    technicalMessage: 'Contract call unauthorized',
    action: 'Please check if you have the required permissions.',
  },
  'INVALID_CONTRACT': {
    userMessage: 'Invalid contract call.',
    technicalMessage: 'Contract function call invalid',
    action: 'Please check your inputs and try again.',
  },

  // Slippage errors
  'SLIPPAGE_EXCEEDED': {
    userMessage: 'Price changed too much.',
    technicalMessage: 'Transaction failed due to slippage tolerance exceeded',
    action: 'Please try again with a higher slippage tolerance or different amount.',
  },
  'Too little received': {
    userMessage: 'Price changed too much.',
    technicalMessage: 'Slippage tolerance exceeded',
    action: 'Please try again with a higher slippage tolerance.',
  },
};

/**
 * Extracts revert reason from transaction error
 */
function extractRevertReason(error: any): string | null {
  if (!error) return null;

  // Try to extract reason from error message
  const message = error.message || error.data?.message || error.reason || '';

  // Match various revert reason patterns
  const patterns = [
    /reason="([^"]+)"/,
    /revert reason: "([^"]+)"/,
    /execution reverted: ([^.]+)/,
    /Error: ([^.]+)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Try to decode custom error data
  if (error.data) {
    try {
      // ethers often encodes custom errors in data field
      return error.data;
    } catch {
      // Ignore decode errors
    }
  }

  return null;
}

/**
 * Categorizes error into known error types
 */
function categorizeError(error: any): string {
  if (!error) return 'UNKNOWN_ERROR';

  const message = (
    error.message ||
    error.code ||
    error.error?.message ||
    ''
  ).toLowerCase();

  // Check for specific error patterns
  if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
    return 'INSUFFICIENT_FUNDS';
  }

  if (message.includes('gas') && (message.includes('exceeds') || message.includes('required'))) {
    return 'GAS_REQUIRED_EXCEEDS_ALLOWANCE';
  }

  if (message.includes('underpriced')) {
    return 'TRANSACTION_UNDERPRICED';
  }

  if (message.includes('nonce')) {
    if (message.includes('too low')) {
      return 'NONCE_EXPIRED';
    }
    return 'NONCE_ERROR';
  }

  if (message.includes('network') || message.includes('connection')) {
    return 'NETWORK_ERROR';
  }

  if (message.includes('timeout')) {
    return 'TIMEOUT';
  }

  if (message.includes('rejected') || error.code === 4001) {
    return 'USER_REJECTED';
  }

  if (message.includes('execution reverted') || message.includes('revert')) {
    return 'EXECUTION_REVERTED';
  }

  if (message.includes('unauthorized') || message.includes('not authorized')) {
    return 'UNAUTHORIZED';
  }

  if (message.includes('slippage') || message.includes('too little received')) {
    return 'SLIPPAGE_EXCEEDED';
  }

  // Try to match against known error codes
  if (error.code) {
    const errorCode = error.code.toString();
    if (ERROR_MAPPINGS[errorCode]) {
      return errorCode;
    }
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Parses Web3 transaction error and returns user-friendly information
 */
export function parseTransactionError(error: any): TransactionError {
  // Handle null/undefined errors
  if (!error) {
    return {
      userMessage: 'An unknown error occurred.',
      technicalMessage: 'No error details available',
      action: 'Please try again. If the issue persists, contact support.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  // Check for specific error code
  const errorCode = error.code?.toString();

  // If error code exists in mappings, use it directly
  if (errorCode && ERROR_MAPPINGS[errorCode]) {
    return {
      ...ERROR_MAPPINGS[errorCode],
      errorCode,
    };
  }

  // Otherwise, categorize the error
  const category = categorizeError(error);

  // If category found in mappings, use it
  if (ERROR_MAPPINGS[category]) {
    return {
      ...ERROR_MAPPINGS[category],
      errorCode: category,
    };
  }

  // Try to extract revert reason for contract errors
  const revertReason = extractRevertReason(error);
  if (revertReason) {
    return {
      userMessage: `Transaction failed: ${revertReason}`,
      technicalMessage: `Contract reverted with: ${revertReason}`,
      action: 'Please check your inputs and try again.',
      errorCode: 'CONTRACT_REVERT',
    };
  }

  // Fallback to generic error with whatever message we have
  const errorMessage = error.message || error.toString() || 'Unknown error';

  return {
    userMessage: 'Transaction failed.',
    technicalMessage: errorMessage,
    action: 'Please check your inputs and try again. If the issue persists, contact support.',
    errorCode: 'UNKNOWN_ERROR',
  };
}

/**
 * Formats error for toast notification
 */
export function formatErrorForToast(error: any): string {
  const parsed = parseTransactionError(error);

  let message = parsed.userMessage;

  if (parsed.action) {
    message += `\n\n${parsed.action}`;
  }

  return message;
}

/**
 * Formats error for display in UI
 */
export function formatErrorForUI(error: any): {
  title: string;
  message: string;
  details?: string;
  action?: string;
} {
  const parsed = parseTransactionError(error);

  return {
    title: 'Transaction Error',
    message: parsed.userMessage,
    details: parsed.technicalMessage,
    action: parsed.action,
  };
}

/**
 * Checks if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseTransactionError(error);

  const retryableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'TRANSACTION_UNDERPRICED',
    'GAS_REQUIRED_EXCEEDS_ALLOWANCE',
    'NONCE_EXPIRED',
  ];

  return retryableErrors.includes(parsed.errorCode);
}

/**
 * Gets recommended retry action
 */
export function getRetryAction(error: any): {
  shouldRetry: boolean;
  recommendedAction?: string;
  retryDelay?: number; // milliseconds
} {
  const parsed = parseTransactionError(error);

  // Non-retryable errors
  if (!isRetryableError(error)) {
    return {
      shouldRetry: false,
    };
  }

  // Error-specific retry recommendations
  switch (parsed.errorCode) {
    case 'NETWORK_ERROR':
      return {
        shouldRetry: true,
        recommendedAction: 'Retry with increased gas price',
        retryDelay: 5000, // 5 seconds
      };

    case 'TRANSACTION_UNDERPRICED':
      return {
        shouldRetry: true,
        recommendedAction: 'Retry with 10% higher gas price',
        retryDelay: 1000, // 1 second
      };

    case 'GAS_REQUIRED_EXCEEDS_ALLOWANCE':
      return {
        shouldRetry: true,
        recommendedAction: 'Retry with higher gas limit',
        retryDelay: 2000, // 2 seconds
      };

    case 'NONCE_EXPIRED':
      return {
        shouldRetry: true,
        recommendedAction: 'Retry after waiting for pending transactions',
        retryDelay: 10000, // 10 seconds
      };

    default:
      return {
        shouldRetry: true,
        recommendedAction: 'Retry the transaction',
        retryDelay: 3000, // 3 seconds
      };
  }
}

/**
 * Error handler class for React components
 */
export class TransactionErrorHandler {
  /**
   * Handle transaction error in React component
   */
  static handle(
    error: any,
    callbacks: {
      onError?: (error: TransactionError) => void;
      showToast?: (message: string, type: 'error' | 'warning' | 'info') => void;
    }
  ): TransactionError {
    const parsed = parseTransactionError(error);

    // Call error callback if provided
    if (callbacks.onError) {
      callbacks.onError(parsed);
    }

    // Show toast if provided
    if (callbacks.showToast) {
      const message = formatErrorForToast(error);
      callbacks.showToast(message, 'error');
    }

    return parsed;
  }
}
