/**
 * Audit Logging Service
 *
 * Comprehensive logging of admin and security-sensitive actions
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

/**
 * Audit action categories
 */
export enum AuditAction {
  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_BANNED = 'USER_BANNED',
  USER_UNBANNED = 'USER_UNBANNED',
  USER_WARNED = 'USER_WARNED',

  // Content moderation
  COMMENT_DELETED = 'COMMENT_DELETED',
  COMMENT_APPROVED = 'COMMENT_APPROVED',
  TOKEN_DELISTED = 'TOKEN_DELISTED',
  TOKEN_LISTED = 'TOKEN_LISTED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  REPORT_DISMISSED = 'REPORT_DISMISSED',

  // Security
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',

  // Admin actions
  ADMIN_CREATED = 'ADMIN_CREATED',
  ADMIN_DELETED = 'ADMIN_DELETED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',

  // Platform
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  FEATURE_ENABLED = 'FEATURE_ENABLED',
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // Data
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  DATA_PURGED = 'DATA_PURGED',

  // Blockchain
  CONTRACT_DEPLOYED = 'CONTRACT_DEPLOYED',
  CONTRACT_UPGRADED = 'CONTRACT_UPGRADED',
  EMERGENCY_PAUSE = 'EMERGENCY_PAUSE',
  EMERGENCY_UNPAUSE = 'EMERGENCY_UNPAUSE',
}

/**
 * Resource types that can be acted upon
 */
export enum ResourceType {
  USER = 'user',
  TOKEN = 'token',
  COMMENT = 'comment',
  REPORT = 'report',
  ADMIN = 'admin',
  CONFIG = 'config',
  CONTRACT = 'contract',
  FEATURE = 'feature',
}

/**
 * Audit log entry
 */
export interface AuditLog {
  adminId?: string;
  userId?: string;
  action: AuditAction | string;
  resourceType?: ResourceType | string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  details?: Record<string, any>;
}

/**
 * Audit log query options
 */
