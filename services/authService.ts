/**
 * Authentication Service
 *
 * Handles authentication, token management, and demo mode
 * Uses in-memory storage only - tokens are lost on refresh
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// In-memory token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

export interface DemoUser {
  id: string;
  address: string;
  username: string;
  email: string;
  role: string;
  isDemo: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DemoAuthResponse {
  success: boolean;
  user: DemoUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Get demo JWT tokens for development
 */
export async function getDemoTokens(address?: string, username?: string): Promise<DemoAuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/demo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get demo tokens');
  }

  return response.json();
}

/**
 * Get stored access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Get stored refresh token from memory
 */
export function getRefreshToken(): string | null {
  return refreshToken;
}

/**
 * Store auth tokens in memory
 */
export function storeTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

/**
 * Clear all auth tokens from memory
 */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

/**
 * Check if user is authenticated (has valid access token)
 */
export function isAuthenticated(): boolean {
  return !!accessToken;
}

/**
 * Get Authorization header for API requests
 */
export function getAuthHeader(): { Authorization?: string } {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/**
 * Initialize demo authentication
 * Creates demo user tokens if not already authenticated
 */
export async function initializeDemoAuth(): Promise<boolean> {
  // Skip if already authenticated
  if (isAuthenticated()) {
    return true;
  }

  try {
    const tokens = await getDemoTokens();
    storeTokens(tokens);
    return true;
  } catch (error) {
    console.error('[AuthService] Failed to initialize demo auth:', error);
    return false;
  }
}
