# User-Friendly Error Handling System

**Date**: January 15, 2026
**Feature**: Transaction Error Handler
**Status**: ✅ Implemented

---

## Overview

The DogePump platform now includes a comprehensive error handling system that converts technical blockchain/Web3 errors into user-friendly messages. This improves user experience by providing clear, actionable feedback when transactions fail.

---

## Features

### Core Capabilities

- **Error Categorization**: Automatically categorizes errors into known types (insufficient funds, gas issues, nonce errors, etc.)
- **User-Friendly Messages**: Maps technical errors to plain language explanations
- **Actionable Feedback**: Provides specific next steps for users to resolve errors
- **Retry Detection**: Identifies which errors are retryable and recommends retry strategies
- **Revert Reason Extraction**: Extracts custom error messages from failed contract calls

---

## Usage

### Basic Error Handling

```typescript
import { parseTransactionError, formatErrorForToast } from '@/services/web3/errorHandler';

try {
  const tx = await contract.swap(amount);
  await tx.wait();
} catch (error) {
  const parsed = parseTransactionError(error);

  console.log(parsed.userMessage);      // "Insufficient balance for this transaction."
  console.log(parsed.action);            // "Please add more funds..."
  console.log(parsed.errorCode);         // "INSUFFICIENT_FUNDS"

  // Show in toast
  const toastMessage = formatErrorForToast(error);
  addToast('error', toastMessage);
}
```

### React Component Integration

```typescript
import { TransactionErrorHandler } from '@/services/web3/errorHandler';
import { useToast } from '@/hooks/useToast';

function SwapButton() {
  const { showToast } = useToast();

  const handleSwap = async () => {
    try {
      const tx = await router.swap(amountIn, tokenOut);
      await tx.wait();
    } catch (error) {
      TransactionErrorHandler.handle(error, {
        showToast,
        onError: (parsed) => {
          // Log error for analytics
          analytics.track('Transaction Error', {
            errorCode: parsed.errorCode,
            userMessage: parsed.userMessage,
          });
        },
      });
    }
  };

  return <button onClick={handleSwap}>Swap</button>;
}
```

### Check if Error is Retryable

```typescript
import { isRetryableError, getRetryAction } from '@/services/web3/errorHandler';

async function executeWithRetry(transaction: () => Promise<any>) {
  try {
    return await transaction();
  } catch (error) {
    if (isRetryableError(error)) {
      const { shouldRetry, recommendedAction, retryDelay } = getRetryAction(error);

      if (shouldRetry) {
        console.log(`Retrying: ${recommendedAction}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await transaction();
      }
    }

    throw error;
  }
}
```

### UI Error Display

```typescript
import { formatErrorForUI } from '@/services/web3/errorHandler';

