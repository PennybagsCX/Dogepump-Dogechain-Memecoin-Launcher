/**
 * Reports API Routes
 *
 * Handles:
 * - Creating reports (comments, tokens, users)
 * - Listing all reports (admin only)
 * - Updating report status (admin only)
 * - Resolving reports with actions
 */

import { FastifyInstance } from 'fastify';
import { query } from '../database/db.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

export async function reportsRoutes(fastify: FastifyInstance) {
  // ============================================================
  // CREATE REPORT
  // ============================================================

  /**
   * POST /api/reports
   * Create a new report (authenticated users)
   */
  fastify.post('/', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      // Extract body parameters for error logging
      const { type, commentId, tokenId, reportedUserId, reason, description } = request.body as {
        type: 'comment' | 'token' | 'user';
        commentId?: string;
        tokenId?: string;
        reportedUserId?: string;
        reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
        description: string;
      };
      const userId = (request as any).user.userId;

      try {
        // Validate required fields
        if (!type || !reason) {
          return reply.status(400).send({
            success: false,
            error: 'Type and reason are required'
          });
        }

        // Validate type-specific fields
        // Note: commentId is optional for comment reports since they may be from local storage
        if (type === 'token' && !tokenId) {
          return reply.status(400).send({
            success: false,
            error: 'Token ID is required for token reports'
          });
        }

        // Get reported user ID from comment if not provided
        let targetUserId = reportedUserId;
        if (type === 'comment' && commentId && !targetUserId) {
          const commentResult = await query(
            'SELECT user_id FROM comments WHERE id = $1',
            [commentId]
          );
          if (commentResult.rows.length > 0) {
            targetUserId = commentResult.rows[0].user_id;
          }
        }

        // Check for duplicate report
        const duplicateCheck = await query(
          `SELECT id FROM reports
           WHERE reporter_id = $1
           AND type = $2
           AND (comment_id = $3 OR token_id = $4 OR reported_user_id = $5)
           AND status IN ('pending', 'reviewing')`,
          [userId, type, commentId || null, tokenId || null, targetUserId || null]
        );

        if (duplicateCheck.rows.length > 0) {
          return reply.status(400).send({
            success: false,
            error: 'You have already reported this item'
          });
        }

        // Create report
        const result = await query(
          `INSERT INTO reports (type, reporter_id, reported_user_id, comment_id, token_id, reason, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [type, userId, targetUserId || null, commentId || null, tokenId || null, reason, description]
        );

        logger.info({ reportId: result.rows[0].id, type, userId }, 'Report created');

        return reply.status(201).send({
          success: true,
          report: result.rows[0]
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        console.error('[REPORTS] Database query error:', errorMsg);
        console.error('[REPORTS] Error details:', { type, userId, reportedUserId, commentId, tokenId, reason, stack });
        logger.error({ error: errorMsg }, 'Database query error');
        logger.error({
          stack,
          type,
          userId,
          reportedUserId,
          commentId,
          tokenId,
          reason
        }, 'Error details');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create report',
          details: errorMsg
        });
      }
    }
  });

  // ============================================================
  // LIST REPORTS (ADMIN ONLY)
  // ============================================================

  /**
   * GET /api/reports
   * Get all reports (admin only)
   */
  fastify.get('/', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { status, type, limit = '100', offset = '0' } = request.query as {
          status?: string;
          type?: string;
          limit?: string;
          offset?: string;
        };

        // Verify admin
        const userResult = await query(
          'SELECT role FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows[0]?.role !== 'admin') {
          return reply.status(403).send({
            success: false,
            error: 'Admin access required'
          });
        }

        // Build query with filters
        let queryText = `
          SELECT
            r.*,
            reporter.username as reporter_username,
            reported_user.username as reported_username,
            reviewer.username as reviewer_username
          FROM reports r
          LEFT JOIN users reporter ON r.reporter_id = reporter.id
          LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
          LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 0;

        if (status) {
          paramCount++;
          queryText += ` AND r.status = $${paramCount}`;
          params.push(status);
        }

        if (type) {
          paramCount++;
          queryText += ` AND r.type = $${paramCount}`;
          params.push(type);
        }

        paramCount++;
        queryText += ` ORDER BY r.created_at DESC LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));

        const result = await query(queryText, params);

        return reply.send({
          success: true,
          reports: result.rows
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching reports');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch reports'
        });
      }
    }
  });

  // ============================================================
  // UPDATE REPORT STATUS (ADMIN ONLY)
  // ============================================================

  /**
   * PUT /api/reports/:id
   * Update report status and resolution (admin only)
   */
  fastify.put('/:id', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };
        const { status, resolution, actionTaken } = request.body as {
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
          resolution?: string;
          actionTaken?: 'none' | 'resolved' | 'dismissed' | 'token_delisted' | 'user_banned' | 'warned';
        };

        // Verify admin
        const userResult = await query(
          'SELECT role FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows[0]?.role !== 'admin') {
          return reply.status(403).send({
            success: false,
            error: 'Admin access required'
          });
        }

        // Check if report exists
        const existingReport = await query(
          'SELECT * FROM reports WHERE id = $1',
          [id]
        );

        if (existingReport.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found'
          });
        }

        // Update report
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramCount = 0;

        if (status) {
          paramCount++;
          updateFields.push(`status = $${paramCount}`);
          updateValues.push(status);
        }

        if (resolution !== undefined) {
          paramCount++;
          updateFields.push(`resolution = $${paramCount}`);
          updateValues.push(resolution);
        }

        if (actionTaken) {
          paramCount++;
          updateFields.push(`action_taken = $${paramCount}`);
          updateValues.push(actionTaken);
        }

        if (status === 'resolved' || status === 'dismissed') {
          paramCount++;
          updateFields.push(`reviewed_by = $${paramCount}`);
          updateValues.push(userId);

          paramCount++;
          updateFields.push(`reviewed_at = NOW()`);
        }

        if (updateFields.length > 0) {
          paramCount++;
          updateValues.push(id);

          const updateQuery = `
            UPDATE reports
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
          `;

          const result = await query(updateQuery, updateValues);

          logger.info({ reportId: id, userId, status }, 'Report updated');

          return reply.send({
            success: true,
            report: result.rows[0]
          });
        }

        return reply.send({
          success: true,
          report: existingReport.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error updating report');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update report'
        });
      }
    }
  });

  // ============================================================
  // GET REPORT BY ID
  // ============================================================

  /**
   * GET /api/reports/:id
   * Get a single report by ID (admin only)
   */
  fastify.get('/:id', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };

        // Verify admin
        const userResult = await query(
          'SELECT role FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows[0]?.role !== 'admin') {
          return reply.status(403).send({
            success: false,
            error: 'Admin access required'
          });
        }

        const result = await query(
          `SELECT
            r.*,
            reporter.username as reporter_username,
            reported_user.username as reported_username,
            reviewer.username as reviewer_username
          FROM reports r
          LEFT JOIN users reporter ON r.reporter_id = reporter.id
          LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
          LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
          WHERE r.id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found'
          });
        }

        return reply.send({
          success: true,
          report: result.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching report');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch report'
        });
      }
    }
  });
}
