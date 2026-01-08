/**
 * Moderation API Routes
 *
 * Handles:
 * - Warning system (3-strike)
 * - Ban/unban users
 * - Token delisting/relisting
 * - Admin action logging
 * - Warning acknowledgment
 */

import { FastifyInstance } from 'fastify';
import { query } from '../database/db.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

export async function moderationRoutes(fastify: FastifyInstance) {
  // ============================================================
  // WARNINGS
  // ============================================================

  /**
   * GET /api/moderation/warnings
   * Get all warnings (admin only)
   */
  fastify.get('/warnings', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;

        // Verify user is admin
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

        const result = await query(`
          SELECT
            w.*,
            warner.username as warned_by_username,
            acknowledger.username as acknowledger_username,
            clearer.username as cleared_by_username
          FROM warned_users w
          LEFT JOIN users warner ON w.warned_by = warner.id
          LEFT JOIN users acknowledger ON w.acknowledged_by = acknowledger.id
          LEFT JOIN users clearer ON w.cleared_by = clearer.id
          ORDER BY w.created_at DESC
        `);

        return reply.send({
          success: true,
          warnings: result.rows
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching warnings');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch warnings'
        });
      }
    }
  });

  /**
   * GET /api/moderation/warnings/user/:walletAddress
   * Get warnings for a specific user
   */
  fastify.get('/warnings/user/:walletAddress', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const { walletAddress } = request.params as { walletAddress: string };

        const result = await query(`
          SELECT * FROM warned_users
          WHERE wallet_address = $1
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY created_at DESC
        `, [walletAddress]);

        return reply.send({
          success: true,
          warnings: result.rows
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching user warnings');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch warnings'
        });
      }
    }
  });

  /**
   * POST /api/moderation/warnings
   * Issue a new warning (admin only)
   */
  fastify.post('/warnings', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const body = request.body as {
          targetAddress: string;
          reason: string;
          notes?: string;
          tokenId?: string;
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

        const { targetAddress, reason, notes, tokenId } = body;

        // Count active warnings
        const countResult = await query(`
          SELECT COUNT(*) as count
          FROM warned_users
          WHERE wallet_address = $1
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
            AND ($2::text IS NULL OR token_id = $2)
        `, [targetAddress, tokenId || null]);

        const warningCount = parseInt(countResult.rows[0].count);

        // Check if this would be the 4th warning (3-strike rule)
        if (warningCount >= 3) {
          // Apply penalty instead of adding 4th warning
          if (tokenId) {
            // Delist token
            await query(`
              UPDATE tokens
              SET delisted = true,
                  delisted_reason = $1,
                  delisted_at = NOW()
              WHERE id = $2
            `, [`Automatic delist after 3 warnings. ${reason}`, tokenId]);

            // Log admin action
            await query(`
              INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, target_wallet_address, reason, notes, metadata)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [userId, 'delist_token', 'token', tokenId, targetAddress, reason, notes, JSON.stringify({ automatic: true, warningCount: 3 })]);
          } else {
            // Ban user
            await query(`
              INSERT INTO banned_users (user_id, wallet_address, username, banned_by, ban_reason, admin_notes, is_automatic)
              SELECT id, wallet_address, username, $1, $2, $3, true
              FROM users WHERE wallet_address = $4
            `, [userId, `Automatic ban after 3 warnings. ${reason}`, notes, targetAddress]);

            // Log admin action
            await query(`
              INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, target_wallet_address, reason, notes, metadata)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [userId, 'ban_user', 'user', targetAddress, targetAddress, reason, notes, JSON.stringify({ automatic: true, warningCount: 3 })]);
          }

          return reply.send({
            success: true,
            message: tokenId ? 'Token auto-delisted after 3 warnings' : 'User auto-banned after 3 warnings',
            penaltyApplied: true
          });
        }

        // Add the warning (less than 3)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const result = await query(`
          INSERT INTO warned_users (user_id, wallet_address, username, token_id, warned_by, warning_reason, admin_notes, expires_at)
          SELECT id, $2, username, $3, $4, $5, $6, $7
          FROM users WHERE wallet_address = $1
          RETURNING *
        `, [targetAddress, targetAddress, tokenId || null, userId, reason, notes || null, expiresAt]);

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, target_wallet_address, reason, notes, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [userId, 'warn_user', tokenId ? 'token' : 'user', tokenId || targetAddress, targetAddress, reason, notes || null, JSON.stringify({ warningNumber: warningCount + 1 })]);

        return reply.send({
          success: true,
          warning: result.rows[0],
          warningCount: warningCount + 1
        });
      } catch (error) {
        logger.error({ error }, 'Error creating warning');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create warning'
        });
      }
    }
  });

  /**
   * PUT /api/moderation/warnings/:id/acknowledge
   * Acknowledge a warning
   */
  fastify.put('/warnings/:id/acknowledge', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };

        const result = await query(`
          UPDATE warned_users
          SET acknowledged_at = NOW(),
              acknowledged_by = $1
          WHERE id = $2
          RETURNING *
        `, [userId, id]);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Warning not found'
          });
        }

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, 'acknowledge_warning', 'user', id, 'Warning acknowledged', null]);

        return reply.send({
          success: true,
          warning: result.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error acknowledging warning');
        return reply.status(500).send({
          success: false,
          error: 'Failed to acknowledge warning'
        });
      }
    }
  });

  /**
   * DELETE /api/moderation/warnings/:id
   * Clear a warning (admin only)
   */
  fastify.delete('/warnings/:id', {
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

        const result = await query(`
          UPDATE warned_users
          SET is_active = false,
              cleared_at = NOW(),
              cleared_by = $1
          WHERE id = $2
          RETURNING *
        `, [userId, id]);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Warning not found'
          });
        }

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, 'clear_warning', 'user', id, 'Warning cleared by admin', null]);

        return reply.send({
          success: true,
          warning: result.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error clearing warning');
        return reply.status(500).send({
          success: false,
          error: 'Failed to clear warning'
        });
      }
    }
  });

  // ============================================================
  // BANS
  // ============================================================

  /**
   * GET /api/moderation/bans
   * Get all bans (admin only)
   */
  fastify.get('/bans', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;

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

        const result = await query(`
          SELECT
            b.*,
            banner.username as banned_by_username,
            unbanner.username as unbanned_by_username
          FROM banned_users b
          LEFT JOIN users banner ON b.banned_by = banner.id
          LEFT JOIN users unbanner ON b.unbanned_by = unbanner.id
          ORDER BY b.banned_at DESC
        `);

        return reply.send({
          success: true,
          bans: result.rows
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching bans');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch bans'
        });
      }
    }
  });

  /**
   * POST /api/moderation/bans
   * Ban a user (admin only)
   */
  fastify.post('/bans', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const body = request.body as {
          targetAddress: string;
          reason: string;
          notes?: string;
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

        const { targetAddress, reason, notes } = body;

        const result = await query(`
          INSERT INTO banned_users (user_id, wallet_address, username, banned_by, ban_reason, admin_notes, is_automatic)
          SELECT id, $1, username, $2, $3, $4, false
          FROM users WHERE wallet_address = $1
          ON CONFLICT (wallet_address, is_active) DO UPDATE SET
            is_active = true,
            banned_at = NOW(),
            unbanned_at = NULL,
            unbanned_by = NULL
          RETURNING *
        `, [targetAddress, userId, reason, notes || null]);

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, target_wallet_address, reason, notes, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [userId, 'ban_user', 'user', targetAddress, targetAddress, reason, notes || null, JSON.stringify({ automatic: false })]);

        return reply.send({
          success: true,
          ban: result.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error creating ban');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create ban'
        });
      }
    }
  });

  /**
   * DELETE /api/moderation/bans/:walletAddress
   * Unban a user (admin only)
   */
  fastify.delete('/bans/:walletAddress', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { walletAddress } = request.params as { walletAddress: string };

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

        const result = await query(`
          UPDATE banned_users
          SET is_active = false,
              unbanned_at = NOW(),
              unbanned_by = $1
          WHERE wallet_address = $2 AND is_active = true
          RETURNING *
        `, [userId, walletAddress]);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Active ban not found'
          });
        }

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, target_wallet_address, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [userId, 'unban_user', 'user', walletAddress, walletAddress, 'User unbanned', null]);

        return reply.send({
          success: true,
          ban: result.rows[0]
        });
      } catch (error) {
        logger.error({ error }, 'Error unbanning user');
        return reply.status(500).send({
          success: false,
          error: 'Failed to unban user'
        });
      }
    }
  });

  // ============================================================
  // TOKEN ACTIONS
  // ============================================================

  /**
   * POST /api/moderation/tokens/:tokenId/delist
   * Delist a token (admin only)
   */
  fastify.post('/tokens/:tokenId/delist', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { tokenId } = request.params as { tokenId: string };
        const body = request.body as {
          reason: string;
          notes?: string;
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

        const { reason, notes } = body;

        // This would need a tokens table - for now using placeholder
        // In production, update the tokens table
        logger.info({ tokenId, reason, notes, adminId: userId }, 'Token delisted');

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, notes, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [userId, 'delist_token', 'token', tokenId, reason, notes || null, JSON.stringify({ automatic: false })]);

        return reply.send({
          success: true,
          message: 'Token delisted successfully'
        });
      } catch (error) {
        logger.error({ error }, 'Error delisting token');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delist token'
        });
      }
    }
  });

  /**
   * POST /api/moderation/tokens/:tokenId/relist
   * Relist a token (admin only)
   */
  fastify.post('/tokens/:tokenId/relist', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { tokenId } = request.params as { tokenId: string };

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

        // This would need a tokens table - for now using placeholder
        logger.info({ tokenId, adminId: userId }, 'Token relisted');

        // Log admin action
        await query(`
          INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, 'relist_token', 'token', tokenId, 'Token relisted by admin', null]);

        return reply.send({
          success: true,
          message: 'Token relisted successfully'
        });
      } catch (error) {
        logger.error({ error }, 'Error relisting token');
        return reply.status(500).send({
          success: false,
          error: 'Failed to relist token'
        });
      }
    }
  });

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================

  /**
   * GET /api/moderation/actions
   * Get admin actions log (admin only)
   */
  fastify.get('/actions', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const { limit = '100', offset = '0' } = request.query as { limit?: string; offset?: string };

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

        const result = await query(`
          SELECT
            a.*,
            admin.username as admin_username
          FROM admin_actions a
          LEFT JOIN users admin ON a.admin_id = admin.id
          ORDER BY a.created_at DESC
          LIMIT $1 OFFSET $2
        `, [parseInt(limit), parseInt(offset)]);

        return reply.send({
          success: true,
          actions: result.rows
        });
      } catch (error) {
        logger.error({ error }, 'Error fetching admin actions');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch admin actions'
        });
      }
    }
  });

  // ============================================================
  // DATABASE RESET (Development/Testing)
  // ============================================================

  /**
   * DELETE /api/moderation/reset
   * Clear all moderation data (admin only, for testing)
   */
  fastify.delete('/reset', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user.userId;

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

        // Clear all moderation tables
        await query('DELETE FROM reports');
        await query('DELETE FROM admin_actions');
        await query('DELETE FROM warned_users');
        await query('DELETE FROM banned_users');

        logger.info({ userId }, 'Moderation data reset by admin');

        return reply.send({
          success: true,
          message: 'All moderation data cleared successfully'
        });
      } catch (error) {
        logger.error({ error }, 'Error resetting moderation data');
        return reply.status(500).send({
          success: false,
          error: 'Failed to reset moderation data'
        });
      }
    }
  });
}
