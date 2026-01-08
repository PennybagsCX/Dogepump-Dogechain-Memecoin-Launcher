import type { SyncMessage, ChartEmoji, ReactionStats } from '../types';

/**
 * EmojiSyncService - Real-time emoji synchronization service using BroadcastChannel API
 * 
 * This service enables real-time synchronization of emoji reactions between browser tabs/windows.
 * When a user reacts with an emoji in one tab, other open tabs receive the reaction immediately.
 * 
 * @example
 * ```typescript
 * // Initialize the service
 * emojiSyncService.initialize();
 * 
 * // Broadcast a reaction
 * emojiSyncService.broadcastAddReaction('token123', '🚀', 'user456');
 * 
 * // Listen for incoming messages
 * emojiSyncService.onMessage((message) => {
 *   console.log('Received sync message:', message);
 * });
 * 
 * // Cleanup when done
 * emojiSyncService.cleanup();
 * ```
 */
class EmojiSyncService {
  private channel: BroadcastChannel | null = null;
  private messageCallbacks: ((message: SyncMessage) => void)[] = [];
  private processedMessages: Set<string> = new Set();
  private readonly CHANNEL_NAME = 'dogepump_emoji_sync';
  private readonly MESSAGE_CACHE_SIZE = 1000;
  private isInitialized = false;

