import { randomBytes } from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from '../services/cacheService.js';
import { logger } from '../utils/logger.js';
import { APIError } from '../types/index.js';

/**
 * CSRF Token Store Configuration
 */
const CSRF_TOKEN_PREFIX = 'csrf:';
const CSRF_TOKEN_TTL = 3600; // 1 hour
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 * @returns Base64-encoded random token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('base64');
}

/**
 * Generate a CSRF token for a specific user/session
 * @param userId - User ID to associate with the token
 * @param sessionId - Optional session ID for additional binding
 * @returns The generated CSRF token
 */
export async function createCSRFToken(
  userId: string,
  sessionId?: string
): Promise<string> {
  const token = generateCSRFToken();
  const key = `${CSRF_TOKEN_PREFIX}${userId}`;

  // Store token metadata
  const tokenData = {
    token,
    userId,
    sessionId,
    createdAt: Date.now(),
  };

  // Store in cache with TTL
  await cacheService.set(key, tokenData, CSRF_TOKEN_TTL);

  logger.debug({ userId, sessionId }, 'CSRF token generated');

  return token;
}

/**
 * Validate a CSRF token for a user
 * @param userId - User ID
 * @param token - CSRF token to validate
 * @returns True if token is valid, false otherwise
 */
export async function validateCSRFToken(
  userId: string,
  token: string
): Promise<boolean> {
  const key = `${CSRF_TOKEN_PREFIX}${userId}`;
  const stored = await cacheService.get<{
    token: string;
    userId: string;
    sessionId?: string;
    createdAt: number;
  }>(key);

  if (!stored) {
    logger.warn({ userId }, 'CSRF token not found in store');
    return false;
  }

  const isValid = stored.token === token;

  if (!isValid) {
    logger.warn({ userId }, 'CSRF token validation failed');
  }

  return isValid;
}

/**
 * Delete a CSRF token (logout/cleanup)
 * @param userId - User ID
 */
export async function deleteCSRFToken(userId: string): Promise<void> {
  const key = `${CSRF_TOKEN_PREFIX}${userId}`;
  await cacheService.delete(key);

  logger.debug({ userId }, 'CSRF token deleted');
}

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests
 *
 * Safe methods (no CSRF protection needed):
 * - GET
 * - HEAD
 * - OPTIONS
 *
 * State-changing methods (CSRF protection required):
 * - POST
 * - PUT
 * - DELETE
 * - PATCH
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip CSRF for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  // Skip CSRF if user is not authenticated (auth middleware will handle)
  if (!request.userId) {
    return;
  }

  // Get CSRF token from header
  const csrfToken = request.headers[CSRF_HEADER_NAME] as string;

  if (!csrfToken) {
    const error: APIError = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'CSRF token is missing',
      details: {
        requiredHeader: CSRF_HEADER_NAME,
      },
    };
    logger.warn({ userId: request.userId, method, url: request.url }, 'CSRF token missing');
    reply.status(403).send(error);
    return;
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request.userId, csrfToken);

  if (!isValid) {
    const error: APIError = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Invalid CSRF token',
      details: {
        reason: 'Token validation failed or expired',
      },
    };
    logger.warn({ userId: request.userId, method, url: request.url }, 'Invalid CSRF token');
    reply.status(403).send(error);
    return;
  }

  logger.debug({ userId: request.userId, method, url: request.url }, 'CSRF token validated');
}

/**
 * Optional CSRF Protection
 * Does not reject requests but validates token if present
 * Useful for API endpoints that support both authenticated and anonymous access
 */
export async function optionalCSRFProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip CSRF for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  // Skip CSRF if user is not authenticated
  if (!request.userId) {
    return;
  }

  // Get CSRF token from header
  const csrfToken = request.headers[CSRF_HEADER_NAME] as string;

  // If token is provided, validate it
  if (csrfToken) {
    const isValid = await validateCSRFToken(request.userId, csrfToken);

    if (!isValid) {
      const error: APIError = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid CSRF token',
      };
      reply.status(403).send(error);
      return;
    }
  }

  // If no token provided, allow request (optional protection)
}

/**
 * Add CSRF token to response headers
 * Call this after authentication to provide token to frontend
 */
export async function addCSRFTokenToHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Only add token if user is authenticated
  if (!request.userId) {
    return;
  }

  // Generate new CSRF token
  const token = await createCSRFToken(request.userId);

  // Add to response headers
  reply.header(CSRF_HEADER_NAME, token);
  reply.header('Access-Control-Expose-Headers', CSRF_HEADER_NAME);

  logger.debug({ userId: request.userId }, 'CSRF token added to response headers');
}

/**
 * Combined authentication and CSRF token generation
 * Use this for endpoints that authenticate users and need to provide CSRF tokens
 */
export async function authWithCSRFToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First, authenticate (user should already be authenticated by auth middleware)
  if (!request.userId || !request.user) {
    const error: APIError = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    };
    reply.status(401).send(error);
    return;
  }

  // Add CSRF token to headers
  await addCSRFTokenToHeaders(request, reply);
}

/**
 * Clean up expired CSRF tokens
 * Cache service handles this automatically with TTL
 * This function is kept for manual cleanup if needed
 */
export async function cleanupExpiredCSRFTokens(): Promise<void> {
  // Cache service automatically handles expiration via TTL
  // This is a no-op but kept for API compatibility
  logger.debug('CSRF token cleanup (handled by cache service TTL)');
}

/**
 * Get CSRF token for a user (for API endpoint)
 * @param userId - User ID
 * @returns CSRF token or null if not found
 */
export async function getCSRFToken(userId: string): Promise<string | null> {
  const key = `${CSRF_TOKEN_PREFIX}${userId}`;
  const stored = await cacheService.get<{
    token: string;
    userId: string;
    createdAt: number;
  }>(key);

  return stored?.token || null;
}

/**
 * Refresh CSRF token (invalidate old, create new)
 * @param userId - User ID
 * @returns New CSRF token
 */
export async function refreshCSRFToken(userId: string): Promise<string> {
  // Delete old token
  await deleteCSRFToken(userId);

  // Create new token
  return await createCSRFToken(userId);
}
