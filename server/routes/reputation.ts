// Reputation Points API Routes
// Handles reputation point operations for token locking/unlocking

import { FastifyInstance } from 'fastify';

export default async function reputationRoutes(fastify: FastifyInstance) {
  // Middleware: Ensure user is authenticated
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * GET /api/reputation/me
   * Get current user's reputation points
   */
  fastify.get('/me', async (request, reply) => {
    const userId = (request as any).user.id;

    const result = await fastify.pg.query(
      'SELECT reputation_points FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return {
      success: true,
      reputation_points: result.rows[0].reputation_points
    };
  });

  /**
   * POST /api/reputation/award
   * Award reputation points to user (called when tokens are locked)
   * Body: { points: number, reason: string, token_id?: string, token_amount?: number }
   */
  fastify.post('/award', async (request, reply) => {
    const userId = (request as any).user.id;
    const { points, reason, token_id, token_amount } = request.body as {
      points: number;
      reason: string;
      token_id?: string;
      token_amount?: number;
    };

    if (!points || points <= 0) {
      return reply.status(400).send({ error: 'Points must be positive' });
    }

    if (!reason) {
      return reply.status(400).send({ error: 'Reason is required' });
    }

    const client = await fastify.pg.connect();

    try {
      await client.query('BEGIN');

      // Get current points
      const currentResult = await client.query(
        'SELECT reputation_points FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const oldPoints = currentResult.rows[0].reputation_points;
      const newPoints = oldPoints + points;

      // Update user's reputation points
      await client.query(
        'UPDATE users SET reputation_points = $1 WHERE id = $2',
        [newPoints, userId]
      );

      // Create audit log entry
      await client.query(
        `INSERT INTO reputation_audit_log
         (user_id, old_points, new_points, change_amount, reason, token_id, token_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, oldPoints, newPoints, points, reason, token_id || null, token_amount || null]
      );

      await client.query('COMMIT');

      return {
        success: true,
        old_points: oldPoints,
        new_points: newPoints,
        points_awarded: points
      };
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to award points' });
    } finally {
      client.release();
    }
  });

  /**
   * POST /api/reputation/deduct
   * Deduct reputation points from user (called when tokens are unlocked)
   * Body: { points: number, reason: string, token_id?: string, token_amount?: number }
   */
  fastify.post('/deduct', async (request, reply) => {
    const userId = (request as any).user.id;
    const { points, reason, token_id, token_amount } = request.body as {
      points: number;
      reason: string;
      token_id?: string;
      token_amount?: number;
    };

    if (!points || points <= 0) {
      return reply.status(400).send({ error: 'Points must be positive' });
    }

    if (!reason) {
      return reply.status(400).send({ error: 'Reason is required' });
    }

    const client = await fastify.pg.connect();

    try {
      await client.query('BEGIN');

      // Get current points
      const currentResult = await client.query(
        'SELECT reputation_points FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const oldPoints = currentResult.rows[0].reputation_points;

      // Check if user has enough points
      if (oldPoints < points) {
        return reply.status(400).send({
          error: 'Insufficient reputation points',
          current_points: oldPoints,
          requested: points
        });
      }

      const newPoints = oldPoints - points;

      // Update user's reputation points
      await client.query(
        'UPDATE users SET reputation_points = $1 WHERE id = $2',
        [newPoints, userId]
      );

      // Create audit log entry
      await client.query(
        `INSERT INTO reputation_audit_log
         (user_id, old_points, new_points, change_amount, reason, token_id, token_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, oldPoints, newPoints, -points, reason, token_id || null, token_amount || null]
      );

      await client.query('COMMIT');

      return {
        success: true,
        old_points: oldPoints,
        new_points: newPoints,
        points_deducted: points
      };
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to deduct points' });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/reputation/audit-log
   * Get audit log for current user
   * Query: ?limit=50&offset=0
   */
  fastify.get('/audit-log', async (request, reply) => {
    const userId = (request as any).user.id;
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

    const result = await fastify.pg.query(
      `SELECT
         id,
         old_points,
         new_points,
         change_amount,
         reason,
         token_id,
         token_amount,
         created_at
       FROM reputation_audit_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      success: true,
      entries: result.rows,
      count: result.rows.length
    };
  });

  /**
   * GET /api/reputation/leaderboard
   * Get top users by reputation points
   * Query: ?limit=100
   */
  fastify.get('/leaderboard', async (request, reply) => {
    const { limit = 100 } = request.query as { limit?: number };

    const result = await fastify.pg.query(
      `SELECT
         id,
         username,
         reputation_points,
         created_at
       FROM users
       WHERE reputation_points > 0
       ORDER BY reputation_points DESC
       LIMIT $1`,
      [limit]
    );

    return {
      success: true,
      leaderboard: result.rows,
      count: result.rows.length
    };
  });
}
