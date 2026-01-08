/**
 * Backend API Service
 * 
 * Handles all communication with the backend API including:
 * - Authentication (login, register, logout, token refresh)
 * - Image upload, retrieval, and deletion
 * - Comment management
 * - JWT token management and auto-refresh
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_URL environment variable is required but not set.\n' +
    'Please add it to your .env file:\n' +
    'VITE_API_URL=http://localhost:3001\n' +
    'Then restart the development server.'
  );
}

// In-memory token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userProfile: UserProfile | null = null;

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  walletAddress?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  walletAddress?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  image: {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  };
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username: string;
  imageId?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentRequest {
  content: string;
  imageId?: string;
}

export interface APIError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

// ============================================================================
// Token Management (In-Memory Only)
// ============================================================================

/**
 * Get stored access token from memory
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

/**
 * Get stored refresh token from memory
 */
export const getRefreshToken = (): string | null => {
  return refreshToken;
};

/**
 * Get stored user profile from memory
 */
export const getUser = (): UserProfile | null => {
  return userProfile;
};

/**
 * Store access token in memory
 */
export const setAccessToken = (token: string): void => {
  accessToken = token;
};

/**
 * Store refresh token in memory
 */
export const setRefreshToken = (token: string): void => {
  refreshToken = token;
};

/**
 * Store user profile in memory
 */
export const setUser = (user: UserProfile): void => {
  userProfile = user;
};

/**
 * Clear all auth tokens and user data from memory
 */
export const clearAuth = (): void => {
  accessToken = null;
  refreshToken = null;
  userProfile = null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// ============================================================================
// HTTP Client
// ============================================================================

/**
 * Make an authenticated API request with automatic token refresh
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Make request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      try {
        // Attempt to refresh the token
        const newTokens = await refreshAccessToken(refreshToken);
        
        // Update stored tokens
        setAccessToken(newTokens.accessToken);
        setRefreshToken(newTokens.refreshToken);
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed - clear auth and reject
        clearAuth();
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // No refresh token available - clear auth
      clearAuth();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const errorData: APIError = await response.json().catch(() => ({
      statusCode: response.status,
      error: 'Request Failed',
      message: response.statusText || 'An error occurred',
    }));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

/**
 * Make an upload request with file data
 * Note: No authentication required for decentralized platform
 */
async function uploadRequest<T>(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else if (xhr.status === 401) {
        // Handle unauthorized - try refresh if we have a token
        const refreshToken = getRefreshToken();
        if (refreshToken && accessToken) {
          refreshAccessToken(refreshToken)
            .then(() => {
              // Retry upload with new token
              const newAccessToken = getAccessToken();
              if (newAccessToken) {
                const retryXhr = new XMLHttpRequest();
                retryXhr.open('POST', url);
                retryXhr.setRequestHeader('Authorization', `Bearer ${newAccessToken}`);
                
                const formData = new FormData();
                formData.append('file', file);
                
                retryXhr.onload = () => {
                  if (retryXhr.status >= 200 && retryXhr.status < 300) {
                    resolve(JSON.parse(retryXhr.responseText));
                  } else {
                    reject(new Error('Upload failed'));
                  }
                };
                
                retryXhr.onerror = () => reject(new Error('Upload failed'));
                retryXhr.send(formData);
              } else {
                clearAuth();
                reject(new Error('Session expired. Please login again.'));
              }
            })
            .catch(() => {
              clearAuth();
              reject(new Error('Session expired. Please login again.'));
            });
        } else {
          // No refresh token or no access token - this is fine for decentralized platform
          try {
            const errorData: APIError = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      } else {
        try {
          const errorData: APIError = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    // Open and send request
    xhr.open('POST', url);
    
    // Only add authorization header if we have a token
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.send(formData);
  });
}

// ============================================================================
// Authentication API
// ============================================================================

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store tokens and user data
  if (response.success) {
    setAccessToken(response.tokens.accessToken);
    setRefreshToken(response.tokens.refreshToken);
    setUser(response.user);
  }

  return response;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store tokens and user data
  if (response.success) {
    setAccessToken(response.tokens.accessToken);
    setRefreshToken(response.tokens.refreshToken);
    setUser(response.user);
  }

  return response;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Ignore logout errors - just clear local storage
      console.warn('Logout request failed:', error);
    }
  }

  // Clear local storage
  clearAuth();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await request<{ success: boolean; accessToken: string; refreshToken: string; expiresIn: number }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }
  );

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: response.expiresIn,
  };
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await request<{ success: boolean; user: UserProfile }>('/api/auth/me');

  // Update stored user data
  if (response.success) {
    setUser(response.user);
  }

  return response.user;
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const response = await request<{ success: boolean; user: UserProfile }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  // Update stored user data
  if (response.success) {
    setUser(response.user);
  }

  return response.user;
}

