/**
 * Token Store Service
 *
 * Provides persistent storage for JWT tokens using Redis with in-memory fallback.
 * Replaces in-memory token storage to survive server restarts.
 *
 * Stores:
 * - Blacklisted tokens (logout functionality)
 * - Active refresh tokens
 * - Token metadata (user ID, expiry, IP binding)
 */

import { cacheService } from './cacheService.js';
import { logger } from '../utils/logger.js';

interface TokenMetadata {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiry: number;
  type: 'access' | 'refresh';
  blacklisted: boolean;
}

/**
 * Token Store Service
 */
class TokenStoreService {
  /**
   * Store token metadata
   */
  async setToken(
    token: string,
    metadata: Omit<TokenMetadata, 'blacklisted'>
  ): Promise<void> {
    try {
      const ttl = Math.floor((metadata.expiry - Date.now()) / 1000);

      if (ttl <= 0) {
        logger.warn({ token: token.slice(0, 20) + '...' }, 'Attempted to store expired token');
        return;
      }

      const tokenMetadata: TokenMetadata = {
        ...metadata,
        blacklisted: false,
      };

      // Store token metadata with TTL matching token expiry
      await cacheService.set(`token:${token}`, tokenMetadata, ttl);

      logger.debug({
        token: token.slice(0, 20) + '...',
        userId: metadata.userId,
        type: metadata.type,
        ttl,
      }, 'Token stored successfully');
    } catch (error) {
      logger.error({ error }, 'Error storing token');
    }
  }

  /**
   * Get token metadata
   */
  async getToken(token: string): Promise<TokenMetadata | null> {
    try {
      const metadata = await cacheService.get<TokenMetadata>(`token:${token}`);
      return metadata;
    } catch (error) {
      logger.error({ error, token: token.slice(0, 20) + '...' }, 'Error getting token');
      return null;
    }
  }

  /**
   * Add token to blacklist
   */
  async blacklistToken(
    token: string,
    expiryTime: number
  ): Promise<void> {
    try {
      const ttl = Math.floor((expiryTime - Date.now()) / 1000);

      if (ttl <= 0) {
        logger.warn({ token: token.slice(0, 20) + '...' }, 'Attempted to blacklist expired token');
        return;
      }

      // Get existing metadata if any
      const existing = await this.getToken(token);

      const metadata: TokenMetadata = existing || {
        userId: 'unknown',
        expiry: expiryTime,
        type: 'access',
      };

      // Update blacklist status
      metadata.blacklisted = true;

      // Store with TTL
      await cacheService.set(`token:${token}`, metadata, ttl);

      logger.info({
        token: token.slice(0, 20) + '...',
        userId: metadata.userId,
        ttl,
      }, 'Token blacklisted');
    } catch (error) {
      logger.error({ error }, 'Error blacklisting token');
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const metadata = await this.getToken(token);
      return metadata?.blacklisted || false;
    } catch (error) {
      logger.error({ error }, 'Error checking token blacklist');
      return false;
    }
  }

  /**
   * Remove token from storage (logout cleanup)
   */
  async removeToken(token: string): Promise<void> {
    try {
      await cacheService.delete(`token:${token}`);
      logger.debug({ token: token.slice(0, 20) + '...' }, 'Token removed from store');
    } catch (error) {
      logger.error({ error }, 'Error removing token');
    }
  }

  /**
   * Blacklist all tokens for a user (full logout)
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    try {
      // This would require scanning all tokens, which is expensive
      // Alternative: use a user-specific blacklist flag in cache
      const key = `user_blacklist:${userId}`;
      await cacheService.set(key, { blacklistedAt: Date.now() }, 7 * 24 * 3600); // 7 days

      logger.info({ userId }, 'All user tokens blacklisted');
    } catch (error) {
      logger.error({ error, userId }, 'Error blacklisting user tokens');
    }
  }

  /**
   * Check if user's tokens are blacklisted
   */
  async isUserBlacklisted(userId: string): Promise<boolean> {
    try {
      const blacklist = await cacheService.get<{ blacklistedAt: number }>(`user_blacklist:${userId}`);
      return !!blacklist;
    } catch (error) {
      logger.error({ error, userId }, 'Error checking user blacklist');
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // The cache service automatically handles expired entries
      // This is a no-op but kept for API compatibility
      logger.debug('Expired tokens cleanup (handled by cache service)');
    } catch (error) {
      logger.error({ error }, 'Error cleaning up tokens');
    }
  }

  /**
   * Get token statistics
   */
  async getStats(): Promise<{
    cacheStats: ReturnType<typeof cacheService.getStats>;
  }> {
    return {
      cacheStats: cacheService.getStats(),
    };
  }
}

// Export singleton instance
export const tokenStore = new TokenStoreService();

// Cleanup expired tokens every hour
setInterval(() => {
  tokenStore.cleanupExpiredTokens().catch((error) => {
    logger.error({ error }, 'Error cleaning up expired tokens');
  });
}, 60 * 60 * 1000);
