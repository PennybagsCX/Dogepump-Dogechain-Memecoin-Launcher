/**
 * PostgreSQL-based Comment Service
 * 
 * Provides persistent comment storage and management with PostgreSQL database.
 * Handles comment creation, retrieval, deletion, likes, and reporting.
 */

import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { query } from '../database/db.js';
import { logger } from '../utils/logger.js';

export interface Comment {
  id: string;
  tokenId: string;
  userId: string | null;
  username: string;
  content: string;
  imageId: string | null;
  imageUrl: string | null;
  likes: number;
  badges: string[];
  tradeAction: {
    type: 'buy' | 'sell' | null;
    amount: number | null;
  } | null;
  isDeleted: boolean;
  isReported: boolean;
  reports: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentRequest {
  tokenId: string;
  content: string;
  imageId?: string;
  tradeAction?: {
    type: 'buy' | 'sell';
    amount: number;
  };
}

export interface ReportRequest {
  type: 'comment' | 'token' | 'user';
  reason: string;
  description?: string;
}

/**
 * PostgreSQL-based Comment Service
 */
export class CommentService {
  /**
   * Creates a new comment
   */
  async createComment(
    userId: string | null,
    username: string,
    data: CreateCommentRequest
  ): Promise<Comment> {
    const { tokenId, content, imageId, tradeAction } = data;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (content.length > 5000) {
      throw new Error('Comment content cannot exceed 5000 characters');
    }

    // Create comment
    const result = await query(
      `INSERT INTO comments (token_id, user_id, content, image_id, badges, trade_action, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
      [
        tokenId,
        userId,
        content.trim(),
        imageId || null,
        '[]', // Empty badges array
        tradeAction ? JSON.stringify(tradeAction) : null,
      ]
    );

    const comment = result.rows[0];

    // Log audit event
    if (userId) {
      await this.logAuditEvent(userId, 'COMMENT_CREATED', 'comment', comment.id);
    }

    logger.info(`Comment created: ${comment.id} for token ${tokenId}`);

    return this.toComment(comment);
  }

  /**
   * Gets comments for a token
   */
  async getCommentsByTokenId(
    tokenId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ comments: Comment[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options || {};

    const offset = (page - 1) * limit;

    // Validate sort field
    const allowedSortFields = ['created_at', 'updated_at', 'likes'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    const result = await query(
      `SELECT * FROM comments 
       WHERE token_id = $1 AND is_deleted = false 
       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
       LIMIT $2 OFFSET $3`,
      [tokenId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM comments WHERE token_id = $1 AND is_deleted = false',
      [tokenId]
    );

    return {
      comments: result.rows.map((row: any) => this.toComment(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Gets a comment by ID
   */
  async getCommentById(commentId: string): Promise<Comment | null> {
    const result = await query(
      'SELECT * FROM comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toComment(result.rows[0]);
  }

  /**
   * Deletes a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Check if comment exists and user owns it
    const result = await query(
      'SELECT user_id FROM comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Comment not found');
    }

    if (result.rows[0].user_id !== userId) {
      throw new Error('You do not have permission to delete this comment');
    }

    // Soft delete comment
    await query(
      'UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1',
      [commentId]
    );

    // Log audit event
    await this.logAuditEvent(userId, 'COMMENT_DELETED', 'comment', commentId);

    logger.info(`Comment deleted: ${commentId} by user ${userId}`);
  }

  /**
   * Likes a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    // Check if comment exists
    const result = await query(
      'SELECT * FROM comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Comment not found');
    }

    // Increment likes
    await query(
      'UPDATE comments SET likes = likes + 1, updated_at = NOW() WHERE id = $1',
      [commentId]
    );

    // Log audit event
    await this.logAuditEvent(userId, 'COMMENT_LIKED', 'comment', commentId);

    logger.info(`Comment liked: ${commentId} by user ${userId}`);
  }

  /**
   * Reports a comment
   */
  async reportComment(
    commentId: string,
    reporterId: string,
    data: ReportRequest
  ): Promise<void> {
    // Check if comment exists
    const commentResult = await query(
      'SELECT * FROM comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      throw new Error('Comment not found');
    }

    const comment = commentResult.rows[0];

    // Create report
    await query(
      `INSERT INTO reports (type, reporter_id, comment_id, reason, description, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      ['comment', reporterId, commentId, data.reason, data.description || null]
    );

    // Update comment report status
    await query(
      'UPDATE comments SET reports = reports + 1, is_reported = true, updated_at = NOW() WHERE id = $1',
      [commentId]
    );

    // Log audit event
    await this.logAuditEvent(reporterId, 'COMMENT_REPORTED', 'comment', commentId);

    logger.info(`Comment reported: ${commentId} by user ${reporterId}`);
  }

  /**
   * Gets reports for comments
   */
  async getCommentReports(
    options?: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    }
  ): Promise<{ reports: any[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      status,
    } = options || {};

    const offset = (page - 1) * limit;

    let queryStr = 'SELECT r.*, c.content as comment_content, u.username as reporter_username FROM reports r LEFT JOIN comments c ON r.comment_id = c.id LEFT JOIN users u ON r.reporter_id = u.id WHERE r.type = \'comment\'';
    const params: any[] = [];

    if (status) {
      queryStr += ' AND r.status = $' + (params.length + 1);
      params.push(status);
    }

    queryStr += ' ORDER BY r.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(queryStr, params);

    // Get total count
    let countQueryStr = 'SELECT COUNT(*) as count FROM reports WHERE r.type = \'comment\'';
    let countParams: any[] = [];

    if (status) {
      countQueryStr += ' AND r.status = $' + (countParams.length + 1);
      countParams.push(status);
    }

    const countResult = await query(countQueryStr, countParams);

    return {
      reports: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Resolves a report
   */
  async resolveReport(
    reportId: string,
    reviewerId: string,
    resolution: string,
    status: 'resolved' | 'dismissed'
  ): Promise<void> {
    await query(
      `UPDATE reports 
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), resolution = $3 
       WHERE id = $4`,
      [status, reviewerId, resolution, reportId]
    );

    // Log audit event
    await this.logAuditEvent(reviewerId, 'REPORT_RESOLVED', 'report', reportId);

    logger.info(`Report resolved: ${reportId} by reviewer ${reviewerId}`);
  }

  /**
   * Converts database row to Comment object
   */
  private toComment(row: any): Comment {
    return {
      id: row.id,
      tokenId: row.token_id,
      userId: row.user_id,
      username: row.username || 'Anonymous',
      content: row.content,
      imageId: row.image_id,
      imageUrl: row.image_url,
      likes: row.likes || 0,
      badges: row.badges || [],
      tradeAction: row.trade_action ? JSON.parse(row.trade_action) : null,
      isDeleted: row.is_deleted,
      isReported: row.is_reported,
      reports: row.reports || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Logs an audit event
   */
  private async logAuditEvent(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null
  ): Promise<void> {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
      [userId, action, resourceType, resourceId]
    );
  }

  /**
   * Gets comment statistics
   */
  async getCommentStatistics(tokenId: string): Promise<{
    total: number;
    today: number;
    thisWeek: number;
  }> {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week
       FROM comments 
       WHERE token_id = $1 AND is_deleted = false`,
      [tokenId]
    );

    return {
      total: parseInt(result.rows[0].total),
      today: parseInt(result.rows[0].today),
      thisWeek: parseInt(result.rows[0].this_week),
    };
  }

  /**
   * Searches comments
   */
  async searchComments(
    searchQuery: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ comments: Comment[]; total: number }> {
    const {
      page = 1,
      limit = 20,
    } = options || {};

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT * FROM comments
       WHERE content ILIKE $1 AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchQuery}%`, limit, offset]
    );

    // Get total count
    const countResult = await query(
      "SELECT COUNT(*) as count FROM comments WHERE content ILIKE $1 AND is_deleted = false",
      [`%${searchQuery}%`]
    );

    return {
      comments: result.rows.map((row: any) => this.toComment(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }
}

// Export singleton instance
export const commentService = new CommentService();
