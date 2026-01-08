/**
 * PostgreSQL-based Authentication Service
 * 
 * Replaces in-memory UserDatabase with persistent PostgreSQL storage.
 * Provides all authentication, authorization, and user management functionality.
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import {
  User,
  UserProfile,
  Session,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserRole,
  Permission,
  RolePermissions,
} from '../types/index.js';
import {
  generateAuthTokens,
  generateAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '../utils/jwt.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/userUtils.js';
import { query, transaction } from '../database/db.js';
import { logger } from '../utils/logger.js';

/**
 * Role-based access control permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'image:upload',
    'image:read',
    'image:update',
    'user:read',
    'user:update',
  ],
  admin: [
    'image:upload',
    'image:delete',
    'image:read',
    'image:update',
    'user:read',
    'user:update',
    'user:delete',
    'admin:all',
  ],
};

/**
 * PostgreSQL-based Auth Service
 */
export class AuthService {
  /**
   * Registers a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Validate email
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate username
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.errors.join(', '));
    }
    
    // Validate password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [data.email.toLowerCase(), data.username]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.AUTH.BCRYPT_ROUNDS);
    
    // Create user
    const result = await query(
      `INSERT INTO users (email, username, password_hash, role, is_active, email_verified, wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, username, role, is_active, email_verified, avatar_url, wallet_address, created_at, updated_at`,
      [
        data.email.toLowerCase(),
        data.username,
        hashedPassword,
        'user',
        true,
        false,
        data.walletAddress || null
      ]
    );
    
    const user = result.rows[0];
    
    // Generate tokens
    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    
    // Create session
    await this.createSession(user.id, tokens.refreshToken, data.userAgent, data.ipAddress);
    
    // Log audit event
    await this.logAuditEvent(user.id, 'USER_REGISTERED', 'user', user.id, data.ipAddress);
    
    logger.info(`User registered: ${user.id} (${user.email})`);
    
    return {
      success: true,
      user: this.toUserProfile(user),
      tokens,
    };
  }

  /**
   * Logs in a user
   */
  async login(data: LoginRequest, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // Validate email
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [data.email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate tokens
    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    
    // Create session
    await this.createSession(user.id, tokens.refreshToken, userAgent, ipAddress);
    
    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Log audit event
    await this.logAuditEvent(user.id, 'USER_LOGIN', 'user', user.id, ipAddress);
    
    logger.info(`User logged in: ${user.id} (${user.email})`);
    
    return {
      success: true,
      user: this.toUserProfile(user),
      tokens,
    };
  }

  /**
   * Refreshes an access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    // Check if token is blacklisted
    if (isTokenBlacklisted(refreshToken)) {
      throw new Error('Token has been revoked');
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
    
    // Find session
    const sessionResult = await query(
      `SELECT s.*, u.is_active, u.role 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
      [refreshToken]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found or expired');
    }
    
    const session = sessionResult.rows[0];
    
    // Check if user is active
    if (!session.is_active) {
      throw new Error('User not found or inactive');
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: session.user_id,
      email: decoded.email,
      username: decoded.username,
      role: session.role,
    });
    
    const expiresIn = parseTimeToSeconds(config.JWT_ACCESS_TOKEN_EXPIRY);
    
    // Update session last used
    await query(
      'UPDATE sessions SET last_used_at = NOW() WHERE id = $1',
      [session.id]
    );
    
    return { accessToken, expiresIn };
  }

  /**
   * Logs out a user
   */
  async logout(refreshToken: string): Promise<void> {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
    
    // Find and delete session
    const result = await query(
      'DELETE FROM sessions WHERE refresh_token = $1 RETURNING user_id',
      [refreshToken]
    );
    
    if (result.rows.length > 0) {
      // Log audit event
      await this.logAuditEvent(result.rows[0].user_id, 'USER_LOGOUT', 'user', result.rows[0].user_id, null);
    }
    
    // Blacklist token
    blacklistToken(refreshToken);
    
    logger.info(`User logged out: ${decoded.userId}`);
  }

  /**
   * Logs out a user from all devices
   */
  async logoutAll(userId: string): Promise<number> {
    const result = await query(
      `SELECT refresh_token FROM sessions WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );
    
    const refreshTokens = result.rows.map((row: any) => row.refresh_token);
    
    // Delete all sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    
    // Blacklist all tokens
    for (const token of refreshTokens) {
      blacklistToken(token);
    }
    
    // Log audit event
    await this.logAuditEvent(userId, 'USER_LOGOUT_ALL', 'user', userId, null);
    
    logger.info(`User logged out from all devices: ${userId} (${refreshTokens.length} sessions)`);
    return refreshTokens.length;
  }

  /**
   * Changes a user's password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    // Find user
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(data.newPassword, user.password_hash);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, config.AUTH.BCRYPT_ROUNDS);
    
    // Update user password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    
    // Logout from all sessions (force re-login)
    await this.logoutAll(userId);
    
    // Log audit event
    await this.logAuditEvent(userId, 'PASSWORD_CHANGED', 'user', userId, null);
    
    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Updates a user's profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Validate username if provided
    if (data.username) {
      const usernameValidation = validateUsername(data.username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.errors.join(', '));
      }
      
      // Check if username is taken
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [data.username, userId]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Username already taken');
      }
      
      updates.push(`username = $${paramIndex}`);
      values.push(data.username);
      paramIndex++;
    }
    
    // Update wallet address if provided
    if (data.walletAddress !== undefined) {
      updates.push(`wallet_address = $${paramIndex}`);
      values.push(data.walletAddress);
      paramIndex++;
    }
    
    // Update avatar URL if provided
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramIndex}`);
      values.push(data.avatarUrl);
      paramIndex++;
    }
    
    // Update bio if provided
    if (data.bio !== undefined) {
      updates.push(`bio = $${paramIndex}`);
      values.push(data.bio);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(userId);
    
    // Update user
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Log audit event
    await this.logAuditEvent(userId, 'PROFILE_UPDATED', 'user', userId, null);
    
    logger.info(`Profile updated for user: ${userId}`);
    return this.toUserProfile(result.rows[0]);
  }

  /**
   * Gets a user's profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return this.toUserProfile(result.rows[0]);
  }

  /**
   * Verifies an access token and returns user
   */
  async verifyAccessToken(token: string): Promise<UserProfile> {
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new Error('Token has been revoked');
    }
    
    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
    
    // Find user
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }
    