function TransactionError({ error }: { error: any }) {
  const { title, message, details, action } = formatErrorForUI(error);

  return (
    <div className="error-container">
      <h3>{title}</h3>
      <p>{message}</p>

      {details && (
        <details>
          <summary>Technical Details</summary>
          <code>{details}</code>
        </details>
      )}

      {action && (
        <div className="action-hint">
          <strong>Action:</strong> {action}
        </div>
      )}
    </div>
  );
}
```

---

## Supported Error Types

### Balance Errors

**Error**: `INSUFFICIENT_FUNDS`

- **User Message**: "Insufficient balance for this transaction."
- **Action**: "Please add more funds to your wallet and try again."

### Gas Errors

**Error**: `GAS_REQUIRED_EXCEEDS_ALLOWANCE`

- **User Message**: "Insufficient gas for this transaction."
- **Action**: "Please increase the gas limit and try again."

**Error**: `TRANSACTION_UNDERPRICED`

- **User Message**: "Gas price too low."
- **Action**: "Please increase the gas price and try again."

### Nonce Errors

**Error**: `NONCE_EXPIRED`

- **User Message**: "Transaction nonce has expired."
- **Action**: "Please wait a moment and try again. If this persists, reset your account nonce."

### Network Errors

**Error**: `NETWORK_ERROR`

- **User Message**: "Network connection failed."
- **Action**: "Please check your internet connection and try again."

**Error**: `TIMEOUT`

- **User Message**: "Transaction timed out."
- **Action**: "Please check if the transaction was confirmed and try again if needed."

### Transaction Reverted

**Error**: `EXECUTION_REVERTED`

- **User Message**: "Transaction failed during execution."
- **Action**: "Please check your inputs and try again. Contact support if the issue persists."

**Error**: `SLIPPAGE_EXCEEDED`

- **User Message**: "Price changed too much."
- **Action**: "Please try again with a higher slippage tolerance or different amount."

### User Cancellation

**Error**: `USER_REJECTED`

- **User Message**: "Transaction was rejected."
- **Action**: "You cancelled the transaction in your wallet."

---

## Retry Strategy

The error handler automatically determines which errors are retryable:

### Retryable Errors

1. **Network Errors** - Retry after 5 seconds
2. **Timeout** - Manual retry after checking transaction status
3. **Gas Price Too Low** - Retry immediately with higher gas
4. **Gas Limit Too Low** - Retry after 2 seconds with higher limit
5. **Nonce Expired** - Retry after 10 seconds

### Non-Retryable Errors

1. **Insufficient Funds** - User must add funds
2. **User Rejected** - User intentionally cancelled
3. **Unauthorized** - User lacks permissions
4. **Contract Logic Errors** - Inputs must be corrected

---

## API Reference

### `parseTransactionError(error: any): TransactionError`

Parses a Web3 error and returns structured information.

**Returns**:
```typescript
{
  userMessage: string;      // Plain language explanation
  technicalMessage: string; // Original error details
  action?: string;          // Recommended next steps
  errorCode: string;        // Error category code
}
```

### `formatErrorForToast(error: any): string`

Formats error for display in toast notification.

**Returns**: Combined user message and action text

### `formatErrorForUI(error: any): ErrorDisplay`

Formats error for display in UI component.

**Returns**:
```typescript
{
  title: string;       // Error title
  message: string;     // User-friendly message
  details?: string;    // Technical details
  action?: string;     // Recommended action
}
```

### `isRetryableError(error: any): boolean`

Checks if error can be retried.

**Returns**: `true` if retry is recommended

### `getRetryAction(error: any): RetryStrategy`

Gets recommended retry strategy.

**Returns**:
```typescript
{
  shouldRetry: boolean;
  recommendedAction?: string;
  retryDelay?: number; // milliseconds
}
```

### `TransactionErrorHandler.handle(error, callbacks): TransactionError`

React component error handler with callbacks.

**Callbacks**:
```typescript
{
  onError?: (error: TransactionError) => void;
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void;
}
```

---

## Integration Examples

### With DEX Swap

```typescript
// components/SwapButton.tsx
import { TransactionErrorHandler } from '@/services/web3/errorHandler';
import { useToast } from '@/hooks/useToast';

export function SwapButton() {
  const { showToast } = useToast();

  const executeSwap = async () => {
    try {
      const tx = await router.swap(
        tokenIn.address,
        tokenOut.address,
        amountIn,
        minAmountOut,
        deadline
      );

      showToast('Transaction submitted!', 'info');
      await tx.wait();
      showToast('Swap successful!', 'info');
    } catch (error) {
      TransactionErrorHandler.handle(error, {
        showToast,
        onError: (parsed) => {
          // Track error for analytics
          console.error(`Swap failed: ${parsed.errorCode}`);
        },
      });
    }
  };

  return <button onClick={executeSwap}>Swap</button>;
}
```

### With Liquidity Provision

```typescript
// services/liquidityService.ts
import { parseTransactionError, getRetryAction } from '@/services/web3/errorHandler';

export async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: bigint,
  amountB: bigint
): Promise<void> {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const tx = await router.addLiquidity(tokenA, tokenB, amountA, amountB);
      await tx.wait();
      return;
    } catch (error) {
      const { shouldRetry, retryDelay } = getRetryAction(error);

      if (!shouldRetry || retries === maxRetries - 1) {
        // Non-retryable or max retries reached
        const parsed = parseTransactionError(error);
        throw new Error(parsed.userMessage);
      }

      // Retry after delay
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retries++;
    }
  }
}
```

### With ContractService

```typescript
// services/dex/ContractService.ts
import { parseTransactionError, isRetryableError } from '@/services/web3/errorHandler';

export class ContractService {
  async executeTransaction(
    contract: ethers.Contract,
    method: string,
    args: any[]
  ): Promise<ethers.ContractTransactionReceipt> {
    try {
      const tx = await contract[method](...args);
      return await tx.wait();
    } catch (error) {
      const parsed = parseTransactionError(error);

      // Log to error tracking service
      logger.error('Contract execution failed', {
        errorCode: parsed.errorCode,
        userMessage: parsed.userMessage,
        technicalMessage: parsed.technicalMessage,
      });

      // Throw user-friendly error
      throw new Error(parsed.userMessage);
    }
  }
}
```

---

## Testing

### Test Error Parsing

```typescript
import { parseTransactionError } from '@/services/web3/errorHandler';

