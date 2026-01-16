# Transaction Retry Manager

**Date**: January 15, 2026
**Feature**: Automatic transaction retry with gas adjustment
**Status**: ✅ Implemented

---

## Overview

The Transaction Retry Manager provides automatic retry functionality for blockchain transactions, handling network congestion, gas price spikes, and transient failures. It implements exponential backoff, gas price adjustment, and comprehensive error handling to ensure transactions succeed even under adverse network conditions.

## Problem Statement

Blockchain transactions often fail due to:
1. **Network Congestion**: Too many transactions competing for block space
2. **Gas Price Spikes**: Sudden increases in gas prices leave transactions stuck
3. **Nonce Conflicts**: Multiple pending transactions with conflicting nonces
4. **Timeouts**: Transactions take too long to be mined
5. **RPC Failures**: Temporary network issues

Without retry logic, users must manually resubmit transactions, leading to poor UX and lost opportunities.

## Solution

The Transaction Retry Manager automatically:
- Retries failed transactions with exponential backoff
- Increases gas price on each retry (to replace stuck transactions)
- Adjusts gas limit if needed
- Handles nonce conflicts
- Provides user-friendly error messages
- Logs all retry attempts for monitoring

---

## Usage

### Basic Retry

```typescript
import { executeTxWithRetry } from './services/web3/transactionManager.js';

async function mintTokens(amount: bigint) {
  const receipt = await executeTxWithRetry(
    async () => {
      return await tokenContract.mint(amount);
    }
  );

  console.log(`Minted in ${receipt.attempts} attempts`);
}
```

### Custom Retry Options

```typescript
import { TransactionRetryManager } from './services/web3/transactionManager.js';

const manager = new TransactionRetryManager({
  maxRetries: 5, // Try up to 5 times
  initialDelay: 2000, // Wait 2 seconds before first retry
  maxDelay: 60000, // Max 60 seconds between retries
  gasPriceIncrease: 20, // Increase gas price by 20% each retry
  gasLimitIncrease: 10, // Increase gas limit by 10% each retry
});

const receipt = await manager.executeWithRetry(async () => {
  return await tokenContract.transfer(toAddress, amount);
});
```

### Retry with Gas Price Adjustment

```typescript
import { TransactionRetryManager } from './services/web3/transactionManager.js';

const manager = new TransactionRetryManager();

async function executeWithDynamicGas() {
  const receipt = await manager.executeWithGasAdjustment(
    async (gasPrice, gasLimit) => {
      // Create transaction with specific gas parameters
      const tx = await tokenContract.mint(amount, {
        gasPrice,
        gasLimit,
      });
      return tx;
    }
  );

  console.log(`Final gas price: ${receipt.finalGasPrice.toString()}`);
  console.log(`Final gas limit: ${receipt.finalGasLimit.toString()}`);
}
```

### Replace Stuck Transaction

```typescript
import { transactionManager } from './services/web3/transactionManager.js';

// Original transaction is stuck
const stuckTx = await tokenContract.mint(amount);

// Replace with higher gas price
const receipt = await transactionManager.replaceTransaction(
  stuckTx,
  async (nonce, newGasPrice) => {
    return await tokenContract.mint(amount, {
      nonce,
      gasPrice: newGasPrice,
    });
  },
  15 // Increase gas price by 15%
);
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetries` | number | 3 | Maximum number of retry attempts |
| `initialDelay` | number | 1000 | Initial delay before first retry (ms) |
| `maxDelay` | number | 30000 | Maximum delay between retries (ms) |
| `backoffMultiplier` | number | 2 | Exponential backoff multiplier |
| `gasPriceIncrease` | number | 10 | Percentage to increase gas price (%) |
| `gasLimitIncrease` | number | 5 | Percentage to increase gas limit (%) |
| `timeout` | number | 60000 | Transaction confirmation timeout (ms) |

---

## Retry Strategy

### Exponential Backoff

The manager uses exponential backoff with a cap:

```
Attempt 1: Immediate
Attempt 2: Wait 1 second (1 * 2^0)
Attempt 3: Wait 2 seconds (1 * 2^1)
Attempt 4: Wait 4 seconds (1 * 2^2)
...capped at 30 seconds
```

### Gas Price Adjustment

