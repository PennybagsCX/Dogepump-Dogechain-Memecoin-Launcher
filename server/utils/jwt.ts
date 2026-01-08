import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { JWTPayload, AuthTokens } from '../types/index.js';

/**
 * Generates an access token for authentication
 * @param payload - JWT payload without iat and exp
 * @returns Access token string
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_TOKEN_EXPIRY as any,
  });
}

/**
 * Generates a refresh token for token renewal
 * @param userId - User ID
 * @returns Refresh token string
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_TOKEN_EXPIRY as any }
  );
}

/**
 * Generates both access and refresh tokens
 * @param payload - JWT payload for access token
 * @returns Object containing access token, refresh token, and expiry time
 */
export function generateAuthTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  
  // Calculate expiry time in seconds
  const expiresIn = parseTimeToSeconds(config.JWT_ACCESS_TOKEN_EXPIRY);
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verifies an access token
 * @param token - Access token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
}

/**
 * Verifies a refresh token
 * @param token - Refresh token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): { userId: string; type: string } {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string; type: string };
}

/**
 * Decodes a token without verification (useful for getting token info)
 * @param token - Token to decode
 * @returns Decoded JWT payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a token is expired
 * @param token - Token to check
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Gets the time remaining until token expiry (in seconds)
 * @param token - Token to check
 * @returns Time remaining in seconds, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      return 0;
    }
    const remaining = decoded.exp * 1000 - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  } catch (error) {
    return 0;
  }
}

/**
 * Parses a time string to seconds
 * @param timeString - Time string (e.g., '15m', '7d', '1h')
 * @returns Time in seconds
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

/**
 * Blacklist management for logout functionality
 * In-memory storage - consider using Redis for production
 */
const tokenBlacklist = new Set<string>();

/**
 * Adds a token to the blacklist
 * @param token - Token to blacklist
 * @param expiryTime - Time when token expires (optional)
 */
export function blacklistToken(token: string, expiryTime?: number): void {
  tokenBlacklist.add(token);
  
  // Auto-remove from blacklist when token expires
  if (expiryTime) {
    const ttl = expiryTime - Date.now();
    if (ttl > 0) {
      setTimeout(() => {
        tokenBlacklist.delete(token);
      }, ttl);
    }
  }
}

/**
 * Checks if a token is blacklisted
 * @param token - Token to check
 * @returns True if blacklisted, false otherwise
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Removes a token from the blacklist
 * @param token - Token to remove
 */
export function removeFromBlacklist(token: string): void {
  tokenBlacklist.delete(token);
}

/**
 * Clears all blacklisted tokens (useful for testing or cleanup)
 */
export function clearTokenBlacklist(): void {
  tokenBlacklist.clear();
}
