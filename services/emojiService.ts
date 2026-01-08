/**
 * Emoji Storage Service
 * 
 * A self-contained storage solution for emoji reactions, sentiment votes, 
 * and analytics data using localStorage. This service provides thread-safe 
 * operations with proper error handling for localStorage quota limits.
 */

import type {
  EmojiReaction,
  ReactionStats,
  EmojiAnalytics,
  ChartEmoji
} from '../types';

// Storage Keys
const STORAGE_KEYS = {
  REACTIONS: 'emoji_reactions',
  STATS: 'emoji_stats',
  ANALYTICS: 'emoji_analytics',
  USER_ID: 'emoji_user_id'
} as const;

// Error types
class EmojiServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EmojiServiceError';
  }
}

/**
 * Safely parse JSON from localStorage with error handling
 */
function safeParseJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely write JSON to localStorage with error handling
 * @throws {EmojiServiceError} If localStorage quota is exceeded
 */
function safeSetItem(key: string, value: unknown): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new EmojiServiceError(
        `localStorage quota exceeded while saving ${key}`,
        error
      );
    }
    throw new EmojiServiceError(
      `Failed to save ${key} to localStorage`,
      error
    );
  }
}

/**
 * Generate a unique user ID using timestamp + random string
 * @returns A unique user identifier string
 */
function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Get or generate a unique user ID for the current user
 * The ID is persisted in localStorage and reused on subsequent visits
 * 
 * @returns The user's unique identifier
 */
export function getUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!userId) {
    userId = generateUserId();
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Failed to save user ID:', error);
      // Return generated ID even if we can't persist it
    }
  }
  
  return userId;
}

/**
 * Get all emoji reactions, optionally filtered by token ID
 * 
 * @param tokenId - Optional token ID to filter reactions
 * @returns Array of emoji reactions
 */
export function getReactions(tokenId?: string): EmojiReaction[] {
  const allReactions = safeParseJSON<EmojiReaction[]>(
    STORAGE_KEYS.REACTIONS,
    []
  );
  
  if (tokenId) {
    return allReactions.filter(reaction => reaction.tokenId === tokenId);
  }
  
  return allReactions;
}

/**
 * Add a new emoji reaction for a token
 * If the user has already reacted with the same emoji, the count is incremented
 * 
 * @param tokenId - The ID of the token being reacted to
 * @param emoji - The emoji character to add
 * @throws {EmojiServiceError} If localStorage quota is exceeded
 */
export function addReaction(tokenId: string, emoji: ChartEmoji): void {
  const userId = getUserId();
  const allReactions = getReactions();
  
  // Check if user already has a reaction for this token with this emoji
  const existingReaction = allReactions.find(
    r => r.tokenId === tokenId && r.userId === userId && r.emoji === emoji
  );
  
  if (existingReaction) {
    // Increment count for existing reaction
    existingReaction.count++;
    existingReaction.timestamp = Date.now();
  } else {
    // Create new reaction
    const newReaction: EmojiReaction = {
      id: `${tokenId}-${userId}-${emoji}-${Date.now()}`,
      tokenId,
      emoji,
      userId,
      timestamp: Date.now(),
      count: 1
    };
    allReactions.push(newReaction);
  }
  
  safeSetItem(STORAGE_KEYS.REACTIONS, allReactions);
}

/**
 * Remove a user's emoji reaction for a token
 * Decrements the count; if count reaches 0, the reaction is removed
 * 
 * @param tokenId - The ID of the token
 * @param emoji - The emoji character to remove
 * @throws {EmojiServiceError} If localStorage quota is exceeded
 */
export function removeReaction(tokenId: string, emoji: ChartEmoji): void {
  const userId = getUserId();
  const allReactions = getReactions();
  
  const reactionIndex = allReactions.findIndex(
    r => r.tokenId === tokenId && r.userId === userId && r.emoji === emoji
  );
  
  if (reactionIndex === -1) {
    // Reaction doesn't exist, nothing to do
    return;
  }
  
  const reaction = allReactions[reactionIndex];
  
  if (reaction.count > 1) {
    // Decrement count
    reaction.count--;
    reaction.timestamp = Date.now();
  } else {
    // Remove reaction entirely
    allReactions.splice(reactionIndex, 1);
  }
  
  safeSetItem(STORAGE_KEYS.REACTIONS, allReactions);
}

/**
 * Get reaction statistics for a specific token
 * Returns null if no stats exist for the token
 * 
 * @param tokenId - The ID of the token
 * @returns ReactionStats object or null
 */
export function getReactionStats(tokenId: string): ReactionStats | null {
  const allStats = safeParseJSON<Record<string, ReactionStats>>(
    STORAGE_KEYS.STATS,
    {}
  );
  
  return allStats[tokenId] || null;
}

/**
 * Update reaction statistics for a specific token
 * 
 * @param tokenId - The ID of the token
 * @param stats - The updated stats object
 * @throws {EmojiServiceError} If localStorage quota is exceeded
 */
export function updateReactionStats(tokenId: string, stats: ReactionStats): void {
  const allStats = safeParseJSON<Record<string, ReactionStats>>(
    STORAGE_KEYS.STATS,
    {}
  );
  
  allStats[tokenId] = {
    ...stats,
    lastUpdated: Date.now()
  };
  
  safeSetItem(STORAGE_KEYS.STATS, allStats);
}

/**
 * Get emoji analytics data
 * Returns null if no analytics data exists
 * 
 * @returns EmojiAnalytics object or null
 */
export function getAnalytics(): EmojiAnalytics | null {
  return safeParseJSON<EmojiAnalytics | null>(
    STORAGE_KEYS.ANALYTICS,
    null
  );
}