  /**
   * Initialize the BroadcastChannel and set up message listener
   * 
   * Creates a new BroadcastChannel instance and sets up the message handler.
   * Multiple calls to initialize() will be idempotent - subsequent calls will do nothing.
   * 
   * @throws {Error} If BroadcastChannel API is not supported by the browser
   * 
   * @example
   * ```typescript
   * emojiSyncService.initialize();
   * ```
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[EmojiSyncService] Already initialized, skipping');
      return;
    }

    if (typeof BroadcastChannel === 'undefined') {
      console.error('[EmojiSyncService] BroadcastChannel API is not supported in this browser');
      throw new Error('BroadcastChannel API is not supported. Please use a modern browser.');
    }

    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      this.channel.addEventListener('message', this.handleMessage.bind(this));
      this.isInitialized = true;
      console.log('[EmojiSyncService] Initialized successfully');
    } catch (error) {
      console.error('[EmojiSyncService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Broadcast a new emoji reaction to all other tabs
   * 
   * @param tokenId - The ID of the token being reacted to
   * @param emoji - The emoji character being added
   * @param userId - The ID of the user adding the reaction
   * 
   * @example
   * ```typescript
   * emojiSyncService.broadcastAddReaction('token123', '🚀', 'user456');
   * ```
   */
  broadcastAddReaction(tokenId: string, emoji: ChartEmoji, userId: string): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'add_reaction',
      tokenId,
      reaction: {
        id: this.generateMessageId(),
        tokenId,
        emoji,
        userId,
        timestamp: Date.now(),
        count: 1
      },
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId
    };

    this.broadcast(message);
  }

  /**
   * Broadcast removal of an emoji reaction to all other tabs
   * 
   * @param tokenId - The ID of the token the reaction was on
   * @param emoji - The emoji character being removed
   * @param userId - The ID of the user removing the reaction
   * 
   * @example
   * ```typescript
   * emojiSyncService.broadcastRemoveReaction('token123', '🚀', 'user456');
   * ```
   */
  broadcastRemoveReaction(tokenId: string, emoji: ChartEmoji, userId: string): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'remove_reaction',
      tokenId,
      reaction: {
        id: this.generateMessageId(),
        tokenId,
        emoji,
        userId,
        timestamp: Date.now(),
        count: 0
      },
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId
    };

    this.broadcast(message);
  }

  /**
   * Broadcast updated reaction statistics to all other tabs
   * 
   * @param tokenId - The ID of the token with updated stats
   * @param stats - The updated reaction statistics
   * 
   * @example
   * ```typescript
   * emojiSyncService.broadcastUpdateStats('token123', {
   *   tokenId: 'token123',
   *   rocketCount: 5,
   *   fireCount: 3,
   *   diamondCount: 2,
   *   skullCount: 1,
   *   totalReactions: 11,
   *   lastUpdated: Date.now()
   * });
   * ```
   */
  broadcastUpdateStats(tokenId: string, stats: ReactionStats): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'update_stats',
      tokenId,
      stats,
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId: 'system' // Stats updates are system-generated
    };

    this.broadcast(message);
  }

  /**
   * Request all tabs to send their current emoji reaction state
   * 
   * This is useful when a new tab is opened and needs to sync with existing tabs.
   * Other tabs will respond with their current state via sendSyncAll().
   * 
   * @example
   * ```typescript
   * // Request sync when a new tab opens
   * emojiSyncService.requestSyncAll();
   * ```
   */
  requestSyncAll(): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'sync_all',
      tokenId: 'global',
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId: 'system'
    };

    this.broadcast(message);
  }

  /**
   * Broadcast a sentiment vote to all other tabs
   *
   * @param tokenId - The ID of the token being voted on
   * @param voteType - The type of sentiment vote ('bullish' or 'bearish')
   * @param userId - The ID of the user casting the vote
   *
   * @example
   * ```typescript
   * emojiSyncService.broadcastSentimentVote('token123', 'bullish', 'user456');
   * ```
   */
  broadcastSentimentVote(tokenId: string, voteType: 'bullish' | 'bearish', userId: string): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'sentiment_vote',
      tokenId,
      sentimentVote: {
        voteType
      },
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId
    };

    this.broadcast(message);
  }

  /**
   * Send current emoji reaction state when a sync request is received
   *
   * This should be called when a 'sync_all' message is received.
   * The caller should provide the current state to broadcast.
   *
   * @param tokenId - The ID of the token to sync
   * @param reactions - Current emoji reactions to share
   * @param userId - The ID of the user sending the sync data
   *
   * @example
   * ```typescript
   * emojiSyncService.onMessage((message) => {
   *   if (message.type === 'sync_all') {
   *     const currentReactions = getCurrentReactions();
   *     emojiSyncService.sendSyncAll('token123', currentReactions, 'user456');
   *   }
   * });
   * ```
   */
  sendSyncAll(tokenId: string, reactions: any[], userId: string): void {
    this.ensureInitialized();

    const message: SyncMessage = {
      type: 'sync_all',
      tokenId,
      reaction: {
        id: this.generateMessageId(),
        tokenId,
        emoji: '🔄',
        userId,
        timestamp: Date.now(),
        count: reactions.length
      },
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      userId
    };

    this.broadcast(message);
  }

  /**
   * Register a callback to handle incoming sync messages
   * 
   * Multiple callbacks can be registered. Each will be called for every message.
   * Messages from the current user (based on userId) are filtered out automatically.
   * 
   * @param callback - Function to call when a sync message is received
   * @returns A function to unregister the callback
   * 
   * @example
   * ```typescript
   * const unregister = emojiSyncService.onMessage((message) => {
   *   if (message.type === 'add_reaction') {
   *     console.log('New reaction:', message.reaction);
   *   }
   * });
   * 
   * // Later, to unregister:
   * unregister();
   * ```
   */
  onMessage(callback: (message: SyncMessage) => void): () => void {
    this.messageCallbacks.push(callback);

    // Return unregister function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Close the BroadcastChannel and cleanup all listeners
   * 
   * This should be called when the service is no longer needed, typically
   * when the component or page unmounts.
   * 
   * @example
   * ```typescript
   * // In a React component cleanup
   * useEffect(() => {
   *   emojiSyncService.initialize();
   *   return () => {
   *     emojiSyncService.cleanup();
   *   };
   * }, []);
   * ```
   */
  cleanup(): void {
    if (this.channel) {
      try {
        this.channel.removeEventListener('message', this.handleMessage.bind(this));
        this.channel.close();
        this.channel = null;
      } catch (error) {
        console.error('[EmojiSyncService] Error during cleanup:', error);
      }
    }

    this.messageCallbacks = [];
    this.processedMessages.clear();
    this.isInitialized = false;
    console.log('[EmojiSyncService] Cleaned up successfully');
  }

  /**
   * Handle incoming BroadcastChannel messages
   * 
   * This is the internal message handler that processes incoming messages,
   * filters out duplicates, and notifies registered callbacks.
   * 
   * @private
   * @param event - The message event from BroadcastChannel
   */
  private handleMessage(event: MessageEvent<SyncMessage>): void {
    const message = event.data;

    // Validate message structure
    if (!this.isValidMessage(message)) {
      console.warn('[EmojiSyncService] Received invalid message:', message);
      return;
    }

    // Skip if we've already processed this message (deduplication)
    if (this.processedMessages.has(message.messageId)) {
      return;
    }

    // Mark message as processed
    this.processedMessages.add(message.messageId);

    // Cleanup old message IDs to prevent memory leaks
    this.cleanupMessageCache();

    // Notify all registered callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[EmojiSyncService] Error in message callback:', error);
      }
    });
  }

  /**
   * Broadcast a message to all other tabs
   * 
   * @private
   * @param message - The sync message to broadcast
   */
  private broadcast(message: SyncMessage): void {
    if (!this.channel) {
      console.error('[EmojiSyncService] Channel not initialized');
      return;
    }

    try {
      this.channel.postMessage(message);
      console.log('[EmojiSyncService] Broadcasted message:', message.type, message.tokenId);
    } catch (error) {
      console.error('[EmojiSyncService] Failed to broadcast message:', error);
    }
  }

  /**
   * Ensure the service is initialized before performing operations
   * 
   * @private
   * @throws {Error} If the service is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.channel) {
      throw new Error('EmojiSyncService is not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate a unique message ID for deduplication
   * 
   * @private
   * @returns A unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate that a message has the required structure
   * 
   * @private
   * @param message - The message to validate
   * @returns True if the message is valid, false otherwise
   */
  private isValidMessage(message: any): message is SyncMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.tokenId === 'string' &&
      typeof message.messageId === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.userId === 'string' &&
      ['add_reaction', 'remove_reaction', 'update_stats', 'sync_all', 'sentiment_vote'].includes(message.type)
    );
  }

  /**
   * Cleanup old message IDs from the cache to prevent memory leaks
   * 
   * @private
   */
  private cleanupMessageCache(): void {
    if (this.processedMessages.size > this.MESSAGE_CACHE_SIZE) {
      const entries = Array.from(this.processedMessages);
      // Remove the oldest half of the messages
      const toRemove = entries.slice(0, Math.floor(this.MESSAGE_CACHE_SIZE / 2));
      toRemove.forEach(id => this.processedMessages.delete(id));
    }
  }
}

// Export singleton instance
export const emojiSyncService = new EmojiSyncService();
