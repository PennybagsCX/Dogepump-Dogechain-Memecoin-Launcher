/**
 * Reports API Service
 *
 * Handles all API calls for reporting system
 */

import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Report {
  id: string;
  type: 'comment' | 'token' | 'user';
  reporter_id: string;
  reporter_username?: string;
  reported_user_id?: string;
  reported_username?: string;
  comment_id?: string;
  token_id?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewer_username?: string;
  reviewed_at?: string;
  resolution?: string;
  action_taken?: 'none' | 'resolved' | 'dismissed' | 'token_delisted' | 'user_banned' | 'warned';
  created_at: string;
}

/**
 * Make authenticated API call
 */
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();

  // Only set Content-Type for requests with a body
  const hasBody = options.method && ['POST', 'PUT', 'PATCH'].includes(options.method);

  const response = await fetch(`${API_BASE}/api/reports${endpoint}`, {
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
// CREATE REPORT
// ============================================================

/**
 * Create a new report
 */
export async function createReport(data: {
  type: 'comment' | 'token' | 'user';
  commentId?: string;
  tokenId?: string;
  reportedUserId?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description: string;
}): Promise<{ report: Report }> {
  console.log('[REPORTS API] Creating report with data:', data);
  const result = await apiCall('/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

// ============================================================
// GET REPORTS (ADMIN ONLY)
// ============================================================

/**
 * Get all reports (admin only)
 */
export async function getAllReports(filters?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ reports: Report[] }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const result = await apiCall(`?${params.toString()}`);
  return result;
}

/**
 * Get a single report by ID (admin only)
 */
export async function getReportById(id: string): Promise<{ report: Report }> {
  const result = await apiCall(`/${id}`);
  return result;
}

// ============================================================
// UPDATE REPORT (ADMIN ONLY)
// ============================================================

/**
 * Update report status and resolution (admin only)
 */
export async function updateReport(id: string, data: {
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
  actionTaken?: 'none' | 'resolved' | 'dismissed' | 'token_delisted' | 'user_banned' | 'warned';
}): Promise<{ report: Report }> {
  const result = await apiCall(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result;
}
