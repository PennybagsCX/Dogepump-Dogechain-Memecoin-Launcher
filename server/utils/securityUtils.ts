/**
 * Security Utilities
 * 
 * This module provides comprehensive security utilities for file validation,
 * input sanitization, and security checks.
 */

import { createHash } from 'crypto';

// ============================================================================
// Magic Number Constants (File Signatures)
// ============================================================================

export const MAGIC_NUMBERS = {
  // JPEG
  JPEG: [
    [0xFF, 0xD8, 0xFF], // JPEG SOI (Start of Image)
  ],
  
  // PNG
  PNG: [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
  ],
  
  // GIF
  GIF: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  
  // WebP
  WEBP: [
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
  
  // AVIF
  AVIF: [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // ftypavif
  ],
  
  // BMP
  BMP: [
    [0x42, 0x4D], // BM
  ],
  
  // TIFF (Little Endian)
  TIFF_LE: [
    [0x49, 0x49, 0x2A, 0x00],
  ],
  
  // TIFF (Big Endian)
  TIFF_BE: [
    [0x4D, 0x4D, 0x00, 0x2A],
  ],
} as const;

// MIME type to magic number mapping
export const MIME_TO_MAGIC_NUMBERS: Record<string, number[][]> = {
  'image/jpeg': [[...MAGIC_NUMBERS.JPEG[0]]],
  'image/jpg': [[...MAGIC_NUMBERS.JPEG[0]]],
  'image/png': [[...MAGIC_NUMBERS.PNG[0]]],
  'image/gif': [[...MAGIC_NUMBERS.GIF[0]], [...MAGIC_NUMBERS.GIF[1]]],
  'image/webp': [[...MAGIC_NUMBERS.WEBP[0]]],
  'image/avif': [[...MAGIC_NUMBERS.AVIF[0]]],
  'image/bmp': [[...MAGIC_NUMBERS.BMP[0]]],
  'image/tiff': [[...MAGIC_NUMBERS.TIFF_LE[0]], [...MAGIC_NUMBERS.TIFF_BE[0]]],
};

// File extension to MIME type mapping
export const EXTENSION_TO_MIME: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'avif': 'image/avif',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
};

// Binary formats that should not undergo text-based pattern detection
// These formats contain arbitrary binary data that can trigger false positives
// when searching for text-based patterns like PHP tags or script tags
export const BINARY_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff'
];

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

// ============================================================================
// File Signature Validation
// ============================================================================

/**
 * Check if a buffer matches a magic number signature
 */
