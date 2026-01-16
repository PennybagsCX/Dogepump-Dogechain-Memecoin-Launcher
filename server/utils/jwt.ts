import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { JWTPayload, AuthTokens } from '../types/index.js';
import { tokenStore } from '../services/tokenStore.js';

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
 * Generates an access token with IP binding
 * @param payload - JWT payload without iat, exp, and ipAddress
 * @param ipAddress - Client IP address for binding
 * @returns Access token string
 */
export function generateAccessTokenWithIP(
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'ipAddress'>,
  ipAddress: string
): string {
  const payloadWithIP = { ...payload, ipAddress };
  return jwt.sign(payloadWithIP, config.JWT_SECRET, {
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
 * @param ipAddress - Optional client IP address for token binding
 * @param userAgent - Optional client user agent
 * @returns Object containing access token, refresh token, and expiry time
 */
export async function generateAuthTokens(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthTokens> {
  // Include IP address in token payload if provided
  const tokenPayload = ipAddress ? { ...payload, ipAddress } : payload;

  const accessToken = ipAddress
    ? generateAccessTokenWithIP(payload, ipAddress)
    : generateAccessToken(tokenPayload);

  const refreshToken = generateRefreshToken(payload.userId);

  // Calculate expiry time in seconds
  const expiresIn = parseTimeToSeconds(config.JWT_ACCESS_TOKEN_EXPIRY);
  const now = Date.now();
  const accessExpiry = now + (expiresIn * 1000);
  const refreshExpiry = now + (parseTimeToSeconds(config.JWT_REFRESH_TOKEN_EXPIRY) * 1000);

  // Store token metadata in persistent store
  await tokenStore.setToken(accessToken, {
    userId: payload.userId,
    ipAddress,
    userAgent,
    expiry: accessExpiry,
    type: 'access',
  });

  await tokenStore.setToken(refreshToken, {
    userId: payload.userId,
    ipAddress,
    userAgent,
    expiry: refreshExpiry,
    type: 'refresh',
  });

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
 * Adds a token to the blacklist
 * @param token - Token to blacklist
 * @param expiryTime - Time when token expires (optional)
 */
export async function blacklistToken(token: string, expiryTime?: number): Promise<void> {
  const expiry = expiryTime || (Date.now() + (15 * 60 * 1000)); // Default 15 min
  await tokenStore.blacklistToken(token, expiry);
}

/**
 * Checks if a token is blacklisted
 * @param token - Token to check
 * @returns True if blacklisted, false otherwise
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  return await tokenStore.isTokenBlacklisted(token);
}

/**
 * Removes a token from the blacklist
 * @param token - Token to remove
 */
export async function removeFromBlacklist(token: string): Promise<void> {
  await tokenStore.removeToken(token);
}

/**
 * Clears all blacklisted tokens (useful for testing or cleanup)
 */
export async function clearTokenBlacklist(): Promise<void> {
  // This would require iterating over all tokens which is expensive
  // Alternative: clear user-specific blacklists or use pattern deletion
  logger.warn('clearTokenBlacklist: Clearing all blacklisted tokens is not supported');
  throw new Error('Clearing all blacklisted tokens is not supported. Use user-specific logout instead.');
}

/**
 * Blacklist all tokens for a specific user (full logout from all devices)
 * @param userId - User ID to blacklist tokens for
 */
export async function blacklistAllUserTokens(userId: string): Promise<void> {
  await tokenStore.blacklistAllUserTokens(userId);
}

/**
 * Check if user's tokens are blacklisted
 * @param userId - User ID to check
 * @returns True if user is blacklisted, false otherwise
 */
export async function isUserBlacklisted(userId: string): Promise<boolean> {
  return await tokenStore.isUserBlacklisted(userId);
}

/**
 * Verify token's IP address matches current request IP
 * @param token - JWT access token
 * @param currentIp - Current request IP address
 * @returns True if IP matches or token has no IP binding, false otherwise
 */
export async function verifyTokenIP(token: string, currentIp: string): Promise<boolean> {
  try {
    const decoded = verifyAccessToken(token);

    // If token has IP binding, verify it matches
    if (decoded.ipAddress) {
      const matches = decoded.ipAddress === currentIp;

      if (!matches) {
        logger.warn(
          {
            userId: decoded.userId,
            tokenIp: decoded.ipAddress,
            currentIp,
          },
          'Token IP address mismatch'
        );
      }

      return matches;
    }

    // No IP binding, allow token
    return true;
  } catch (error) {
    logger.error({ error }, 'Error verifying token IP');
    return false;
  }
}

/**
 * Extract IP address from request with proxy support
 * @param request - Fastify request object
 * @returns Client IP address
 */
export function extractClientIP(request: { ip?: string; headers?: Record<string, unknown> }): string {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwardedFor = request.headers['x-forwarded-for'] as string;
  const realIP = request.headers['x-real-ip'] as string;
  const cfConnectingIP = request.headers['cf-connecting-ip'] as string; // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is client IP
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to request IP
  return request.ip || 'unknown';
}

/**
 * Validate IP address format
 * @param ip - IP address string
 * @returns True if valid IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Regex.test(ip)) {
    // Verify each octet is 0-255
    const octets = ip.split('.');
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  if (ipv6Regex.test(ip)) {
    return true;
  }

  return false;
}