    return this.toUserProfile(result.rows[0]);
  }

  /**
   * Checks if a user has a specific permission
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission) || permissions.includes('admin:all');
  }

  /**
   * Checks if a user has any of specified permissions
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Checks if a user is an admin
   */
  isAdmin(userRole: UserRole): boolean {
    return userRole === 'admin';
  }

  /**
   * Gets permissions for a role
   */
  getRolePermissions(role: UserRole): RolePermissions {
    return {
      role,
      permissions: ROLE_PERMISSIONS[role] || [],
    };
  }

  /**
   * Converts a User to UserProfile (excludes password)
   */
  private toUserProfile(user: any): UserProfile {
    const { password_hash, ...profile } = user;
    return profile;
  }

  /**
   * Creates a new session
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    // Check max sessions per user
    const sessionCount = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
      [userId]
    );
    
    const count = parseInt(sessionCount.rows[0].count);
    
    if (count >= config.AUTH.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      await query(
        `DELETE FROM sessions WHERE id = (
          SELECT id FROM sessions 
          WHERE user_id = $1 AND expires_at > NOW() 
          ORDER BY created_at ASC 
          LIMIT 1
        )`,
        [userId]
      );
    }
    
    const expiresAt = new Date(Date.now() + parseTimeToMs(config.JWT_REFRESH_TOKEN_EXPIRY));
    
    await query(
      `INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at, created_at, last_used_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, refreshToken, userAgent || null, ipAddress || null, expiresAt]
    );
  }

  /**
   * Admin: Gets all users
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const result = await query(
      'SELECT id, email, username, role, is_active, email_verified, avatar_url, wallet_address, created_at, updated_at, last_login FROM users ORDER BY created_at DESC',
      []
    );
    
    return result.rows.map((user: any) => this.toUserProfile(user));
  }

  /**
   * Admin: Updates a user's role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [role, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Log audit event
    await this.logAuditEvent(userId, 'USER_ROLE_CHANGED', 'user', userId, null);
    
    logger.info(`User role updated: ${userId} -> ${role}`);
    return this.toUserProfile(result.rows[0]);
  }

  /**
   * Admin: Deactivates a user
   */
  async deactivateUser(userId: string): Promise<void> {
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('User not found');
    }
    
    // Logout from all sessions
    await this.logoutAll(userId);
    
    // Log audit event
    await this.logAuditEvent(userId, 'USER_DEACTIVATED', 'user', userId, null);
    
    logger.info(`User deactivated: ${userId}`);
  }

  /**
   * Admin: Activates a user
   */
  async activateUser(userId: string): Promise<void> {
    const result = await query(
      `UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('User not found');
    }
    
    // Log audit event
    await this.logAuditEvent(userId, 'USER_ACTIVATED', 'user', userId, null);
    
    logger.info(`User activated: ${userId}`);
  }

  /**
   * Admin: Deletes a user
   */
  async deleteUser(userId: string): Promise<void> {
    await transaction(async (client) => {
      // Delete user (cascade will handle related records)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });
    
    // Log audit event
    await this.logAuditEvent(userId, 'USER_DELETED', 'user', userId, null);
    
    logger.info(`User deleted by admin: ${userId}`);
  }

  /**
   * Cleans up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    // First count the sessions to be deleted
    const countResult = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE expires_at < NOW()',
      []
    );

    const count = parseInt(countResult.rows[0].count);

    // Then perform the deletion
    if (count > 0) {
      await query('DELETE FROM sessions WHERE expires_at < NOW()', []);
      logger.info(`Cleaned up ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Gets user count
   */
  async getUserCount(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users', []);
    return parseInt(result.rows[0].count);
  }

  /**
   * Logs an audit event
   */
  private async logAuditEvent(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    ipAddress: string | null
  ): Promise<void> {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, action, resourceType, resourceId, ipAddress]
    );
  }
}

/**
 * Parses time string to milliseconds
 */
function parseTimeToMs(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  
  return value * (multipliers[unit] || 7 * 24 * 60 * 60 * 1000);
}

/**
 * Parses time string to seconds
 */
function parseTimeToSeconds(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default 15 minutes
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  
  return value * (multipliers[unit] || 60);
}

// Export singleton instance
export const authService = new AuthService();

// Start session cleanup interval
setInterval(() => {
  authService.cleanupExpiredSessions();
}, config.AUTH.SESSION_CLEANUP_INTERVAL);