describe('TransactionErrorHandler', () => {
  it('should parse insufficient funds error', () => {
    const error = new Error('insufficient funds for transfer');
    const parsed = parseTransactionError(error);

    expect(parsed.errorCode).toBe('INSUFFICIENT_FUNDS');
    expect(parsed.userMessage).toBe('Insufficient balance for this transaction.');
    expect(parsed.action).toBeDefined();
  });

  it('should parse revert reason', () => {
    const error = {
      message: 'execution reverted: reason="Insufficient liquidity"',
    };
    const parsed = parseTransactionError(error);

    expect(parsed.userMessage).toContain('Insufficient liquidity');
    expect(parsed.errorCode).toBe('CONTRACT_REVERT');
  });

  it('should identify retryable errors', () => {
    const error = new Error('replacement transaction underpriced');
    const parsed = parseTransactionError(error);

    expect(parsed.errorCode).toBe('TRANSACTION_UNDERPRICED');
    expect(isRetryableError(error)).toBe(true);
  });
});
```

---

## Best Practices

### 1. Always Wrap Transactions

```typescript
// GOOD
try {
  const tx = await contract.method();
  await tx.wait();
} catch (error) {
  TransactionErrorHandler.handle(error, { showToast });
}

// BAD
const tx = await contract.method(); // No error handling
```

### 2. Provide User Context

```typescript
// GOOD
TransactionErrorHandler.handle(error, {
  onError: (parsed) => {
    analytics.track('Swap Failed', {
      errorCode: parsed.errorCode,
      tokenPair: `${tokenIn}-${tokenOut}`,
      amount: amountIn.toString(),
    });
  }
});

// BAD
console.error(error); // No analytics, no context
```

### 3. Use Retry Logic for Network Errors

```typescript
// GOOD
if (isRetryableError(error)) {
  const { retryDelay } = getRetryAction(error);
  setTimeout(() => retry(), retryDelay);
}

// BAD
if (error.message.includes('network')) {
  retry(); // No delay, no strategy
}
```

### 4. Display Technical Details in Expandable Section

```typescript
// GOOD
<details>
  <summary>Technical Details</summary>
  <code>{parsed.technicalMessage}</code>
</details>

// BAD
<p>{parsed.technicalMessage}</p> // Too technical for most users
```

---

## Error Codes Reference

| Error Code | Retryable | User Message | Action |
|------------|-----------|--------------|--------|
| `INSUFFICIENT_FUNDS` | No | Insufficient balance | Add more funds |
| `GAS_REQUIRED_EXCEEDS_ALLOWANCE` | Yes | Insufficient gas | Increase gas limit |
| `TRANSACTION_UNDERPRICED` | Yes | Gas price too low | Increase gas price |
| `NONCE_EXPIRED` | Yes | Nonce expired | Wait and retry |
| `NETWORK_ERROR` | Yes | Network failed | Check connection |
| `TIMEOUT` | No | Transaction timed out | Check transaction status |
| `EXECUTION_REVERTED` | No | Transaction failed | Check inputs |
| `USER_REJECTED` | No | Transaction rejected | User cancelled |
| `SLIPPAGE_EXCEEDED` | No | Price changed | Increase slippage |
| `UNAUTHORIZED` | No | Not authorized | Check permissions |
| `CONTRACT_REVERT` | No | Contract error | Custom error message |
| `UNKNOWN_ERROR` | No | Unknown error | Contact support |

---

## Monitoring and Analytics

### Track Error Rates

```typescript
// services/analytics.ts
import { parseTransactionError } from '@/services/web3/errorHandler';

export function trackTransactionError(error: any, context: {
  operation: string;
  walletAddress?: string;
  [key: string]: any;
}) {
  const parsed = parseTransactionError(error);

  analytics.track('Transaction Error', {
    errorCode: parsed.errorCode,
    operation: context.operation,
    walletAddress: context.walletAddress,
    userMessage: parsed.userMessage,
    retryable: isRetryableError(error),
    timestamp: new Date().toISOString(),
  });
}
```

### Dashboard Metrics

Track these metrics in your monitoring dashboard:

1. **Error Rate**: Percentage of transactions that fail by error code
2. **Retry Success Rate**: Percentage of retried transactions that succeed
3. **Most Common Errors**: Top 5 error codes by frequency
4. **User Impact**: Number of users affected by each error type
5. **Recovery Rate**: Percentage of users who successfully retry

---

## Future Enhancements

Potential improvements to consider:

1. **Multilingual Support**: Translate error messages to user's preferred language
2. **Smart Suggestions**: AI-powered suggestions based on historical data
3. **Auto-Retry**: Optional automatic retry for retryable errors
4. **Error Prevention**: Pre-transaction validation to catch common errors
5. **Context-Aware Messages**: Tailor messages based on user experience level

---

**Implementation Date**: January 15, 2026
**Last Updated**: January 15, 2026
**Version**: 1.0.0
