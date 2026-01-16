import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { JWTPayload, APIError, Permission, UserRole } from '../types/index.js';
import { authService } from '../services/authService.js';
import { verifyAccessToken, isTokenBlacklisted, verifyTokenIP, extractClientIP } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication middleware - verifies JWT token and injects user context
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'No authorization token provided',
      };
      return reply.status(401).send(error);
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token has been revoked',
      };
      return reply.status(401).send(error);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Verify IP address if token has IP binding
    const clientIP = extractClientIP(request);
    const ipValid = await verifyTokenIP(token, clientIP);

    if (!ipValid) {
      logger.warn(
        {
          userId: decoded.userId,
          clientIP,
        },
        'Authentication failed: IP address mismatch'
      );
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Session invalid. Please login again.',
      };
      return reply.status(401).send(error);
    }

    // Set user context
    request.user = decoded;
    request.userId = decoded.userId;

    logger.debug(`User authenticated: ${decoded.userId} from ${clientIP}`);
  } catch (error) {
    const apiError: APIError = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    };
    return reply.status(401).send(apiError);
  }
}

/**
 * Optional authentication middleware - doesn't reject if no token is provided
 */
export function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      if (!isTokenBlacklisted(token)) {
        const decoded = verifyAccessToken(token);
        request.user = decoded;
        request.userId = decoded.userId;
      }
    } catch (error) {
      // Token is invalid, but we don't reject the request
      // Just don't set request.user
    }
  }

  done();
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if the authenticated user has one of the specified roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async function roleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      };
      return reply.status(401).send(error);
    }

    if (!allowedRoles.includes(request.user.role)) {
      const error: APIError = {
        statusCode: 403,
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      };
      return reply.status(403).send(error);
    }
  };
}

/**
 * Permission-based authorization middleware factory
 * Creates middleware that checks if the authenticated user has one of the specified permissions
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return async function permissionMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      };
      return reply.status(401).send(error);
    }

    const hasPermission = authService.hasAnyPermission(
      request.user.role,
      requiredPermissions
    );

    if (!hasPermission) {
      const error: APIError = {
        statusCode: 403,
        error: 'Forbidden',
        message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}`,
      };
      return reply.status(403).send(error);
    }
  };
}

/**
 * Admin-only middleware
 * Shortcut for requireRole('admin')
 */
export const requireAdmin = requireRole('admin');

/**
 * User ownership validation middleware factory
 * Creates middleware that checks if the authenticated user owns the specified resource
 * The resource ID should be available at request.params[resourceIdParam]
 */
export function requireOwnership(resourceIdParam: string = 'userId') {
  return async function ownershipMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      const error: APIError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      };
      return reply.status(401).send(error);
    }

    // Admins can access any resource
    if (request.user.role === 'admin') {
      return;
    }

    const resourceUserId = (request.params as Record<string, string>)[resourceIdParam];
    
    if (!resourceUserId) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: `Resource ID parameter '${resourceIdParam}' not found`,
      };
      return reply.status(400).send(error);
    }

    if (resourceUserId !== request.user.userId) {
      const error: APIError = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      };
      return reply.status(403).send(error);
    }
  };
}

/**
 * Combined authentication and authorization middleware
 * Verifies token and checks for required permissions
 */
export function requireAuthWithPermission(...requiredPermissions: Permission[]) {
  return async function combinedMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // First, authenticate
    await authMiddleware(request, reply);
    
    // If authentication failed, reply is already sent
    if (reply.sent) {
      return;
    }
    
    // Then, check permissions
    await requirePermission(...requiredPermissions)(request, reply);
  };
}

/**
 * Combined authentication and role check middleware
 * Verifies token and checks for required role
 */
export function requireAuthWithRole(...allowedRoles: UserRole[]) {
  return async function combinedMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // First, authenticate
    await authMiddleware(request, reply);
    
    // If authentication failed, reply is already sent
    if (reply.sent) {
      return;
    }
    
    // Then, check role
    await requireRole(...allowedRoles)(request, reply);
  };
}

/**
 * Rate limiting for auth endpoints
 * Prevents brute force attacks
 */
const authAttempts = new Map<string, { count: number; resetTime: number }>();

export function authRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = config.AUTH.AUTH_RATE_LIMIT_WINDOW_MS;
  const maxAttempts = config.AUTH.AUTH_RATE_LIMIT_MAX_ATTEMPTS;
  
  const attempts = authAttempts.get(ip);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or create new counter
    authAttempts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    done();
    return;
  }
  
  if (attempts.count >= maxAttempts) {
    const error: APIError = {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      details: {
        retryAfter: Math.ceil((attempts.resetTime - now) / 1000),
      },
    };
    reply.status(429).send(error);
    return;
  }
  
  // Increment counter
  attempts.count++;
  done();
}

/**
 * Clean up old rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of authAttempts.entries()) {
    if (now > attempts.resetTime) {
      authAttempts.delete(ip);
    }
  }
}, 60000); // Clean up every minute

/**
 * Extracts user agent from request headers
 */
export function getUserAgent(request: FastifyRequest): string | undefined {
  return request.headers['user-agent'];
}

/**
 * Extracts IP address from request
 */
export function getIpAddress(request: FastifyRequest): string {
  return request.ip || 
         (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         'unknown';
}
