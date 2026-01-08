/**
 * Redis-based Cache Service
 * 
 * Provides caching functionality using Redis for improved performance.
 * This is an optional service - if Redis is not available, operations will fall back to no-op.
 */

import { logger } from '../utils/logger.js';
import { config } from '../config.js';

// Redis client type (lazy import to avoid requiring Redis when not configured)
let redisClient: any = null;
let redisAvailable = false;

/**
 * Cache Service
 * 
 * Provides caching operations with Redis fallback to in-memory cache
 */
export class CacheService {
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (!config.REDIS_URL) {
      logger.info('Redis not configured, using in-memory cache fallback');
      return;
    }

    try {
      // Dynamic import to avoid requiring Redis when not configured
      // @ts-ignore - redis is an optional dependency
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: config.REDIS_URL,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              return new Error('Max reconnection retries reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err: Error) => {
        logger.error({ error: err.message }, 'Redis client error');
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        logger.info('Redis client connected');
        redisAvailable = true;
      });

      await redisClient.connect();
      logger.info('Cache service initialized with Redis');
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to connect to Redis, using in-memory cache');
      redisAvailable = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        if (memoryEntry.expiry > Date.now()) {
          return memoryEntry.value as T;
        }
        this.memoryCache.delete(key);
      }

      // Check Redis if available
      if (redisAvailable && redisClient) {
        const value = await redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      }

      return null;
    } catch (error) {
      logger.error({ key, error }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const expiry = Date.now() + (ttlSeconds * 1000);

      // Set in memory cache
      this.memoryCache.set(key, { value, expiry });

      // Set in Redis if available
      if (redisAvailable && redisClient) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      }

      logger.debug({ key, ttlSeconds }, 'Cache set');
    } catch (error) {
      logger.error({ key, error }, 'Cache set error');
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from memory cache
      this.memoryCache.delete(key);

      // Delete from Redis if available
      if (redisAvailable && redisClient) {
        await redisClient.del(key);
      }

      logger.debug({ key }, 'Cache delete');
    } catch (error) {
      logger.error({ key, error }, 'Cache delete error');
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Delete from memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          this.memoryCache.delete(key);
        }
      }

      // Delete from Redis if available
      if (redisAvailable && redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }

      logger.debug({ pattern }, 'Cache delete pattern');
    } catch (error) {
      logger.error({ pattern, error }, 'Cache delete pattern error');
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis if available
      if (redisAvailable && redisClient) {
        await redisClient.flushDb();
      }

      logger.info('Cache cleared');
    } catch (error) {
      logger.error({ error }, 'Cache clear error');
    }
  }

  /**
   * Get or set pattern - get from cache or compute and set
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expiry > Date.now()) {
        return true;
      }

      // Check Redis if available
      if (redisAvailable && redisClient) {
        const exists = await redisClient.exists(key);
        return exists === 1;
      }

      return false;
    } catch (error) {
      logger.error({ key, error }, 'Cache exists error');
      return false;
    }
  }

  /**
   * Increment value in cache
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    try {
      // Increment in memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expiry > Date.now()) {
        const newValue = (memoryEntry.value as number) + delta;
        this.memoryCache.set(key, { value: newValue, expiry: memoryEntry.expiry });
        return newValue;
      }

      // Increment in Redis if available
      if (redisAvailable && redisClient) {
        const newValue = await redisClient.incrBy(key, delta);
        return newValue;
      }

      return delta;
    } catch (error) {
      logger.error({ key, error }, 'Cache increment error');
      return delta;
    }
  }

  /**
   * Set value with expiration only if key doesn't exist
   */
  async setNX(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      // Check if key exists in memory
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expiry > Date.now()) {
        return false;
      }

      const expiry = Date.now() + (ttlSeconds * 1000);
      this.memoryCache.set(key, { value, expiry });

      // Set in Redis if available
      if (redisAvailable && redisClient) {
        const result = await redisClient.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
          NX: true,
        });
        return result === 'OK';
      }

      return true;
    } catch (error) {
      logger.error({ key, error }, 'Cache setNX error');
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results: (T | null)[] = [];

      for (const key of keys) {
        results.push(await this.get<T>(key));
      }

      return results;
    } catch (error) {
      logger.error({ keys, error }, 'Cache mget error');
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.value, entry.ttl || 3600);
      }
    } catch (error) {
      logger.error({ entries, error }, 'Cache mset error');
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        redisAvailable = false;
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.error({ error }, 'Redis disconnect error');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    redisAvailable: boolean;
    memoryCacheSize: number;
  } {
    return {
      redisAvailable,
      memoryCacheSize: this.memoryCache.size,
    };
  }

  /**
   * Clean expired entries from memory cache
   */
  cleanExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Helper: Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Initialize cache service
cacheService.initialize().catch((error) => {
  logger.error({ error }, 'Failed to initialize cache service');
});

// Clean expired entries every 5 minutes
setInterval(() => {
  cacheService.cleanExpiredEntries();
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  cacheService.disconnect().catch((error) => {
    logger.error({ error }, 'Error disconnecting cache service');
  });
});

process.on('SIGINT', () => {
  cacheService.disconnect().catch((error) => {
    logger.error({ error }, 'Error disconnecting cache service');
  });
});
