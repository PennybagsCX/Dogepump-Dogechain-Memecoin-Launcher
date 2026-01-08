/**
 * Validation Middleware
 * 
 * This middleware provides comprehensive validation for requests, including
 * input sanitization, security validations, and data validation.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { APIError, ValidationResult } from '../types/index.js';
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateCommentContent
} from '../utils/userUtils.js';
import {
  sanitizeInput,
  sanitizeUrlParam,
  sanitizeForXSS,
  sanitizeForSQL,
  detectSQLInjection,
  detectXSS,
} from '../utils/securityUtils.js';
import { getSecurityService } from '../services/securityService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Re-export validation functions from userUtils for backward compatibility
// ============================================================================

export {
  validateEmail,
  validatePassword,
  validateUsername,
  validateCommentContent,
};

// ============================================================================
// File Type Validation
// ============================================================================

export function validateFileType(mimetype: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  return allowedTypes.includes(mimetype);
}

// ============================================================================
// File Size Validation
// ============================================================================

export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

// ============================================================================
// Generic Validation Middleware
// ============================================================================

export async function validationMiddleware<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  validator: (data: T) => ValidationResult
): Promise<void> {
  const result = validator(request.body as T);

  if (!result.valid) {
    const error: APIError = {
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: result.errors,
    };
    logger.warn({
      userId: request.userId,
      errors: result.errors,
    }, 'Validation failed');
    return reply.status(400).send(error);
  }
}

export function createValidationMiddleware<T>(
  validator: (data: T) => ValidationResult
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await validationMiddleware(request, reply, validator);
  };
}

// ============================================================================
// Input Sanitization Middleware
// ============================================================================

/**
 * Sanitize request body inputs
 */
export function sanitizeRequestBody(request: FastifyRequest): void {
  if (!request.body) return;

  const body = request.body as Record<string, any>;

  for (const key in body) {
    if (typeof body[key] === 'string') {
      body[key] = sanitizeInput(body[key]);
    } else if (typeof body[key] === 'object' && body[key] !== null) {
      sanitizeObject(body[key]);
    }
  }
}

/**
 * Sanitize nested objects
 */
function sanitizeObject(obj: Record<string, any>): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(request: FastifyRequest): void {
  if (!request.query) return;

  const query = request.query as Record<string, any>;

  for (const key in query) {
    if (typeof query[key] === 'string') {
      query[key] = sanitizeUrlParam(query[key]);
    }
  }
}

/**
 * Sanitize path parameters
 */
export function sanitizePathParams(request: FastifyRequest): void {
  if (!request.params) return;

  const params = request.params as Record<string, any>;

  for (const key in params) {
    if (typeof params[key] === 'string') {
      params[key] = sanitizeUrlParam(params[key]);
    }
  }
}

/**
 * Create input sanitization middleware
 */
export function createSanitizationMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    sanitizeRequestBody(request);
    sanitizeQueryParams(request);
    sanitizePathParams(request);
  };
}

// ============================================================================
// Security Validation Middleware
// ============================================================================

/**
 * Validate request for security issues
 */
export function validateRequestSecurity(request: FastifyRequest): ValidationResult {
  const errors: string[] = [];
  const securityService = getSecurityService();

  // Check request body for SQL injection
  if (request.body) {
    const bodyStr = JSON.stringify(request.body);
    if (detectSQLInjection(bodyStr)) {
      errors.push('Potential SQL injection detected in request body');
      securityService.logSecurityEvent(
        'SQL_INJECTION_DETECTED',
        'warn',
        {
          userId: request.userId,
          path: request.url,
          method: request.method,
        }
      );
    }

    // Check for XSS
    const xssResult = detectXSS(bodyStr);
    if (xssResult.hasXSS) {
      errors.push(`XSS patterns detected in request body: ${xssResult.patterns.join(', ')}`);
      securityService.logSecurityEvent(
        'XSS_DETECTED',
        'warn',
        {
          userId: request.userId,
          path: request.url,
          method: request.method,
          patterns: xssResult.patterns,
        }
      );
    }
  }

  // Check query parameters
  if (request.query) {
    const queryStr = JSON.stringify(request.query);
    if (detectSQLInjection(queryStr)) {
      errors.push('Potential SQL injection detected in query parameters');
      securityService.logSecurityEvent(
        'SQL_INJECTION_DETECTED',
        'warn',
        {
          userId: request.userId,
          path: request.url,
          method: request.method,
          location: 'query',
        }
      );
    }
  }

  // Check path parameters
  if (request.params) {
    const paramsStr = JSON.stringify(request.params);
    if (detectSQLInjection(paramsStr)) {
      errors.push('Potential SQL injection detected in path parameters');
      securityService.logSecurityEvent(
        'SQL_INJECTION_DETECTED',
        'warn',
        {
          userId: request.userId,
          path: request.url,
          method: request.method,
          location: 'params',
        }
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create security validation middleware
 */
export function createSecurityValidationMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = validateRequestSecurity(request);

    if (!result.valid) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Security validation failed',
        details: result.errors,
      };
      logger.error({
        userId: request.userId,
        path: request.url,
        errors: result.errors,
      }, 'Security validation failed');
      return reply.status(400).send(error);
    }
  };
}

