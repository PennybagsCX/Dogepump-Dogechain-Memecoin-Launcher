import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../authServicePostgres.js';
import { query } from '../../database/db.js';
import bcrypt from 'bcrypt';

// Mock the database query function
vi.mock('../../database/db.js', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: 'user-123',
        email: registerData.email,
        username: registerData.username,
        role: 'user',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        avatar_url: null,
        wallet_address: null,
      };

      // Mock database calls in sequence:
      // 1. Check if user exists - return empty
      // 2. Insert user - return created user
      // 3. Check session count - return 0 sessions
      // 4. Create session - return success
      // 5. Log audit event - return success
      (query as any)
        .mockResolvedValueOnce({ rows: [] })  // No existing user
        .mockResolvedValueOnce({ rows: [mockUser] })  // User created
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })  // Session count check
        .mockResolvedValueOnce({ rows: [] })  // Session created
        .mockResolvedValueOnce({ rows: [] });  // Audit logged

      const result = await authService.register(registerData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.username).toBe(registerData.username);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(query).toHaveBeenCalledTimes(5);
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
      };

      (query as any).mockRejectedValueOnce(
        new Error('Email already exists')
      );

      await expect(authService.register(registerData)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should validate password strength', async () => {
      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak', // Too short
      };

      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        username: 'testuser',
        password_hash: hashedPassword,
        role: 'user',
        is_active: true,
        email_verified: true,
        avatar_url: null,
        wallet_address: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database calls in sequence:
      // 1. Find user - return user
      // 2. Check session count - return 0 sessions
      // 3. Create session - return success
      // 4. Update last login - return success
      (query as any)
        .mockResolvedValueOnce({ rows: [mockUser] })  // Find user
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })  // Session count
        .mockResolvedValueOnce({ rows: [] })  // Create session
        .mockResolvedValueOnce({ rows: [] });  // Update last login

      const result = await authService.login(
        loginData,
        'Mozilla/5.0',
        '127.0.0.1'
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        password_hash: hashedPassword,
        is_active: true,
      };

      (query as any).mockResolvedValueOnce({
        rows: [mockUser],
      });

      await expect(
        authService.login(loginData, 'Mozilla/5.0', '127.0.0.1')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const loginData = {
        email: 'inactive@example.com',
        password: 'SecurePass123!',
      };

      // Inactive users won't be found because query filters for is_active = true
      // So return empty rows to simulate user not found
      (query as any).mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        authService.login(loginData, 'Mozilla/5.0', '127.0.0.1')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid user ID', async () => {
      const userId = 'user-123';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        karma: 100,
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
      };

      (query as any).mockResolvedValueOnce({
        rows: [mockUser],
      });

      const profile = await authService.getProfile(userId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(userId);
      expect(profile.email).toBe(mockUser.email);
      expect(profile.username).toBe(mockUser.username);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'non-existent-user';

      (query as any).mockResolvedValueOnce({
        rows: [],
      });

      await expect(authService.getProfile(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getRolePermissions', () => {
    it('should return admin permissions for admin role', () => {
      const permissions = authService.getRolePermissions('admin');

      expect(permissions.role).toBe('admin');
      expect(permissions.permissions).toContain('user:read');
      expect(permissions.permissions).toContain('user:update');  // Changed from user:write
      expect(permissions.permissions).toContain('user:delete');
      expect(permissions.permissions).toContain('image:upload');
      expect(permissions.permissions).toContain('image:delete');
    });

    it('should return user permissions for user role', () => {
      const permissions = authService.getRolePermissions('user');

      expect(permissions.role).toBe('user');
      expect(permissions.permissions).toContain('image:upload');
      expect(permissions.permissions).not.toContain('user:delete');
      expect(permissions.permissions).not.toContain('image:delete');
    });
  });
});
