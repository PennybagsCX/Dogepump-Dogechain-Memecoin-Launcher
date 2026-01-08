/**
 * Moderation API Service
 *
 * Handles all API calls for moderation system
 */

import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WarnedUser {
  id: string;
  user_id: string;
  wallet_address: string;
  username: string | null;
  token_id: string | null;
  warned_by: string;
  warning_reason: string;
  admin_notes: string | null;
  is_active: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  expires_at: string | null;
  cleared_at: string | null;
  cleared_by: string | null;
  created_at: string;
  updated_at: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  wallet_address: string;
  username: string | null;
  banned_by: string;
  ban_reason: string;
  admin_notes: string | null;
  is_automatic: boolean;
  is_active: boolean;
  banned_at: string;
  unbanned_at: string | null;
  unbanned_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_wallet_address: string | null;
  reason: string;
  notes: string | null;
  metadata: any;
  created_at: string;
}

/**
 * Make authenticated API call
 */
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();

  // Only set Content-Type for requests with a body
  const hasBody = options.method && ['POST', 'PUT', 'PATCH'].includes(options.method);

  const response = await fetch(`${API_BASE}/api/moderation${endpoint}`, {
    ...options,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
}

// ============================================================
// WARNINGS
// ============================================================

/**
 * Get all warnings (admin only)
 */
export async function getAllWarnings(): Promise<WarnedUser[]> {
  const result = await apiCall('/warnings');
  return result.warnings;
}

/**
 * Get warnings for a specific user
 */
export async function getUserWarnings(walletAddress: string): Promise<WarnedUser[]> {
  const result = await apiCall(`/warnings/user/${walletAddress}`);
  return result.warnings;
}

/**
 * Issue a new warning (admin only)
 */
export async function createWarning(data: {
  targetAddress: string;
  reason: string;
  notes?: string;
  tokenId?: string;
}): Promise<{ warning: WarnedUser; warningCount: number; penaltyApplied?: boolean }> {
  const result = await apiCall('/warnings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Acknowledge a warning
 */
export async function acknowledgeWarning(warningId: string): Promise<WarnedUser> {
  const result = await apiCall(`/warnings/${warningId}/acknowledge`, {
    method: 'PUT',
  });
  return result.warning;
}

/**
 * Clear a warning (admin only)
 */
export async function clearWarning(warningId: string): Promise<WarnedUser> {
  const result = await apiCall(`/warnings/${warningId}`, {
    method: 'DELETE',
  });
  return result.warning;
}

// ============================================================
// BANS
// ============================================================

/**
 * Get all bans (admin only)
 */
export async function getAllBans(): Promise<BannedUser[]> {
  const result = await apiCall('/bans');
  return result.bans;
}

/**
 * Ban a user (admin only)
 */
export async function banUser(data: {
  targetAddress: string;
  reason: string;
  notes?: string;
}): Promise<BannedUser> {
  const result = await apiCall('/bans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.ban;
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(walletAddress: string): Promise<BannedUser> {
  const result = await apiCall(`/bans/${walletAddress}`, {
    method: 'DELETE',
  });
  return result.ban;
}

// ============================================================
// TOKENS
// ============================================================

/**
 * Delist a token (admin only)
 */
export async function delistToken(tokenId: string, data: {
  reason: string;
  notes?: string;
}): Promise<{ message: string }> {
  const result = await apiCall(`/tokens/${tokenId}/delist`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Relist a token (admin only)
 */
export async function relistToken(tokenId: string): Promise<{ message: string }> {
  const result = await apiCall(`/tokens/${tokenId}/relist`, {
    method: 'POST',
  });
  return result;
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

/**
 * Get admin actions log (admin only)
 */
export async function getAdminActions(limit: number = 100, offset: number = 0): Promise<AdminAction[]> {
  const result = await apiCall(`/actions?limit=${limit}&offset=${offset}`);
  return result.actions;
}

// ============================================================
// DATABASE RESET (Development/Testing)
// ============================================================

/**
 * Reset all moderation data (admin only, for testing)
 */
export async function resetModerationData(): Promise<{ message: string }> {
  const result = await apiCall('/reset', {
    method: 'DELETE',
  });
  return result;
}
