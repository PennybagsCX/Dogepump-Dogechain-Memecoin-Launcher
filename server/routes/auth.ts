import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { authService } from '../services/authServicePostgres.js';
import { handleError } from '../middleware/errorHandler.js';
import {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  authRateLimit,
  getUserAgent,
  getIpAddress
} from '../middleware/auth.js';
import {
  APIError,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/register
   * Register a new user account
   */
  fastify.post('/register', {
    preHandler: authRateLimit,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as RegisterRequest;
      
      const result = await authService.register(body);
      
      logger.info(`New user registered: ${result.user.email}`);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Registration Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Registration Error',
        'Failed to register user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/login
   * Login with email and password
   */
  fastify.post('/login', {
    preHandler: authRateLimit,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as LoginRequest;
      
      const userAgent = getUserAgent(request);
      const ipAddress = getIpAddress(request);
      
      const result = await authService.login(body, userAgent, ipAddress);
      
      logger.info(`User logged in: ${result.user.email} from ${ipAddress}`);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 401,
          error: 'Login Failed',
          message: error.message,
        };
        return reply.status(401).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Login Error',
        'Failed to login user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/logout
   * Logout the current user (invalidate refresh token)
   */
  fastify.post('/logout', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as RefreshTokenRequest;
      
      if (!body.refreshToken) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Refresh token is required',
        };
        return reply.status(400).send(error);
      }
      
      await authService.logout(body.refreshToken);
      
      logger.info(`User logged out: ${request.userId}`);
      return reply.status(200).send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Logout Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Logout Error',
        'Failed to logout user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/logout-all
   * Logout from all devices
   */
  fastify.post('/logout-all', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        const error: APIError = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User ID not found',
        };
        return reply.status(401).send(error);
      }
      
      const count = await authService.logoutAll(request.userId);
      
      logger.info(`User logged out from all devices: ${request.userId} (${count} sessions)`);
      return reply.status(200).send({
        success: true,
        message: `Logged out from ${count} device(s)`,
        sessionsRevoked: count,
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Logout Error',
        'Failed to logout from all devices',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as RefreshTokenRequest;
      
      if (!body.refreshToken) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Refresh token is required',
        };
        return reply.status(400).send(error);
      }
      
      const result = await authService.refreshToken(body.refreshToken);
      
      return reply.status(200).send({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 401,
          error: 'Token Refresh Failed',
          message: error.message,
        };
        return reply.status(401).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Refresh Error',
        'Failed to refresh token',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * GET /auth/verify
   * Verify access token and return user profile
   */
  fastify.get('/verify', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
      const user = await authService.verifyAccessToken(token);
      
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 401,
          error: 'Verification Failed',
          message: error.message,
        };
        return reply.status(401).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Verification Error',
        'Failed to verify token',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * GET /auth/me
   * Get current user profile
   */
  fastify.get('/me', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        const error: APIError = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User ID not found',
        };
        return reply.status(401).send(error);
      }
      
      const user = await authService.getProfile(request.userId);
      
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        };
        return reply.status(404).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Profile Error',
        'Failed to get user profile',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * PATCH /auth/me
   * Update current user profile
   */
  fastify.patch('/me', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        const error: APIError = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User ID not found',
        };
        return reply.status(401).send(error);
      }
      
      const body = request.body as UpdateProfileRequest;
      const user = await authService.updateProfile(request.userId, body);
      
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Update Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Update Error',
        'Failed to update profile',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/change-password
   * Change user password
   */
  fastify.post('/change-password', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        const error: APIError = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User ID not found',
        };
        return reply.status(401).send(error);
      }
      
      const body = request.body as ChangePasswordRequest;
      await authService.changePassword(request.userId, body);
      
      logger.info(`Password changed for user: ${request.userId}`);
      return reply.status(200).send({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Password Change Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Password Change Error',
        'Failed to change password',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/reset-password
   * Request password reset (initiates reset flow)
   * Note: This is a placeholder - in production, you would send an email with a reset link
   */
  fastify.post('/reset-password', {
    preHandler: authRateLimit,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as ResetPasswordRequest;
      
      // TODO: Implement email sending with reset token
      // For now, just return a success message
      logger.info(`Password reset requested for: ${body.email}`);
      
      return reply.status(200).send({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Password Reset Error',
        'Failed to request password reset',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/reset-password/confirm
   * Confirm password reset with token
   * Note: This is a placeholder - in production, verify the reset token from email
   */
  fastify.post('/reset-password/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as ResetPasswordConfirmRequest;
      
      // TODO: Implement token verification and password update
      // For now, return a not implemented response
      const error: APIError = {
        statusCode: 501,
        error: 'Not Implemented',
        message: 'Password reset confirmation not yet implemented',
      };
      return reply.status(501).send(error);
    } catch (error) {
      const apiError = handleError(
        500,
        'Password Reset Error',
        'Failed to confirm password reset',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * GET /auth/permissions
   * Get current user's permissions
   */
  fastify.get('/permissions', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        const error: APIError = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User not authenticated',
        };
        return reply.status(401).send(error);
      }
      
      const rolePermissions = authService.getRolePermissions(request.user.role);
      
      return reply.status(200).send({
        success: true,
        role: rolePermissions.role,
        permissions: rolePermissions.permissions,
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Permissions Error',
        'Failed to get permissions',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * GET /auth/admin/users
   * Get all users (admin only)
   */
  fastify.get('/admin/users', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await authService.getAllUsers();
      
      return reply.status(200).send({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to get users',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * PATCH /auth/admin/users/:userId/role
   * Update user role (admin only)
   */
  fastify.patch('/admin/users/:userId/role', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { role } = request.body as { role: 'user' | 'admin' };
      
      if (!['user', 'admin'].includes(role)) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid role. Must be "user" or "admin"',
        };
        return reply.status(400).send(error);
      }
      
      const user = await authService.updateUserRole(userId, role);
      
      logger.info(`User role updated by admin: ${userId} -> ${role}`);
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Update Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to update user role',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/admin/users/:userId/deactivate
   * Deactivate a user (admin only)
   */
  fastify.post('/admin/users/:userId/deactivate', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      await authService.deactivateUser(userId);
      
      logger.info(`User deactivated by admin: ${userId}`);
      return reply.status(200).send({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Deactivation Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to deactivate user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/admin/users/:userId/activate
   * Activate a user (admin only)
   */
  fastify.post('/admin/users/:userId/activate', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      await authService.activateUser(userId);
      
      logger.info(`User activated by admin: ${userId}`);
      return reply.status(200).send({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Activation Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to activate user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * DELETE /auth/admin/users/:userId
   * Delete a user (admin only)
   */
  fastify.delete('/admin/users/:userId', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      await authService.deleteUser(userId);
      
      logger.info(`User deleted by admin: ${userId}`);
      return reply.status(200).send({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        const apiError: APIError = {
          statusCode: 400,
          error: 'Deletion Failed',
          message: error.message,
        };
        return reply.status(400).send(apiError);
      }
      
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to delete user',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * GET /auth/admin/stats
   * Get authentication statistics (admin only)
   */
  fastify.get('/admin/stats', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userCount = await authService.getUserCount();
      
      return reply.status(200).send({
        success: true,
        stats: {
          totalUsers: userCount,
        },
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Admin Error',
        'Failed to get stats',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });

  /**
   * POST /auth/demo
   * Create a demo user token (development only)
   * This endpoint is only available in development mode
   */
  fastify.post('/demo', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only allow in development mode
    if (config.NODE_ENV === 'production') {
      const apiError: APIError = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Demo mode is only available in development',
      };
      return reply.status(403).send(apiError);
    }

    try {
      const body = request.body as { address?: string; username?: string };
      const demoAddress = body.address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      const demoUsername = body.username || 'Anonymous Doge';
      const { query } = await import('../database/db.js');

      // Check if demo user already exists in database
      const existingUser = await query(
        'SELECT id, username, email FROM users WHERE wallet_address = $1',
        [demoAddress]
      );

      let userId: string;
      let username: string;
      let email: string;

      if (existingUser.rows.length > 0) {
        // Use existing user
        userId = existingUser.rows[0].id;
        username = existingUser.rows[0].username;
        email = existingUser.rows[0].email;
        logger.info(`Demo user found in database: ${username} (${userId})`);
      } else {
        // Create new demo user in database
        const newUser = await query(
          `INSERT INTO users (username, email, password_hash, wallet_address, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, username, email`,
          [
            demoUsername,
            `${demoUsername.toLowerCase().replace(/\s+/g, '.')}@demo.local`,
            'demo_user_no_password', // Placeholder hash
            demoAddress,
            'user',
            true,
            true, // Auto-verify email for demo
          ]
        );
        userId = newUser.rows[0].id;
        username = newUser.rows[0].username;
        email = newUser.rows[0].email;
        logger.info(`Demo user created in database: ${username} (${userId})`);
      }

      // Generate JWT tokens for demo user
      const { generateAuthTokens } = await import('../utils/jwt.js');
      const tokens = generateAuthTokens({
        userId,
        email: `${username}@demo.local`,
        username,
        role: 'user',
        walletAddress: demoAddress,
      });

      logger.info(`Demo user authenticated: ${username} (${demoAddress})`);

      return reply.status(200).send({
        success: true,
        user: {
          id: userId,
          address: demoAddress,
          username,
          email,
          role: 'user',
          isDemo: true,
        },
        ...tokens,
      });
    } catch (error) {
      const apiError = handleError(
        500,
        'Demo Auth Error',
        'Failed to create demo token',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return reply.status(500).send(apiError);
    }
  });
}