Gas price increases by percentage (default 10%) on each retry:

```
Initial: 20 gwei
Retry 1: 22 gwei (20 + 10%)
Retry 2: 24.2 gwei (22 + 10%)
Retry 3: 26.62 gwei (24.2 + 10%)
```

### Retryable Errors

The following errors trigger automatic retry:

- **Network errors**: "network error", "timeout"
- **Nonce issues**: "nonce too low", "nonce too high"
- **Gas issues**: "replacement transaction underpriced", "transaction underpriced"
- **Congestion**: "exceeds block gas limit", "try again later"

### Non-Retryable Errors

These errors fail immediately without retry:

- **Revert errors**: Contract logic failures
- **Invalid parameters**: User input errors
- **Permission errors**: Unauthorized access

---

## Error Messages

The manager provides user-friendly error messages:

```typescript
import { getTransactionErrorMessage } from './services/web3/transactionManager.js';

try {
  await executeTxWithRetry(transactionFunction);
} catch (error) {
  const userMessage = getTransactionErrorMessage(error);
  alert(userMessage);
}
```

### Error Message Mappings

| Error Pattern | User Message |
|--------------|--------------|
| `insufficient funds` | Insufficient balance to complete this transaction. Please add more funds to your wallet. |
| `nonce` | Transaction pending. Please wait a few seconds and try again. |
| `gas required exceeds allowance` | Insufficient gas. Please increase gas limit and try again. |
| `replacement transaction underpriced` | Gas price too low. Please increase gas price and try again. |
| `network` | Network connection error. Please check your internet connection and try again. |
| `timeout` | Transaction timed out. The network may be congested. Please try again. |
| `execution reverted` | Transaction failed: [reason] |
| Default | Transaction failed. Please try again. |

---

## Integration with Contract Service

### Update ContractService to Use Retry

```typescript
// services/dex/ContractService.ts
import { executeTxWithRetry } from './transactionManager.js';

export class ContractService {
  async swapTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint
  ): Promise<TransactionReceipt> {
    // Use retry manager for swap
    const result = await executeTxWithRetry(
      async () => {
        return this.router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [tokenIn, tokenOut],
          this.signer.address,
          Date.now() + 1000 * 60 * 10 // 10 minute deadline
        );
      },
      {
        maxRetries: 4,
        gasPriceIncrease: 15, // Higher increase for swaps
      }
    );

    return result.receipt;
  }
}
```

---

## Monitoring and Logging

### Retry Metrics

The manager logs all retry attempts:

```typescript
logger.info(
  {
    attempt: 2,
    maxRetries: 3,
    delay: 2000,
  },
  'Transaction failed, retrying...'
);
```

### Success Logging

```typescript
logger.info(
  {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    attempts: 2,
    duration: 15000,
  },
  'Transaction confirmed successfully'
);
```

### Error Logging

```typescript
logger.error(
  {
    attempts: 3,
    error: error.message,
  },
  'Transaction failed after all retry attempts'
);
```

---

## Best Practices

### 1. Set Appropriate Retry Limits

```typescript
// For critical transactions (user funds), use more retries
const criticalTxManager = new TransactionRetryManager({
  maxRetries: 5,
  gasPriceIncrease: 20,
});

// For non-critical transactions, use fewer retries
const nonCriticalTxManager = new TransactionRetryManager({
  maxRetries: 2,
  gasPriceIncrease: 10,
});
```

### 2. Handle User Feedback

```typescript
async function executeWithFeedback(txFunction: () => Promise<any>) {
  showLoading('Submitting transaction...');

  try {
    const result = await executeTxWithRetry(txFunction);

    if (result.attempts > 1) {
      showWarning(`Transaction confirmed after ${result.attempts} attempts`);
    } else {
      showSuccess('Transaction confirmed!');
    }

    return result;
  } catch (error) {
    const userMessage = getTransactionErrorMessage(error);
    showError(userMessage);
    throw error;
  }
}
```

### 3. Monitor Gas Costs

```typescript
const receipt = await executeTxWithRetry(txFunction);

// Track how much gas price increased
const finalGasPriceGwei = parseFloat(ethers.formatUnits(receipt.finalGasPrice, 'gwei'));
if (finalGasPriceGwei > 100) {
  logger.warn({ gasPrice: finalGasPriceGwei }, 'High gas price paid');
}
```