// ============================================================================
// Request Validation Middleware (Combined)
// ============================================================================

/**
 * Combined middleware that sanitizes and validates requests
 */
export function createRequestValidationMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Step 1: Sanitize inputs
    sanitizeRequestBody(request);
    sanitizeQueryParams(request);
    sanitizePathParams(request);

    // Step 2: Validate security
    const securityResult = validateRequestSecurity(request);
    if (!securityResult.valid) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Security validation failed',
        details: securityResult.errors,
      };
      logger.error({
        userId: request.userId,
        path: request.url,
        errors: securityResult.errors,
      }, 'Security validation failed');
      return reply.status(400).send(error);
    }
  };
}

// ============================================================================
// Specific Validation Functions
// ============================================================================

/**
 * Validate email address
 */
export function validateEmailInput(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password
 */
export function validatePasswordInput(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username
 */
export function validateUsernameInput(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else if (!validateUsername(username)) {
    errors.push('Invalid username format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate ID parameter
 */
export function validateIdParam(id: string): ValidationResult {
  const errors: string[] = [];

  if (!id || id.trim().length === 0) {
    errors.push('ID is required');
  } else if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
    errors.push('Invalid ID format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page?: string,
  limit?: string
): { valid: boolean; errors: string[]; page?: number; limit?: number } {
  const errors: string[] = [];
  let parsedPage: number | undefined;
  let parsedLimit: number | undefined;

  if (page) {
    parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit) {
    parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    page: parsedPage,
    limit: parsedLimit,
  };
}

/**
 * Validate sort parameters
 */
export function validateSortParams(
  sortBy?: string,
  sortOrder?: string
): { valid: boolean; errors: string[]; sortBy?: string; sortOrder?: 'asc' | 'desc' } {
  const errors: string[] = [];
  const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'size'];
  const allowedSortOrders = ['asc', 'desc'];

  if (sortBy && !allowedSortFields.includes(sortBy)) {
    errors.push(`Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`);
  }

  if (sortOrder && !allowedSortOrders.includes(sortOrder)) {
    errors.push(`Invalid sort order. Allowed: ${allowedSortOrders.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
  };
}

// ============================================================================
// Schema Validation Middleware (for structured validation)
// ============================================================================

export interface ValidationSchema {
  body?: Record<string, (value: any) => ValidationResult>;
  query?: Record<string, (value: any) => ValidationResult>;
  params?: Record<string, (value: any) => ValidationResult>;
}

/**
 * Create schema-based validation middleware
 */
export function createSchemaValidationMiddleware(schema: ValidationSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const errors: string[] = [];

    // Validate body
    if (schema.body && request.body) {
      const body = request.body as Record<string, any>;
      for (const [field, validator] of Object.entries(schema.body)) {
        if (field in body) {
          const result = validator(body[field]);
          if (!result.valid) {
            errors.push(`${field}: ${result.errors.join(', ')}`);
          }
        }
      }
    }

    // Validate query
    if (schema.query && request.query) {
      const query = request.query as Record<string, any>;
      for (const [field, validator] of Object.entries(schema.query)) {
        if (field in query) {
          const result = validator(query[field]);
          if (!result.valid) {
            errors.push(`${field}: ${result.errors.join(', ')}`);
          }
        }
      }
    }

    // Validate params
    if (schema.params && request.params) {
      const params = request.params as Record<string, any>;
      for (const [field, validator] of Object.entries(schema.params)) {
        if (field in params) {
          const result = validator(params[field]);
          if (!result.valid) {
            errors.push(`${field}: ${result.errors.join(', ')}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      const error: APIError = {
        statusCode: 400,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors,
      };
      logger.warn({
        userId: request.userId,
        path: request.url,
        errors,
      }, 'Schema validation failed');
      return reply.status(400).send(error);
    }
  };
}

// ============================================================================
// Rate Limit Validation
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: FastifyRequest) => string;
}

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // Create new record
      const resetTime = now + this.config.windowMs;
      this.requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }

    // Update existing record
    if (record.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: this.config.maxRequests - record.count, resetTime: record.resetTime };
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiters
const rateLimiters: Map<string, RateLimiter> = new Map();

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig, name: string = 'default') {
  if (!rateLimiters.has(name)) {
    rateLimiters.set(name, new RateLimiter(config));
  }

  const limiter = rateLimiters.get(name)!;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = config.keyGenerator ? config.keyGenerator(request) : request.ip;
    const result = limiter.isAllowed(key);

    if (!result.allowed) {
      const error: APIError = {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        details: {
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
      };
      logger.warn({
        userId: request.userId,
        ip: request.ip,
        path: request.url,
      }, 'Rate limit exceeded');
      reply.header('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
      return reply.status(429).send(error);
    }

    reply.header('X-RateLimit-Limit', config.maxRequests);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  };
}

