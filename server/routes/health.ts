/**
 * Health Check Routes
 * 
 * Provides liveness, readiness, and metrics endpoints for monitoring.
 * Compatible with Kubernetes probes and Vercel health checks.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { healthCheck as dbHealthCheck, closePool } from '../database/db.js';
import { logger } from '../utils/logger.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health
   * Basic health check - returns 200 if service is running
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime().toFixed(2),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  /**
   * GET /health/ready
   * Readiness probe - checks if service is ready to accept traffic
   */
  fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const dbHealth = await dbHealthCheck();
    const isReady = dbHealth.status === 'healthy';

    const statusCode = isReady ? 200 : 503;
    
    return reply.status(statusCode).send({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
      },
    });
  });

  /**
   * GET /health/live
   * Liveness probe - checks if service is alive
   */
  fastify.get('/health/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /metrics
   * Application metrics for monitoring
   */
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const dbHealth = await dbHealthCheck();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return reply.status(200).send({
      timestamp: new Date().toISOString(),
      uptime: process.uptime().toFixed(2),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      database: {
        status: dbHealth.status,
        connected: dbHealth.connected,
        poolSize: dbHealth.poolSize,
        idleCount: dbHealth.idleCount,
        waitingCount: dbHealth.waitingCount,
      },
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        lag: process.hrtime.bigint().toString(),
      },
    });
  });

  /**
   * GET /health/dependencies
   * Check external dependencies
   */
  fastify.get('/health/dependencies', async (request: FastifyRequest, reply: FastifyReply) => {
    const checks: any = {
      database: await dbHealthCheck(),
    };

    // Check storage
    try {
      const fs = await import('fs');
      const uploadsDir = process.env.UPLOAD_DIR || './uploads';
      await fs.promises.access(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      checks.storage = {
        status: 'healthy',
        path: uploadsDir,
      };
    } catch (error) {
      checks.storage = {
        status: 'unhealthy',
        path: process.env.UPLOAD_DIR || './uploads',
        error: error instanceof Error ? error.message : 'Storage not accessible',
      };
    }

    const allHealthy = Object.values(checks).every(
      (check: any) => check.status === 'healthy'
    );

    const statusCode = allHealthy ? 200 : 503;

    return reply.status(statusCode).send({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  logger.info('Health check routes registered');
}