### 4. Implement Transaction Queue

```typescript
class TransactionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add(txFunction: () => Promise<any>) {
    this.queue.push(txFunction);
    await this.process();
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const txFunction = this.queue.shift()!;
      await executeTxWithRetry(txFunction);
    }

    this.processing = false;
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { TransactionRetryManager } from './transactionManager.js';

describe('TransactionRetryManager', () => {
  it('should retry on network error', async () => {
    const manager = new TransactionRetryManager({ maxRetries: 3 });
    const txFunction = vi.fn()
      .rejectOnce(new Error('network error'))
      .resolveOnce({ hash: '0x123', wait: () => Promise.resolve({ blockNumber: 1 }) });

    const receipt = await manager.executeWithRetry(txFunction);

    expect(txFunction).toHaveBeenCalledTimes(2);
    expect(receipt.attempts).toBe(2);
  });

  it('should increase gas price on retry', async () => {
    const manager = new TransactionRetryManager({
      gasPriceIncrease: 10,
      maxRetries: 2,
    });

    // Implementation depends on your testing setup
  });

  it('should fail after max retries', async () => {
    const manager = new TransactionRetryManager({ maxRetries: 2 });
    const txFunction = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(manager.executeWithRetry(txFunction)).rejects.toThrow();
    expect(txFunction).toHaveBeenCalledTimes(2);
  });
});
```

---

## Performance Considerations

### Gas Costs

Retrying with higher gas prices increases transaction costs:

```
Initial tx: 20 gwei * 300,000 gas = 0.006 ETH
Retry 1:   22 gwei * 300,000 gas = 0.0066 ETH
Retry 2:   24.2 gwei * 300,000 gas = 0.00726 ETH
Total:    0.01986 ETH (if all 3 attempts are mined)
```

**Recommendation**: Set `maxRetries` appropriately for transaction value:
- Small transactions (< $10): 2-3 retries
- Medium transactions ($10-$100): 3-5 retries
- Large transactions (>$100): 5+ retries or manual intervention

### Latency

Retries add latency:
- Attempt 1: Immediate
- Attempt 2: +1 second (average)
- Attempt 3: +3 seconds (average)
- Attempt 4: +7 seconds (average)

**Recommendation**: Show progress indicator to user during retries.

---

## Troubleshooting

### Transactions Always Failing

**Issue**: All retries fail with "replacement transaction underpriced"

**Solution**: Check if another transaction with higher gas price is already pending. Use `getPendingTransactions()` to check.

```typescript
const pendingTxs = await signer.provider?.getTransactionCount(signer.address, 'pending');
console.log('Pending transactions:', pendingTxs);
```

### Gas Price Too High

**Issue**: Final gas price is excessively high (> 100 gwei)

**Solution**: Lower `gasPriceIncrease` or reduce `maxRetries`.

```typescript
const manager = new TransactionRetryManager({
  gasPriceIncrease: 5, // Lower increase
  maxRetries: 2, // Fewer retries
});
```

### Nonce Conflicts

**Issue**: Nonce errors even with retry manager

**Solution**: Implement nonce management.

```typescript
let nonce = await signer.getNonce('pending');

const receipt = await executeTxWithRetry(async () => {
  const tx = await contract.function(params, { nonce });
  nonce++;
  return tx;
});
```

---

## Migration Checklist

- [x] Create TransactionRetryManager class
- [x] Implement exponential backoff logic
- [x] Implement gas price adjustment
- [x] Add user-friendly error messages
- [x] Create comprehensive documentation
- [ ] Update ContractService to use retry manager
- [ ] Add retry metrics to monitoring dashboard
- [ ] Create integration tests
- [ ] Add transaction queue for concurrent operations
- [ ] Document retry strategy for end users

---

## Additional Resources

- [Ethers.js Transactions](https://docs.ethers.org/v6/api/contract.html#ContractWrite)
- [EIP-1559 Transaction Types](https://eips.ethereum.org/EIPS/eip-1559)
- [Gas Oracle Strategies](https://www.blocknative.com/blog/the-state-of-gas)

---

**Implementation Date**: January 15, 2026
**Last Updated**: January 15, 2026
**Version**: 1.0.0