export function matchesMagicNumber(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Detect file format from magic numbers
 */
export function detectFileFormat(buffer: Buffer): string | null {
  // Check each format's magic numbers
  for (const [format, signatures] of Object.entries(MIME_TO_MAGIC_NUMBERS)) {
    for (const signature of signatures) {
      if (matchesMagicNumber(buffer, signature)) {
        return format;
      }
    }
  }
  
  return null;
}

/**
 * Validate file signature against declared MIME type
 */
export function validateFileSignature(
  buffer: Buffer,
  declaredMime: string
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Detect actual format from magic numbers
  const detectedMime = detectFileFormat(buffer);
  
  if (!detectedMime) {
    errors.push('File signature does not match any known image format');
    return {
      valid: false,
      errors,
      warnings,
      metadata: {
        fileSignature: buffer.slice(0, 8).toString('hex'),
      },
    };
  }
  
  // Check if detected format matches declared MIME type
  if (detectedMime !== declaredMime) {
    errors.push(
      `File signature mismatch: declared as ${declaredMime} but detected as ${detectedMime}`
    );
    return {
      valid: false,
      errors,
      warnings,
      metadata: {
        detectedFormat: detectedMime,
        detectedMime,
        fileSignature: buffer.slice(0, 8).toString('hex'),
      },
    };
  }
  
  return {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {
      detectedFormat: detectedMime,
      detectedMime,
      fileSignature: buffer.slice(0, 8).toString('hex'),
    },
  };
}

/**
 * Get file signature hex string for logging
 */
export function getFileSignature(buffer: Buffer, bytes: number = 8): string {
  return buffer.slice(0, bytes).toString('hex').toUpperCase();
}

// ============================================================================
// Malware and Suspicious Pattern Detection
// ============================================================================

/**
 * Suspicious patterns that may indicate embedded scripts or malware
 */
const SUSPICIOUS_PATTERNS = [
  // Script tags
  /<script/i,
  /<\/script>/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  // PHP tags
  /<\?php/i,
  /\?>/i,
  // ASP tags
  /<%/i,
  /%>/i,
  // Shell commands
  /eval\s*\(/i,
  /exec\s*\(/i,
  /system\s*\(/i,
  /passthru\s*\(/i,
  /shell_exec\s*\(/i,
  // Base64 encoded content
  /data:[^;]+;base64/i,
  // Iframe
  /<iframe/i,
  /<\/iframe>/i,
  // Object
  /<object/i,
  /<\/object>/i,
  // Embed
  /<embed/i,
  /<\/embed>/i,
];

/**
 * Check for embedded scripts or suspicious patterns
 */
export function detectEmbeddedScripts(buffer: Buffer): boolean {
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for suspicious patterns in entire buffer
 */
export function detectSuspiciousPatterns(buffer: Buffer): {
  hasSuspiciousPatterns: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(pattern.toString());
    }
  }
  
  return {
    hasSuspiciousPatterns: patterns.length > 0,
    patterns,
  };
}

/**
 * Basic malware detection using pattern matching
 * Note: This is NOT a replacement for proper antivirus scanning
 */
export function detectMalware(buffer: Buffer): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for embedded scripts
  if (detectEmbeddedScripts(buffer)) {
    reasons.push('Embedded scripts detected');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = detectSuspiciousPatterns(buffer);
  if (suspiciousPatterns.hasSuspiciousPatterns) {
    reasons.push(`Suspicious patterns detected: ${suspiciousPatterns.patterns.join(', ')}`);
  }
  
  // Check for polyglot files (files that can be interpreted as multiple formats)
  const detectedFormats: string[] = [];
  for (const [format, signatures] of Object.entries(MIME_TO_MAGIC_NUMBERS)) {
    for (const signature of signatures) {
      if (matchesMagicNumber(buffer, signature)) {
        detectedFormats.push(format);
        break;
      }
    }
  }
  
  if (detectedFormats.length > 1) {
    reasons.push(`Polyglot file detected (matches ${detectedFormats.length} formats)`);
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

// ============================================================================
// XSS Detection
// ============================================================================

/**
 * XSS patterns to detect in file content and metadata
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<link[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /fromCharCode/gi,
  /&#x/gi,
  /&#/g,
];

/**
 * Check for XSS patterns in content
 */
export function detectXSS(content: string): {
  hasXSS: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(pattern.toString());
    }
  }
  
  return {
    hasXSS: patterns.length > 0,
    patterns,
  };
}

/**
 * Sanitize content to prevent XSS
 */
export function sanitizeForXSS(content: string): string {
  return content
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  sanitized = sanitized.substring(0, 255);
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^\.+/, '').replace(/\s+$/, '');
  
  // If empty after sanitization, use default
  if (!sanitized) {
    sanitized = 'file';
  }
  
  return sanitized;
}

/**
 * Validate path to prevent path traversal
 */
export function validatePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // Check for null bytes
  if (path.includes('\0')) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/["']/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize URL parameter
 */
export function sanitizeUrlParam(param: string): string {
  return param
    .replace(/[<>]/g, '')
    .replace(/["']/g, '')
    .replace(/[;&]/g, '')
    .trim()
    .substring(0, 100);
}

// ============================================================================
// File Size and Dimension Validation
// ============================================================================

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number,
  format?: string
): { valid: boolean; error?: string } {
  if (size <= 0) {
    return { valid: false, error: 'File size must be greater than 0' };
  }
  
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate image dimensions
 */
export function validateDimensions(
  width: number,
  height: number,
  config: { minWidth: number; maxWidth: number; minHeight: number; maxHeight: number }
): { valid: boolean; error?: string } {
  if (width < config.minWidth) {
    return {
      valid: false,
      error: `Width (${width}px) is less than minimum (${config.minWidth}px)`,
    };
  }
  
  if (width > config.maxWidth) {
    return {
      valid: false,
      error: `Width (${width}px) exceeds maximum (${config.maxWidth}px)`,
    };
  }
  
  if (height < config.minHeight) {
    return {
      valid: false,
      error: `Height (${height}px) is less than minimum (${config.minHeight}px)`,
    };
  }
  
  if (height > config.maxHeight) {
    return {
      valid: false,
      error: `Height (${height}px) exceeds maximum (${config.maxHeight}px)`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate aspect ratio
 */
export function validateAspectRatio(
  width: number,
  height: number,
  config: { min: number; max: number }
): { valid: boolean; error?: string } {
  if (height === 0) {
    return { valid: false, error: 'Height cannot be zero' };
  }
  
  const aspectRatio = width / height;
  
  if (aspectRatio < config.min) {
    return {
      valid: false,
      error: `Aspect ratio (${aspectRatio.toFixed(2)}) is less than minimum (${config.min.toFixed(2)})`,
    };
  }
  
  if (aspectRatio > config.max) {
    return {
      valid: false,
      error: `Aspect ratio (${aspectRatio.toFixed(2)}) exceeds maximum (${config.max.toFixed(2)})`,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// Content Type Validation
// ============================================================================

/**
 * Validate MIME type
 */
export function validateMimeType(
  mime: string,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(mime)) {
    return {
      valid: false,
      error: `MIME type '${mime}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Detect content type from buffer
 */
export function detectContentType(buffer: Buffer): string | null {
  return detectFileFormat(buffer);
}

/**
 * Validate content type against declared type
 */
export function validateContentType(
  buffer: Buffer,
  declaredType: string
): SecurityValidationResult {
  const detectedType = detectContentType(buffer);
  
  if (!detectedType) {
    return {
      valid: false,
      errors: ['Could not detect content type from file'],
      warnings: [],
    };
  }
  
  if (detectedType !== declaredType) {
    return {
      valid: false,
      errors: [
        `Content type mismatch: declared as ${declaredType} but detected as ${detectedType}`,
      ],
      warnings: [],
      metadata: {
        detectedMime: detectedType,
      },
    };
  }
  
  return {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {
      detectedMime: detectedType,
    },
  };
}

// ============================================================================
// Checksum and Hashing
// ============================================================================

/**
 * Calculate file checksum using SHA-256
 */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate file checksum using specified algorithm
 */
export function calculateHash(buffer: Buffer, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(buffer).digest('hex');
}

// ============================================================================
// EXIF Data Validation
// ============================================================================

/**
 * Check for suspicious EXIF data
 */
export function validateEXIFData(buffer: Buffer): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // JPEG EXIF data starts at offset 2 with markers
  if (buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // Look for EXIF marker (0xFFE1)
    let offset = 2;
    while (offset < buffer.length - 1) {
      if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xE1) {
        // EXIF data found - could contain sensitive information
        warnings.push('EXIF metadata detected - consider stripping for privacy');
        break;
      }
      
      // Skip to next marker
      if (buffer[offset] === 0xFF) {
        const markerLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
        offset += markerLength + 2;
      } else {
        break;
      }
    }
  }
  
  return {
    valid: true,
    warnings,
  };
}

// ============================================================================
// Comprehensive Security Validation
// ============================================================================

/**
 * Perform comprehensive security validation on a file
 */
export function validateFileSecurity(
  buffer: Buffer,
  declaredMime: string,
  filename: string,
  config: SecurityConfig
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validate file signature
  const signatureResult = validateFileSignature(buffer, declaredMime);
  if (!signatureResult.valid) {
    errors.push(...signatureResult.errors);
  }
  warnings.push(...signatureResult.warnings);
  
  // 2. Validate MIME type
  const mimeResult = validateMimeType(declaredMime, config.allowedFormats);
  if (!mimeResult.valid) {
    errors.push(mimeResult.error!);
  }
  
  // 3. Validate file size
  const sizeResult = validateFileSize(buffer.length, config.maxFileSize);
  if (!sizeResult.valid) {
    errors.push(sizeResult.error!);
  }
  
  // 4. Detect malware if enabled
  if (config.enableMalwareDetection) {
    // Skip text-based pattern detection for binary image formats
    // Binary image files contain arbitrary binary data that can trigger false positives
    // when searching for text-based patterns like PHP tags or script tags
    if (!BINARY_IMAGE_FORMATS.includes(declaredMime)) {
      const malwareResult = detectMalware(buffer);
      if (malwareResult.isSuspicious) {
        errors.push(...malwareResult.reasons);
      }
    }
  }
  
  // 5. Detect XSS if enabled
  if (config.enableXSSDetection) {
    // Skip XSS detection for binary image formats
    // Binary image files contain arbitrary binary data that can trigger false positives
    // when searching for text-based patterns
    if (!BINARY_IMAGE_FORMATS.includes(declaredMime)) {
      const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
      const xssResult = detectXSS(content);
      if (xssResult.hasXSS) {
        errors.push(`XSS patterns detected: ${xssResult.patterns.join(', ')}`);
      }
    }
  }
  
  // 6. Validate EXIF data if enabled
  if (config.enableEXIFValidation) {
    const exifResult = validateEXIFData(buffer);
    warnings.push(...exifResult.warnings);
  }
  
  // 7. Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);
  if (sanitizedFilename !== filename) {
    warnings.push(`Filename was sanitized: ${filename} -> ${sanitizedFilename}`);
  }
  
  // 8. Validate path
  if (!validatePath(filename)) {
    errors.push('Invalid filename: contains path traversal attempts');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      ...signatureResult.metadata,
      hasEmbeddedScripts: detectEmbeddedScripts(buffer),
      hasSuspiciousPatterns: detectSuspiciousPatterns(buffer).hasSuspiciousPatterns,
      hasXSS: config.enableXSSDetection ? detectXSS(buffer.toString('utf-8', 0, 4096)).hasXSS : false,
      hasPathTraversal: !validatePath(filename),
    },
  };
}

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Get security headers for HTTP responses
 */
export function getSecurityHeaders(): Record<string, string> {
  // Disable CSP in development to allow Vite HMR, React Fast Refresh, and external CDNs
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };

  // Only set CSP in production
  if (!isDevelopment) {
    headers['Content-Security-Policy'] = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data: https://esm.sh https://aistudiocdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http: https://picsum.photos https://dogepump.com",
      "connect-src 'self' blob: data: https://esm.sh https://aistudiocdn.com https://fonts.googleapis.com https://dogepump.com",
      "media-src 'self' blob: data: https:",
      "object-src 'none'",
      "frame-src 'self' blob:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "manifest-src 'self'",
      "prefetch-src 'self' https://esm.sh https://aistudiocdn.com",
    ].join('; ');
  }

  return headers;
}

// ============================================================================
// SQL Injection Prevention
// ============================================================================

/**
 * Basic SQL injection pattern detection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/,
    /(' OR |" OR |1=1|1 = 1)/i,
    /(\bUNION\s+ALL\b)/i,
    /(\bEXEC\s*\()/i,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sanitize input for SQL queries (parameterized queries are preferred)
 */
export function sanitizeForSQL(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Format security event for logging
 */
export function formatSecurityEvent(
  eventType: string,
  details: Record<string, any>
): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    eventType,
    ...details,
  });
}

/**
 * Generate security audit log entry
 */
export function generateAuditLog(
  action: string,
  userId?: string,
  details?: Record<string, any>
): string {
  return formatSecurityEvent('AUDIT', {
    action,
    userId,
    ...details,
  });
}
