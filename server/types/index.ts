// User types
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  walletAddress?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  walletAddress?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  walletAddress?: string;
  iat?: number;
  exp?: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  walletAddress?: string;
  userAgent?: string;
  ipAddress?: string;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  walletAddress?: string;
  avatarUrl?: string;
  bio?: string;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

// Permission types
export type Permission =
  | 'image:upload'
  | 'image:delete'
  | 'image:read'
  | 'image:update'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'admin:all';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Image types
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

export interface ImageMetadata {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  userId: string;
  uploadedAt: Date;
}

export interface ImageVariant {
  name: string;
  width: number;
  height: number;
  format: ImageFormat;
  quality: number;
  url: string;
  size: number;
}

export interface ProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: string;
  stripMetadata?: boolean;
  progressive?: boolean;
  withoutEnlargement?: boolean;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface ImageProcessingResult {
  success: boolean;
  buffer: Buffer;
  metadata: ImageMetadataResult;
  error?: string;
}

export interface ImageMetadataResult {
  format: string;
  width: number;
  height: number;
  space: string;
  channels: number;
  depth: string;
  density: number;
  hasAlpha: boolean;
  hasProfile: boolean;
  orientation: number;
  size: number;
}

// Comment types
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
  tokenId: string;
  content: string;
  imageId?: string;
  tradeAction?: {
    type: 'buy' | 'sell';
    amount: number;
  };
}

// Error types
export interface APIError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

// Fastify request extensions
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    userId?: string;
  }
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// File upload types
export interface UploadedFile {
  data: Buffer;
  filename: string;
  originalFilename?: string;
  mimetype: string;
  encoding: string;
  fieldname: string;
  dimensions?: {
    width: number;
    height: number;
  };
  checksum?: string;
}

// Rate limit types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  reset: Date;
}

export interface RateLimitResponse {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

// Storage types
export type StorageBackend = 'local' | 's3' | 'minio';

export interface StorageConfig {
  backend: StorageBackend;
  basePath: string;
  maxStorageSize: number;
  tempFileTTL: number;
  enableDeduplication: boolean;
}

export interface StoredImage {
  id: string;
  userId: string;
  tokenId?: string;
  filename: string;
  originalPath: string;
  variants: ImageVariant[];
  metadata: ImageStorageMetadata;
  isTemporary: boolean;
  createdAt: Date;
  expiresAt?: Date;
  size: number;
  checksum: string;
}

export interface ImageStorageMetadata {
  width: number;
  height: number;
  format: ImageFormat;
  size: number;
  mimetype: string;
  checksum: string;
  uploadedAt: Date;
}

export interface StorageStats {
  totalImages: number;
  totalSize: number;
  totalVariants: number;
  tempImages: number;
  permanentImages: number;
  storageUsage: number;
  storageLimit: number;
  oldestFile?: Date;
  newestFile?: Date;
}

export interface StoreImageOptions {
  userId: string;
  tokenId?: string;
  filename: string;
  buffer: Buffer;
  mimetype: string;
  isTemporary?: boolean;
  ttl?: number;
  generateVariants?: boolean;
  deduplicate?: boolean;
}

export interface GetImageOptions {
  variant?: string;
  fallbackToOriginal?: boolean;
}

export interface ListImagesOptions {
  userId?: string;
  tokenId?: string;
  isTemporary?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'size' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface CleanupOptions {
  olderThan?: Date;
  temporaryOnly?: boolean;
  dryRun?: boolean;
  userId?: string;
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface StoragePathComponents {
  basePath: string;
  userId: string;
  tokenId?: string;
  variant?: string;
  filename: string;
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    detectedFormat?: string;
    detectedMime?: string;
    fileSignature?: string;
    hasEmbeddedScripts?: boolean;
    hasSuspiciousPatterns?: boolean;
    hasXSS?: boolean;
    hasPathTraversal?: boolean;
  };
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    size: number;
    format: string;
    dimensions?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    mimetype: string;
    extension: string;
    checksum: string;
  };
}

export interface SecurityConfig {
  maxFileSize: number;
  allowedFormats: string[];
  maxDimensions: { width: number; height: number };
  minDimensions: { width: number; height: number };
  allowedAspectRatios: { min: number; max: number };
  enableMalwareDetection: boolean;
  enableXSSDetection: boolean;
  enableEXIFValidation: boolean;
  stripMetadata: boolean;
}

export interface SecurityEvent {
  timestamp: string;
  eventType: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  details?: Record<string, any>;
  severity: 'info' | 'warn' | 'error';
}

export interface MalwareDetectionResult {
  isSuspicious: boolean;
  reasons: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface XSSDetectionResult {
  hasXSS: boolean;
  patterns: string[];
  sanitizedContent?: string;
}

export interface FileSignature {
  format: string;
  signature: string;
  offset: number;
}

export interface ContentValidationResult {
  valid: boolean;
  contentType: string;
  detectedType?: string;
  signatureMatch: boolean;
  errors: string[];
}

export interface SanitizationResult {
  original: string;
  sanitized: string;
  wasModified: boolean;
  modifications: string[];
}