export interface AuditLogQuery {
  adminId?: string;
  userId?: string;
  action?: AuditAction | string;
  resourceType?: ResourceType | string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Audit log result
 */
export interface AuditLogResult {
  id: string;
  adminId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  details: Record<string, any>;
  createdAt: Date;
}

/**
 * Audit logging service
 */
export class AuditLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLog): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO audit_logs (
          user_id,
          action,
          resource_type,
          resource_id,
          ip_address,
          user_agent,
          status,
          details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.adminId || entry.userId || null,
          entry.action,
          entry.resourceType || null,
          entry.resourceId || null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.status || 'success',
          entry.details ? JSON.stringify(entry.details) : null,
        ]
      );

      logger.info({
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        userId: entry.adminId || entry.userId,
      }, 'Audit log entry created');
    } catch (error) {
      logger.error('Failed to create audit log entry', error);
      // Don't throw - audit logging failures shouldn't break the application
    }
  }

  /**
   * Query audit logs
   */
  async query(query: AuditLogQuery = {}): Promise<AuditLogResult[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (query.adminId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(query.adminId);
      }

      if (query.action) {
        conditions.push(`action = $${paramIndex++}`);
        params.push(query.action);
      }

      if (query.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`);
        params.push(query.resourceType);
      }

      if (query.resourceId) {
        conditions.push(`resource_id = $${paramIndex++}`);
        params.push(query.resourceId);
      }

      if (query.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(query.startDate);
      }

      if (query.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(query.endDate);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const limitClause = query.limit
        ? `LIMIT $${paramIndex++}`
        : '';

      if (query.limit) {
        params.push(query.limit);
      }

      const offsetClause = query.offset
        ? `OFFSET $${paramIndex++}`
        : '';

      if (query.offset) {
        params.push(query.offset);
      }

      const result = await this.pool.query(
        `SELECT * FROM audit_logs
         ${whereClause}
         ORDER BY created_at DESC
         ${limitClause}
         ${offsetClause}`,
        params
      );

      return result.rows.map(row => ({
        id: row.id,
        adminId: row.user_id,
        userId: row.user_id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        status: row.status,
        details: row.details || {},
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error('Failed to query audit logs', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getById(id: string): Promise<AuditLogResult | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM audit_logs WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        adminId: row.user_id,
        userId: row.user_id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        status: row.status,
        details: row.details || {},
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Failed to get audit log by ID', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(options: {
    startDate?: Date;
    endDate?: Date;
    adminId?: string;
  } = {}): Promise<{
    totalLogs: number;
    actionCounts: Record<string, number>;
    resourceTypeCounts: Record<string, number>;
    statusCounts: Record<string, number>;
  }> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (options.adminId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(options.adminId);
      }

      if (options.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(options.startDate);
      }

      if (options.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(options.endDate);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      // Get total count
      const countResult = await this.pool.query(
        `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
        params
      );

      const totalLogs = parseInt(countResult.rows[0].count);

      // Get action counts
      const actionResult = await this.pool.query(
        `SELECT action, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY action ORDER BY count DESC`,
        params
      );

      const actionCounts: Record<string, number> = {};
      for (const row of actionResult.rows) {
        actionCounts[row.action] = parseInt(row.count);
      }

      // Get resource type counts
      const resourceResult = await this.pool.query(
        `SELECT resource_type, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY resource_type ORDER BY count DESC`,
        params
      );

      const resourceTypeCounts: Record<string, number> = {};
      for (const row of resourceResult.rows) {
        resourceTypeCounts[row.resource_type] = parseInt(row.count);
      }

      // Get status counts
      const statusResult = await this.pool.query(
        `SELECT status, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY status ORDER BY count DESC`,
        params
      );

      const statusCounts: Record<string, number> = {};
      for (const row of statusResult.rows) {
        statusCounts[row.status] = parseInt(row.count);
      }

      return {
        totalLogs,
        actionCounts,
        resourceTypeCounts,
        statusCounts,
      };
    } catch (error) {
      logger.error('Failed to get audit statistics', error);
      throw error;
    }
  }

  /**
   * Create audit log from HTTP request
   */
  fromRequest(request: {
    userId?: string;
    ip?: string;
    headers?: Record<string, unknown>;
  }, action: AuditAction | string, resourceType?: ResourceType | string, resourceId?: string, details?: Record<string, any>): AuditLog {
    return {
      adminId: request.userId,
      userId: request.userId,
      action,
      resourceType,
      resourceId,
      ipAddress: request.ip || this.extractIP(request),
      userAgent: this.extractUserAgent(request),
      details,
    };
  }

  /**
   * Extract IP address from request
   */
  private extractIP(request: {
    ip?: string;
    headers?: Record<string, unknown>;
  }): string {
    // Direct IP
    if (request.ip) {
      return request.ip;
    }

    // Headers
    const headers = request.headers || {};
    const forwardedFor = headers['x-forwarded-for'] as string;
    const realIP = headers['x-real-ip'] as string;
    const cfConnectingIP = headers['cf-connecting-ip'] as string;

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return 'unknown';
  }

  /**
   * Extract user agent from request
   */
  private extractUserAgent(request: {
    headers?: Record<string, unknown>;
  }): string {
    const headers = request.headers || {};
    return (headers['user-agent'] as string) || 'unknown';
  }
}

/**
 * Create audit logger instance
 */
export function createAuditLogger(pool: Pool): AuditLogger {
  return new AuditLogger(pool);
}

/**
 * Middleware for automatic audit logging
 */
export function auditLogMiddleware(auditLogger: AuditLogger) {
  return async (
    request: {
      userId?: string;
      ip?: string;
      headers?: Record<string, unknown>;
      method?: string;
      url?: string;
      route?: string;
    },
    action: AuditAction | string,
    resourceType?: ResourceType | string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> => {
    const log = auditLogger.fromRequest(
      request,
      action,
      resourceType,
      resourceId,
      {
        ...details,
        method: request.method,
        url: request.url,
        route: request.route,
      }
    );

    await auditLogger.log(log);
  };
}
