/**
 * PostgreSQL Database Connection Pool
 * 
 * Provides a singleton database connection pool with proper error handling
 * and connection management for production deployment.
 */

import { Pool, PoolConfig, QueryResult } from 'pg';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Database connection pool singleton
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const poolConfig: PoolConfig = {
      connectionString: config.DATABASE_URL,
      max: 20, // Maximum pool size
      min: 2, // Minimum pool size
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Return error after 2s if connection fails
    };

    pool = new Pool(poolConfig);

    // Log pool events
    pool.on('connect', () => {
      logger.debug('New database client connected');
    });

    pool.on('error', (err) => {
      logger.error({ error: err.message }, 'Unexpected database pool error');
    });

    pool.on('remove', () => {
      logger.debug('Database client removed from pool');
    });

    logger.info('Database connection pool initialized');
  }

  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const poolInstance = getPool();
  
  try {
    const result = await poolInstance.query<T>(text, params);
    return result;
  } catch (error) {
    logger.error({
      query: text.substring(0, 100),
      error: error instanceof Error ? error.message : String(error)
    }, 'Database query error');
    throw error;
  }
}

/**
 * Execute a query within a transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  connected: boolean;
  poolSize: number;
  idleCount: number;
  waitingCount: number;
}> {
  try {
    const poolInstance = getPool();
    const result = await poolInstance.query('SELECT NOW()');
    
    return {
      status: 'healthy',
      connected: true,
      poolSize: poolInstance.totalCount,
      idleCount: poolInstance.idleCount,
      waitingCount: poolInstance.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      poolSize: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }
}

/**
 * Close database connection pool
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection pool closed');
      pool = null;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error closing database pool');
    }
  }
}

/**
 * Graceful shutdown handler
 */
export function setupShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, closing database connections...`);
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
