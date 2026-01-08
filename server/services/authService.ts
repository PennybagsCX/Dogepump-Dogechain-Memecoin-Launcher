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
  generateAccessToken,
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '../utils/jwt.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/userUtils.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory user database
 * In production, this should be replaced with a proper database (PostgreSQL, MongoDB, etc.)
 */
class UserDatabase {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private usersByUsername: Map<string, string> = new Map();
  private sessions: Map<string, Session> = new Map();
  private sessionsByUser: Map<string, Set<string>> = new Map();

  /**
   * Creates a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(id, user);
    this.usersByEmail.set(userData.email.toLowerCase(), id);
    this.usersByUsername.set(userData.username.toLowerCase(), id);
    
    logger.info(`User created: ${id} (${userData.email})`);
    return user;
  }

  /**
   * Finds a user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * Finds a user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  /**
   * Finds a user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    const userId = this.usersByUsername.get(username.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  /**
   * Updates a user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id, // Ensure ID is not changed
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    
    // Update indexes if email or username changed
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email.toLowerCase());
      this.usersByEmail.set(updates.email.toLowerCase(), id);
    }
    
    if (updates.username && updates.username !== user.username) {
      this.usersByUsername.delete(user.username.toLowerCase());
      this.usersByUsername.set(updates.username.toLowerCase(), id);
    }
    
    logger.info(`User updated: ${id}`);
    return updatedUser;
  }

  /**
   * Deletes a user
   */
  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    this.users.delete(id);
    this.usersByEmail.delete(user.email.toLowerCase());
    this.usersByUsername.delete(user.username.toLowerCase());
    
    // Delete all sessions for this user
    const sessionIds = this.sessionsByUser.get(id);
    if (sessionIds) {
      sessionIds.forEach(sessionId => this.sessions.delete(sessionId));
      this.sessionsByUser.delete(id);
    }
    