/**
 * Update emoji analytics data
 * 
 * @param analytics - The updated analytics object
 * @throws {EmojiServiceError} If localStorage quota is exceeded
 */
export function updateAnalytics(analytics: EmojiAnalytics): void {
  safeSetItem(STORAGE_KEYS.ANALYTICS, analytics);
}

/**
 * Calculate reaction statistics from raw reactions for a token
 * This is a helper function that aggregates reaction counts
 * 
 * @param tokenId - The ID of the token
 * @returns Calculated ReactionStats object
 */
export function calculateReactionStats(tokenId: string): ReactionStats {
  const reactions = getReactions(tokenId);
  
  const stats: ReactionStats = {
    tokenId,
    rocketCount: 0,
    fireCount: 0,
    diamondCount: 0,
    skullCount: 0,
    totalReactions: 0,
    lastUpdated: Date.now()
  };
  
  reactions.forEach(reaction => {
    switch (reaction.emoji) {
      case '🚀':
        stats.rocketCount += reaction.count;
        break;
      case '🔥':
        stats.fireCount += reaction.count;
        break;
      case '💎':
        stats.diamondCount += reaction.count;
        break;
      case '💀':
        stats.skullCount += reaction.count;
        break;
    }
    stats.totalReactions += reaction.count;
  });
  
  return stats;
}

/**
 * Calculate analytics from raw reactions for a token
 * This is a helper function that computes comprehensive analytics
 * 
 * @param tokenId - The ID of the token
 * @returns Calculated EmojiAnalytics object
 */
export function calculateAnalytics(tokenId: string): EmojiAnalytics {
  const reactions = getReactions(tokenId);
  
  if (reactions.length === 0) {
    return {
      tokenId,
      popularEmojis: [],
      totalReactions: 0,
      uniqueReactors: 0,
      firstReactionAt: 0,
      lastReactionAt: 0,
      reactionsPerHour: 0,
      trend: 'stable'
    };
  }
  
  const uniqueUsers = new Set(reactions.map(r => r.userId));
  const emojiCounts = new Map<string, number>();
  const timestamps = reactions.map(r => r.timestamp);
  
  reactions.forEach(reaction => {
    const currentCount = emojiCounts.get(reaction.emoji) || 0;
    emojiCounts.set(reaction.emoji, currentCount + reaction.count);
  });
  
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
  
  // Sort emojis by count and calculate percentages
  const popularEmojis = Array.from(emojiCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: totalReactions > 0 ? (count / totalReactions) * 100 : 0
    }));
  
  const firstReactionAt = Math.min(...timestamps);
  const lastReactionAt = Math.max(...timestamps);
  
  // Calculate reactions per hour (over last 24 hours)
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const recentReactions = reactions.filter(r => r.timestamp >= twentyFourHoursAgo);
  const reactionsPerHour = recentReactions.length / 24;
  
  // Determine trend based on recent activity
  const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
  const recentCount = reactions.filter(r => r.timestamp >= twelveHoursAgo).length;
  const olderCount = reactions.filter(
    r => r.timestamp >= twentyFourHoursAgo && r.timestamp < twelveHoursAgo
  ).length;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentCount > olderCount * 1.2) {
    trend = 'up';
  } else if (recentCount < olderCount * 0.8) {
    trend = 'down';
  }
  
  return {
    tokenId,
    popularEmojis,
    totalReactions,
    uniqueReactors: uniqueUsers.size,
    firstReactionAt,
    lastReactionAt,
    reactionsPerHour,
    trend
  };
}

/**
 * Clear all emoji-related data from localStorage
 * This is primarily intended for testing or reset purposes
 * 
 * @throws {EmojiServiceError} If localStorage operations fail
 */
export function clearAllEmojiData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.REACTIONS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    throw new EmojiServiceError(
      'Failed to clear emoji data from localStorage',
      error
    );
  }
}

/**
 * Check if localStorage is available and accessible
 * 
 * @returns true if localStorage is available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__emoji_service_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the total size of all emoji data in localStorage (in bytes)
 * 
 * @returns Total size in bytes, or 0 if unavailable
 */
export function getEmojiDataSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }
  
  let totalSize = 0;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length * 2; // UTF-16 uses 2 bytes per character
    }
  });
  
  return totalSize;
}

/**
 * Export all emoji data as a JSON string
 * Useful for backup or migration purposes
 * 
 * @returns JSON string containing all emoji data
 * @throws {EmojiServiceError} If serialization fails
 */
export function exportEmojiData(): string {
  try {
    const data = {
      reactions: getReactions(),
      stats: safeParseJSON<Record<string, ReactionStats>>(STORAGE_KEYS.STATS, {}),
      analytics: getAnalytics(),
      userId: getUserId(),
      exportedAt: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw new EmojiServiceError('Failed to export emoji data', error);
  }
}

/**
 * Import emoji data from a JSON string
 * Useful for restoring from backup
 * 
 * @param jsonData - JSON string containing emoji data
 * @throws {EmojiServiceError} If import fails or data is invalid
 */
export function importEmojiData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    if (!data.reactions || !Array.isArray(data.reactions)) {
      throw new Error('Invalid data: reactions array is required');
    }
    
    if (data.stats && typeof data.stats !== 'object') {
      throw new Error('Invalid data: stats must be an object');
    }
    
    // Import data
    safeSetItem(STORAGE_KEYS.REACTIONS, data.reactions);
    
    if (data.stats) {
      safeSetItem(STORAGE_KEYS.STATS, data.stats);
    }
    
    if (data.analytics) {
      safeSetItem(STORAGE_KEYS.ANALYTICS, data.analytics);
    }
    
    if (data.userId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.userId);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new EmojiServiceError('Invalid JSON data', error);
    }
    throw new EmojiServiceError('Failed to import emoji data', error);
  }
}
