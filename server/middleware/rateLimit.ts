import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { APIError, RateLimitResponse } from '../types/index.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const rateLimitPlugin = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.ip;
    const now = Date.now();

    // Clean up expired entries
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }

    // Initialize or get current limit info
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + config.RATE_LIMIT_WINDOW_MS,
      };
    }

    // Increment counter
    rateLimitStore[key].count++;

    // Check if limit exceeded
    if (rateLimitStore[key].count > config.RATE_LIMIT_MAX_REQUESTS) {
      const resetTime = rateLimitStore[key].resetTime;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      reply.header('X-RateLimit-Limit', config.RATE_LIMIT_MAX_REQUESTS);
      reply.header('X-RateLimit-Remaining', 0);
      reply.header('X-RateLimit-Reset', resetTime);
      reply.header('Retry-After', retryAfter);

      const error: APIError = {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        details: {
          retryAfter,
        },
      };
      return reply.status(429).send(error);
    }

    // Add rate limit headers
    const remaining = config.RATE_LIMIT_MAX_REQUESTS - rateLimitStore[key].count;
    reply.header('X-RateLimit-Limit', config.RATE_LIMIT_MAX_REQUESTS);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', rateLimitStore[key].resetTime);
  });
});

// Custom rate limit for specific routes
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const customStore: RateLimitStore = {};

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.ip;
    const now = Date.now();

    // Clean up expired entries
    if (customStore[key] && customStore[key].resetTime < now) {
      delete customStore[key];
    }

    // Initialize or get current limit info
    if (!customStore[key]) {
      customStore[key] = {
        count: 0,
        resetTime: now + options.windowMs,
      };
    }

    // Increment counter
    customStore[key].count++;

    // Check if limit exceeded
    if (customStore[key].count > options.maxRequests) {
      const resetTime = customStore[key].resetTime;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      reply.header('X-RateLimit-Limit', options.maxRequests);
      reply.header('X-RateLimit-Remaining', 0);
      reply.header('X-RateLimit-Reset', resetTime);
      reply.header('Retry-After', retryAfter);

      const error: APIError = {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        details: {
          retryAfter,
        },
      };
      return reply.status(429).send(error);
    }

    // Add rate limit headers
    const remaining = options.maxRequests - customStore[key].count;
    reply.header('X-RateLimit-Limit', options.maxRequests);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', customStore[key].resetTime);
  };
}