    logger.info(`User deleted: ${id}`);
    return true;
  }

  /**
   * Creates a new session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    // Check max sessions per user
    const userSessions = this.sessionsByUser.get(userId) || new Set();
    if (userSessions.size >= config.AUTH.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSessionId = Array.from(userSessions)[0];
      const oldestSession = this.sessions.get(oldestSessionId);
      if (oldestSession) {
        this.sessions.delete(oldestSessionId);
        userSessions.delete(oldestSessionId);
        blacklistToken(oldestSession.refreshToken);
      }
    }
    
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + parseTimeToMs(config.JWT_REFRESH_TOKEN_EXPIRY));
    
    const session: Session = {
      id,
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
      createdAt: now,
      lastUsedAt: now,
    };
    
    this.sessions.set(id, session);
    userSessions.add(id);
    this.sessionsByUser.set(userId, userSessions);
    
    logger.info(`Session created: ${id} for user ${userId}`);
    return session;
  }

  /**
   * Finds a session by refresh token
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshToken === refreshToken) {
        return session;
      }
    }
    return null;
  }

  /**
   * Updates session's last used timestamp
   */
  async updateSessionLastUsed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsedAt = new Date();
    }
  }

  /**
   * Deletes a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    this.sessions.delete(sessionId);
    const userSessions = this.sessionsByUser.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.sessionsByUser.delete(session.userId);
      }
    }
    
    logger.info(`Session deleted: ${sessionId}`);
    return true;
  }

  /**
   * Deletes all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    const sessionIds = this.sessionsByUser.get(userId);
    if (!sessionIds) return 0;
    
    let count = 0;
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session) {
        blacklistToken(session.refreshToken);
        this.sessions.delete(sessionId);
        count++;
      }
    }
    
    this.sessionsByUser.delete(userId);
    logger.info(`Deleted ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Cleans up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        const userSessions = this.sessionsByUser.get(session.userId);
        if (userSessions) {
          userSessions.delete(sessionId);
          if (userSessions.size === 0) {
            this.sessionsByUser.delete(session.userId);
          }
        }
        count++;
      }
    }
    
    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }
    return count;
  }

  /**
   * Gets all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  /**
   * Gets user count
   */
  async getUserCount(): Promise<number> {
    return this.users.size;
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
 * Auth service singleton
 */
const userDatabase = new UserDatabase();

/**
 * Authentication and authorization service
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
    const existingUser = await userDatabase.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const existingUsername = await userDatabase.findUserByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.AUTH.BCRYPT_ROUNDS);
    
    // Create user
    const user = await userDatabase.createUser({
      email: data.email.toLowerCase(),
      username: data.username,
      password: hashedPassword,
      walletAddress: data.walletAddress,
      role: 'user',
      isActive: true,
      emailVerified: false,
    });
    
    // Generate tokens
    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    
    // Create session
    await userDatabase.createSession(user.id, tokens.refreshToken);
    
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
    const user = await userDatabase.findUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
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
    await userDatabase.createSession(user.id, tokens.refreshToken, userAgent, ipAddress);
    
    // Update last login
    await userDatabase.updateUser(user.id, { lastLogin: new Date() });
    
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
    const session = await userDatabase.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await userDatabase.deleteSession(session.id);
      throw new Error('Session expired');
    }
    
    // Find user
    const user = await userDatabase.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    
    const expiresIn = parseTimeToSeconds(config.JWT_ACCESS_TOKEN_EXPIRY);
    
    // Update session last used
    await userDatabase.updateSessionLastUsed(session.id);
    
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
    const session = await userDatabase.findSessionByRefreshToken(refreshToken);
    if (session) {
      await userDatabase.deleteSession(session.id);
    }
    
    // Blacklist the token
    blacklistToken(refreshToken);
    
    logger.info(`User logged out: ${decoded.userId}`);
  }

  /**
   * Logs out a user from all devices
   */
  async logoutAll(userId: string): Promise<number> {
    const count = await userDatabase.deleteAllUserSessions(userId);
    logger.info(`User logged out from all devices: ${userId} (${count} sessions)`);
    return count;
  }

  /**
   * Changes a user's password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    // Find user
    const user = await userDatabase.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(data.newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, config.AUTH.BCRYPT_ROUNDS);
    
    // Update user password
    await userDatabase.updateUser(userId, { password: hashedPassword });
    
    // Logout from all sessions (force re-login)
    await userDatabase.deleteAllUserSessions(userId);
    
    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Updates a user's profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const updates: Partial<User> = {};
    
    // Validate username if provided
    if (data.username) {
      const usernameValidation = validateUsername(data.username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.errors.join(', '));
      }
      
      // Check if username is taken
      const existingUser = await userDatabase.findUserByUsername(data.username);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already taken');
      }
      
      updates.username = data.username;
    }
    
    // Update wallet address if provided
    if (data.walletAddress !== undefined) {
      updates.walletAddress = data.walletAddress;
    }
    
    // Update user
    const user = await userDatabase.updateUser(userId, updates);
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`Profile updated for user: ${userId}`);
    return this.toUserProfile(user);
  }

  /**
   * Gets a user's profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userDatabase.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return this.toUserProfile(user);
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
    const user = await userDatabase.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    return this.toUserProfile(user);
  }

  /**
   * Checks if a user has a specific permission
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission) || permissions.includes('admin:all');
  }

  /**
   * Checks if a user has any of the specified permissions
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
  private toUserProfile(user: User): UserProfile {
    const { password, ...profile } = user;
    return profile;
  }

  /**
   * Admin: Gets all users
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const users = await userDatabase.getAllUsers();
    return users.map(user => this.toUserProfile(user));
  }

  /**
   * Admin: Updates a user's role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    const user = await userDatabase.updateUser(userId, { role });
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`User role updated: ${userId} -> ${role}`);
    return this.toUserProfile(user);
  }

  /**
   * Admin: Deactivates a user
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await userDatabase.updateUser(userId, { isActive: false });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Logout from all sessions
    await userDatabase.deleteAllUserSessions(userId);
    
    logger.info(`User deactivated: ${userId}`);
  }

  /**
   * Admin: Activates a user
   */
  async activateUser(userId: string): Promise<void> {
    const user = await userDatabase.updateUser(userId, { isActive: true });
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`User activated: ${userId}`);
  }

  /**
   * Admin: Deletes a user
   */
  async deleteUser(userId: string): Promise<void> {
    const success = await userDatabase.deleteUser(userId);
    if (!success) {
      throw new Error('User not found');
    }
    
    logger.info(`User deleted by admin: ${userId}`);
  }

  /**
   * Cleans up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    return userDatabase.cleanupExpiredSessions();
  }

  /**
   * Gets user count
   */
  async getUserCount(): Promise<number> {
    return userDatabase.getUserCount();
  }
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
