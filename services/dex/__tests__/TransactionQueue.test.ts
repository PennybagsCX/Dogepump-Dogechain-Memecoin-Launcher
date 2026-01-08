/**
 * TransactionQueue Tests
 * Tests for transaction queue management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionQueue, QueuedTransaction, TransactionType, TransactionStatus } from '../TransactionQueue';
import { ethers } from 'ethers';
import { Token } from '../../../contexts/DexContext';

// Mock provider
const mockProvider = {
  getTransaction: vi.fn(),
  getBlock: vi.fn(),
  waitForTransaction: vi.fn(),
} as any;

// Create test tokens
const mockTokenA: Token = {
  address: '0x1111111111111111111111111111111111111111',
  symbol: 'DC',
  name: 'DogeChain',
  decimals: 18,
  logoURI: '/dc.png',
  balance: '1000000000000000000000',
  price: 0.05,
};

const mockTokenB: Token = {
  address: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
  symbol: 'wDOGE',
  name: 'Wrapped Doge',
  decimals: 18,
  logoURI: '/wdoge.png',
  balance: '5000000000000000000000',
  price: 0.12,
};

describe('TransactionQueue', () => {
  let transactionQueue: TransactionQueue;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh instance for each test
    transactionQueue = new TransactionQueue(mockProvider, 'test_queue');

    // Clear queue
    transactionQueue.clearAllTransactions();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // @ts-ignore
    global.localStorage = mockLocalStorage;
  });

  describe('addTransaction', () => {
    it('should add a swap transaction', () => {
      const tx: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'> = {
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: ethers.parseEther('100').toString(),
        amountOut: ethers.parseEther('50').toString(),
        gasLimit: '200000',
        gasPrice: '20000000000',
      };

      const added = transactionQueue.addTransaction(tx);

      expect(added.id).toBeDefined();
      expect(added.type).toBe('swap');
      expect(added.status).toBe('pending');
      expect(added.timestamp).toBeDefined();
    });

    it('should add an add_liquidity transaction', () => {
      const tx: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'> = {
        type: 'add_liquidity',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: ethers.parseEther('100').toString(),
        amountOut: ethers.parseEther('50').toString(),
        liquidity: ethers.parseEther('10').toString(),
        gasLimit: '300000',
        gasPrice: '20000000000',
      };

      const added = transactionQueue.addTransaction(tx);

      expect(added.id).toBeDefined();
      expect(added.type).toBe('add_liquidity');
      expect(added.status).toBe('pending');
    });

    it('should add a remove_liquidity transaction', () => {
      const tx: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'> = {
        type: 'remove_liquidity',
        liquidity: ethers.parseEther('10').toString(),
        gasLimit: '250000',
        gasPrice: '20000000000',
      };

      const added = transactionQueue.addTransaction(tx);

      expect(added.id).toBeDefined();
      expect(added.type).toBe('remove_liquidity');
      expect(added.status).toBe('pending');
    });

    it('should generate unique IDs for each transaction', () => {
      const tx: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'> = {
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      };

      const tx1 = transactionQueue.addTransaction(tx);
      const tx2 = transactionQueue.addTransaction(tx);

      expect(tx1.id).not.toBe(tx2.id);
    });
  });

  describe('getTransaction', () => {
    it('should retrieve a transaction by ID', () => {
      const tx: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'> = {
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      };

      const added = transactionQueue.addTransaction(tx);
      const retrieved = transactionQueue.getTransaction(added.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(added.id);
      expect(retrieved?.type).toBe('swap');
    });

    it('should return null for non-existent transaction', () => {
      const retrieved = transactionQueue.getTransaction('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', () => {
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      const all = transactionQueue.getAllTransactions();

      expect(all).toHaveLength(2);
    });

    it('should return a copy of the queue', () => {
      const tx = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      const all = transactionQueue.getAllTransactions();

      // Modifying returned array should not affect the queue
      all.length = 0;

      const retrieved = transactionQueue.getTransaction(tx.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status', () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      const updated = transactionQueue.updateTransactionStatus(tx.id, 'confirmed');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('confirmed');
    });

    it('should update transaction with additional data', () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      const hash = '0xabc123';
      const updated = transactionQueue.updateTransactionStatus(tx.id, 'pending', { hash });

      expect(updated?.hash).toBe(hash);
    });

    it('should return null for non-existent transaction', () => {
      const updated = transactionQueue.updateTransactionStatus('non-existent', 'confirmed');
      expect(updated).toBeNull();
    });
  });

  describe('speedUpTransaction', () => {
    it('should increase gas price by 10%', async () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
        gasPrice: '100000000000', // 100 gwei
      });

      const updated = await transactionQueue.speedUpTransaction(tx.id);

      expect(updated).toBeDefined();
      expect(updated?.gasPrice).toBe('110000000000'); // 110 gwei (10% increase)
      expect(updated?.status).toBe('speeding_up');
      expect(updated?.speedUpAttempts).toBe(1);
    });

    it('should return null for non-pending transaction', async () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      transactionQueue.updateTransactionStatus(tx.id, 'confirmed');

      const updated = await transactionQueue.speedUpTransaction(tx.id);
      expect(updated).toBeNull();
    });

    it('should return null for non-existent transaction', async () => {
      const updated = await transactionQueue.speedUpTransaction('non-existent');
      expect(updated).toBeNull();
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel a pending transaction', async () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      const cancelled = await transactionQueue.cancelTransaction(tx.id);

      expect(cancelled).toBeDefined();
      expect(cancelled?.status).toBe('cancelled');
      expect(cancelled?.cancelAttempts).toBe(1);
    });

    it('should return null for non-pending transaction', async () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      transactionQueue.updateTransactionStatus(tx.id, 'confirmed');

      const cancelled = await transactionQueue.cancelTransaction(tx.id);
      expect(cancelled).toBeNull();
    });
  });

  describe('removeTransaction', () => {
    it('should remove a transaction', () => {
      const tx = transactionQueue.addTransaction({
        type: 'swap',
        from: mockTokenA,
        to: mockTokenB,
        amountIn: '100',
        amountOut: '50',
      });

      const removed = transactionQueue.removeTransaction(tx.id);

      expect(removed).toBe(true);
      expect(transactionQueue.getTransaction(tx.id)).toBeNull();
    });

    it('should return false for non-existent transaction', () => {
      const removed = transactionQueue.removeTransaction('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clearAllTransactions', () => {
    it('should clear all transactions', () => {
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      transactionQueue.clearAllTransactions();

      expect(transactionQueue.getAllTransactions()).toHaveLength(0);
    });
  });

  describe('clearCompletedTransactions', () => {
    it('should only clear completed transactions', () => {
      const tx1 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      const tx2 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      transactionQueue.updateTransactionStatus(tx1.id, 'confirmed');
      transactionQueue.updateTransactionStatus(tx2.id, 'failed');

      transactionQueue.clearCompletedTransactions();

      const remaining = transactionQueue.getAllTransactions();
      expect(remaining).toHaveLength(0);
    });

    it('should keep pending transactions', () => {
      const tx1 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      const tx2 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      transactionQueue.updateTransactionStatus(tx1.id, 'confirmed');

      transactionQueue.clearCompletedTransactions();

      expect(transactionQueue.getTransaction(tx2.id)).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      const tx1 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      const tx2 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });
      const tx3 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });

      transactionQueue.updateTransactionStatus(tx1.id, 'confirmed');
      transactionQueue.updateTransactionStatus(tx2.id, 'failed');

      const stats = transactionQueue.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.confirmed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(33.33, 1);
    });

    it('should return zero statistics for empty queue', () => {
      const stats = transactionQueue.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.confirmed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('getTransactionsByType', () => {
    it('should filter transactions by type', () => {
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      transactionQueue.addTransaction({ type: 'add_liquidity', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50', liquidity: '10' });
      transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      const swaps = transactionQueue.getTransactionsByType('swap');
      const liquidity = transactionQueue.getTransactionsByType('add_liquidity');

      expect(swaps).toHaveLength(2);
      expect(liquidity).toHaveLength(1);
    });
  });

  describe('getPendingTransactions', () => {
    it('should return only pending transactions', () => {
      const tx1 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenA, to: mockTokenB, amountIn: '100', amountOut: '50' });
      const tx2 = transactionQueue.addTransaction({ type: 'swap', from: mockTokenB, to: mockTokenA, amountIn: '50', amountOut: '100' });

      transactionQueue.updateTransactionStatus(tx1.id, 'confirmed');

      const pending = transactionQueue.getPendingTransactions();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(tx2.id);
    });
  });
});