// ============================================================================
// Image API
// ============================================================================

/**
 * Upload an image
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  // DIAGNOSTIC LOGGING
  console.log('[backendService] uploadImage called');
  console.log('[backendService] API_BASE_URL:', API_BASE_URL);
  console.log('[backendService] Endpoint:', '/api/images/upload');
  console.log('[backendService] Full URL:', `${API_BASE_URL}/api/images/upload`);
  console.log('[backendService] File:', file.name, file.type, file.size);
  
  const response = await uploadRequest<ImageUploadResponse>('/api/images/upload', file, onProgress);
  
  // DIAGNOSTIC LOGGING
  console.log('[backendService] Upload response:', response);
  console.log('[backendService] Response success:', response.success);
  console.log('[backendService] Response image:', response.image);
  
  return response;
}

/**
 * Get image by ID
 */
export async function getImage(imageId: string): Promise<any> {
  return request(`/api/images/${imageId}`);
}

/**
 * Delete image
 */
export async function deleteImage(imageId: string): Promise<void> {
  await request(`/api/images/${imageId}`, {
    method: 'DELETE',
  });
}

/**
 * List user's images
 */
export async function listImages(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<any> {
  const params = new URLSearchParams();
  
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
  
  const queryString = params.toString();
  return request(`/api/images${queryString ? `?${queryString}` : ''}`);
}

// ============================================================================
// Comment API
// ============================================================================

/**
 * Create a comment
 */
export async function createComment(data: CreateCommentRequest): Promise<Comment> {
  return request<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get comments for a token
 */
export async function getComments(tokenId: string): Promise<Comment[]> {
  return request<Comment[]>(`/comments/token/${tokenId}`);
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  await request(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Blockchain API
// ============================================================================

/**
 * Blockchain balance verification response
 */
export interface BalanceVerificationResponse {
  sufficient: boolean;
  nativeBalance: string;
  dcBalance: string;
  requiredDC: string;
  dcBalanceFormatted: string;
  requiredDCFormatted: string;
}

/**
 * All balances response
 */
export interface AllBalancesResponse {
  address: string;
  native: {
    balance: string;
    formatted: string;
    decimals: number;
  };
  dc: {
    balance: string;
    formatted: string;
    decimals: number;
  };
}

/**
 * Verify if an address has sufficient DC balance for token launch
 */
export async function verifySufficientBalance(
  address: string,
  requiredDC: string | bigint
): Promise<BalanceVerificationResponse> {
  const requiredDCString = typeof requiredDC === 'string' ? requiredDC : requiredDC.toString();

  return request<BalanceVerificationResponse>('/blockchain/verify-balance', {
    method: 'POST',
    body: JSON.stringify({
      address,
      requiredDC: requiredDCString,
    }),
  });
}

/**
 * Get all balances for an address (native + DC)
 */
export async function getAllBalances(address: string): Promise<AllBalancesResponse> {
  return request<AllBalancesResponse>(`/blockchain/balance/all/${address}`);
}

/**
 * Get DC token balance for an address
 */
export async function getDCBalance(address: string): Promise<{
  address: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
}> {
  return request(`/blockchain/balance/dc/${address}`);
}

// ============================================================================
// Export service object
// ============================================================================

export const backendService = {
  // Auth
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,

  // Images
  uploadImage,
  getImage,
  deleteImage,
  listImages,

  // Comments
  createComment,
  getComments,
  deleteComment,

  // Blockchain
  verifySufficientBalance,
  getAllBalances,
  getDCBalance,

  // Token management
  getAccessToken,
  getRefreshToken,
  getUser,
  setAccessToken,
  setRefreshToken,
  setUser,
  clearAuth,
  isAuthenticated,
};

export default backendService;
