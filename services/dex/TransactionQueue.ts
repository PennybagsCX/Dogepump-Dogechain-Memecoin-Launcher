import { ethers } from 'ethers';
import { Token } from '../../contexts/DexContext';

export type TransactionType = 'swap' | 'add_liquidity' | 'remove_liquidity';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'speeding_up';

export interface QueuedTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  hash?: string;
  from?: Token;
  to?: Token;
  amountIn?: string;
  amountOut?: string;
  liquidity?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  timestamp: number;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
  speedUpAttempts?: number;
  cancelAttempts?: number;
}

export interface TransactionStatistics {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  cancelled: number;
  speedingUp: number;
  successRate: number;
  averageConfirmationTime: number;
}

export class TransactionQueue {
  private queue: QueuedTransaction[];
  private provider: ethers.Provider;
  private storageKey: string;
  private monitoringInterval: NodeJS.Timeout | null;
  private listeners: Map<string, ((tx: QueuedTransaction) => void)[]>;

  // Monitoring interval in milliseconds (5 seconds)
  private readonly MONITORING_INTERVAL = 5000;

  constructor(provider: ethers.Provider, storageKey: string = 'dex_transaction_queue') {
    this.provider = provider;
    this.storageKey = storageKey;
    this.queue = [];
    this.monitoringInterval = null;
    this.listeners = new Map();

    this.loadFromStorage();
  }

  /**
   * Add transaction to queue
   */
  addTransaction(transaction: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'>): QueuedTransaction {
    const newTransaction: QueuedTransaction = {
      ...transaction,
      id: this.generateTransactionId(),
      timestamp: Date.now(),
      status: 'pending',
      speedUpAttempts: 0,
      cancelAttempts: 0,
      requiredConfirmations: 1,
    };

    this.queue.unshift(newTransaction);
    this.saveToStorage();
    this.notifyListeners(newTransaction);

    // Start monitoring if not already running
    if (!this.monitoringInterval) {
      this.startMonitoring();
    }

    return newTransaction;
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(
    txId: string,
    status: TransactionStatus,
    updates?: Partial<QueuedTransaction>
  ): QueuedTransaction | null {
    const transaction = this.queue.find(tx => tx.id === txId);

    if (!transaction) {
      return null;
    }

    transaction.status = status;
    if (updates) {
      Object.assign(transaction, updates);
    }

    this.saveToStorage();
    this.notifyListeners(transaction);

    return transaction;
  }

  /**
   * Update transaction with hash
   */
  updateTransactionHash(txId: string, hash: string): QueuedTransaction | null {
    return this.updateTransactionStatus(txId, 'pending', { hash });
  }

  /**
   * Update transaction with error
   */
  updateTransactionError(txId: string, error: string): QueuedTransaction | null {
    return this.updateTransactionStatus(txId, 'failed', { error });
  }

  /**
   * Get transaction by ID
   */
  getTransaction(txId: string): QueuedTransaction | null {
    return this.queue.find(tx => tx.id === txId) || null;
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): QueuedTransaction[] {
    return [...this.queue];
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: TransactionType): QueuedTransaction[] {
    return this.queue.filter(tx => tx.type === type);
  }

  /**
   * Get transactions by status
   */
  getTransactionsByStatus(status: TransactionStatus): QueuedTransaction[] {
    return this.queue.filter(tx => tx.status === status);
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): QueuedTransaction[] {
    return this.getTransactionsByStatus('pending');
  }

  /**
   * Speed up transaction (increase gas price)
   */
  async speedUpTransaction(txId: string): Promise<QueuedTransaction | null> {
    const transaction = this.getTransaction(txId);

    if (!transaction || transaction.status !== 'pending') {
      return null;
    }

    // Increase gas price by 10%
    const currentGasPrice = transaction.gasPrice || '0';
    const gasPriceBN = BigInt(currentGasPrice);
    const newGasPrice = (gasPriceBN * 110n) / 100n;

    const updated = this.updateTransactionStatus(txId, 'speeding_up', {
      gasPrice: newGasPrice.toString(),
      speedUpAttempts: (transaction.speedUpAttempts || 0) + 1,
    });

    return updated;
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(txId: string): Promise<QueuedTransaction | null> {
    const transaction = this.getTransaction(txId);

    if (!transaction || transaction.status !== 'pending') {
      return null;
    }

    // Mark as cancelled
    const updated = this.updateTransactionStatus(txId, 'cancelled', {
      cancelAttempts: (transaction.cancelAttempts || 0) + 1,
    });

    return updated;
  }

  /**
   * Remove transaction from queue
   */
  removeTransaction(txId: string): boolean {
    const index = this.queue.findIndex(tx => tx.id === txId);

    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  /**
   * Clear all transactions
   */
  clearAllTransactions(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Clear completed transactions (confirmed, failed, cancelled)
   */
  clearCompletedTransactions(): void {
    this.queue = this.queue.filter(
      tx => tx.status === 'pending' || tx.status === 'speeding_up'
    );
    this.saveToStorage();
  }

  /**
   * Get transaction statistics
   */
  getStatistics(): TransactionStatistics {
    const total = this.queue.length;
    const pending = this.getTransactionsByStatus('pending').length;
    const confirmed = this.getTransactionsByStatus('confirmed').length;
    const failed = this.getTransactionsByStatus('failed').length;
    const cancelled = this.getTransactionsByStatus('cancelled').length;
    const speedingUp = this.getTransactionsByStatus('speeding_up').length;

    const successRate = total > 0 ? (confirmed / total) * 100 : 0;

    // Calculate average confirmation time
    const confirmedTxs = this.getTransactionsByStatus('confirmed');
    const averageConfirmationTime = confirmedTxs.length > 0
      ? confirmedTxs.reduce((sum, tx) => {
          const confirmationTime = (tx.confirmations || 0) - tx.timestamp;
          return sum + confirmationTime;
        }, 0) / confirmedTxs.length
      : 0;

    return {
      total,
      pending,
      confirmed,
      failed,
      cancelled,
      speedingUp,
      successRate,
      averageConfirmationTime,
    };
  }

  /**
   * Start monitoring transactions
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.monitorTransactions();
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Stop monitoring transactions
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Monitor pending transactions
   */
  private async monitorTransactions(): Promise<void> {
    const pendingTxs = this.getPendingTransactions();

    for (const tx of pendingTxs) {
      if (!tx.hash) continue;

      try {
        const receipt = await this.provider.getTransactionReceipt(tx.hash);

        if (receipt) {
          if (receipt.status === 1) {
            // Transaction confirmed
            this.updateTransactionStatus(tx.id, 'confirmed', {
              confirmations: await receipt.confirmations(),
            });
          } else {
            // Transaction failed
            this.updateTransactionStatus(tx.id, 'failed', {
              error: 'Transaction reverted',
            });
          }
        }
      } catch (error) {
        console.error(`Failed to monitor transaction ${tx.id}:`, error);
      }
    }
  }

  /**
   * Add listener for transaction updates
   */
  addListener(txId: string, callback: (tx: QueuedTransaction) => void): void {
    if (!this.listeners.has(txId)) {
      this.listeners.set(txId, []);
    }
    this.listeners.get(txId)!.push(callback);
  }

  /**
   * Remove listener for transaction updates
   */
  removeListener(txId: string, callback: (tx: QueuedTransaction) => void): void {
    const listeners = this.listeners.get(txId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners for a transaction
   */
  private notifyListeners(transaction: QueuedTransaction): void {
    const listeners = this.listeners.get(transaction.id);
    if (listeners) {
      listeners.forEach(callback => callback(transaction));
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save transaction queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load transaction queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get transaction history for a specific type
   */
  getTransactionHistory(type: TransactionType, limit: number = 50): QueuedTransaction[] {
    return this.getTransactionsByType(type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 20): QueuedTransaction[] {
    return this.queue
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get transaction by hash
   */
  getTransactionByHash(hash: string): QueuedTransaction | null {
    return this.queue.find(tx => tx.hash === hash) || null;
  }

  /**
   * Check if transaction is pending
   */
  isTransactionPending(txId: string): boolean {
    const tx = this.getTransaction(txId);
    return tx?.status === 'pending' || tx?.status === 'speeding_up';
  }

  /**
   * Get pending transaction count
   */
  getPendingCount(): number {
    return this.getPendingTransactions().length;
  }

  /**
   * Get total transaction count
   */
  getTotalCount(): number {
    return this.queue.length;
  }

  /**
   * Clean up old transactions (older than 7 days)
   */
  cleanOldTransactions(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.queue = this.queue.filter(tx => tx.timestamp > sevenDaysAgo);
    this.saveToStorage();
  }

  /**
   * Export transactions as JSON
   */
  exportTransactions(): string {
    return JSON.stringify(this.queue, null, 2);
  }

  /**
   * Import transactions from JSON
   */
  importTransactions(json: string): boolean {
    try {
      const transactions = JSON.parse(json);
      if (Array.isArray(transactions)) {
        this.queue = transactions;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import transactions:', error);
      return false;
    }
  }

  /**
   * Destroy the queue and cleanup
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.clearAllTransactions();
  }
}

export default TransactionQueue;
