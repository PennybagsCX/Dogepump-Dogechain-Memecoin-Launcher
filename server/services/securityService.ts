/**
 * Security Service
 *
 * This service provides comprehensive security validation for file uploads,
 * including magic number detection, malware detection, XSS prevention, and
 * content sanitization.
 */

import sharp from 'sharp';
import {
  SecurityValidationResult,
  FileValidationResult,
  SecurityConfig,
  validateFileSecurity,
  validateFileSignature,
  validateMimeType,
  validateFileSize,
  validateDimensions,
  validateAspectRatio,
  validateContentType,
  detectMalware,
  detectXSS,
  validateEXIFData,
  sanitizeFilename,
  calculateChecksum,
  getFileSignature,
  detectFileFormat,
  generateAuditLog,
  formatSecurityEvent,
  BINARY_IMAGE_FORMATS,
} from '../utils/securityUtils.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Security Service Configuration
// ============================================================================

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
  maxDimensions: { width: 4096, height: 4096 },
  minDimensions: { width: 32, height: 32 },
  allowedAspectRatios: { min: 0.1, max: 10 },
  enableMalwareDetection: true,
  enableXSSDetection: true,
  enableEXIFValidation: true,
  stripMetadata: true,
};

// ============================================================================
// Security Service Class
// ============================================================================

export class SecurityService {
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Update security configuration
   */
  public updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current security configuration
   */
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // ============================================================================
  // File Validation
  // ============================================================================

  /**
   * Perform comprehensive file validation
   */
  public async validateFile(
    buffer: Buffer,
    declaredMime: string,
    filename: string
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info({
      filename,
      declaredMime,
      size: buffer.length,
    }, 'Starting file validation');

    // 1. Validate file signature (magic numbers)
    const signatureResult = validateFileSignature(buffer, declaredMime);
    if (!signatureResult.valid) {
      errors.push(...signatureResult.errors);
      logger.warn({
        filename,
        errors: signatureResult.errors,
      }, 'File signature validation failed');
    }
    warnings.push(...signatureResult.warnings);

    // 2. Validate MIME type
    const mimeResult = validateMimeType(declaredMime, this.config.allowedFormats);
    if (!mimeResult.valid) {
      errors.push(mimeResult.error!);
      logger.warn({
        filename,
        declaredMime,
        error: mimeResult.error,
      }, 'MIME type validation failed');
    }

    // 3. Validate file size
    const sizeResult = validateFileSize(buffer.length, this.config.maxFileSize);
    if (!sizeResult.valid) {
      errors.push(sizeResult.error!);
      logger.warn({
        filename,
        size: buffer.length,
        maxSize: this.config.maxFileSize,
        error: sizeResult.error,
      }, 'File size validation failed');
    }

    // 4. Get image dimensions
    let dimensions: { width: number; height: number } | undefined;
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width && metadata.height) {
        dimensions = { width: metadata.width, height: metadata.height };

        // 5. Validate dimensions
        const dimResult = validateDimensions(
          metadata.width,
          metadata.height,
          {
            minWidth: this.config.minDimensions.width,
            maxWidth: this.config.maxDimensions.width,
            minHeight: this.config.minDimensions.height,
            maxHeight: this.config.maxDimensions.height,
          }
        );
        if (!dimResult.valid) {
          errors.push(dimResult.error!);
          logger.warn({
            filename,
            dimensions,
            error: dimResult.error,
          }, 'Dimension validation failed');
        }

        // 6. Validate aspect ratio
        const aspectResult = validateAspectRatio(
          metadata.width,
          metadata.height,
          this.config.allowedAspectRatios
        );
        if (!aspectResult.valid) {
          errors.push(aspectResult.error!);
          logger.warn({
            filename,
            dimensions,
            error: aspectResult.error,
          }, 'Aspect ratio validation failed');
        }
      }
    } catch (error) {
      errors.push('Failed to read image dimensions');
      logger.error({
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Error reading image dimensions');
    }

    // 7. Detect malware if enabled
    if (this.config.enableMalwareDetection) {
      // Skip text-based pattern detection for binary image formats
      // Binary image files contain arbitrary binary data that can trigger false positives
      // when searching for text-based patterns like PHP tags or script tags
      if (!BINARY_IMAGE_FORMATS.includes(declaredMime)) {
        const malwareResult = detectMalware(buffer);
        if (malwareResult.isSuspicious) {
          errors.push(...malwareResult.reasons);
          logger.warn({
            filename,
            reasons: malwareResult.reasons,
          }, 'Malware detection triggered');
        }
      }
    }

    // 8. Detect XSS if enabled
    if (this.config.enableXSSDetection) {
      // Skip XSS detection for binary image formats
      // Binary image files contain arbitrary binary data that can trigger false positives
      // when searching for text-based patterns
      if (!BINARY_IMAGE_FORMATS.includes(declaredMime)) {
        const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
        const xssResult = detectXSS(content);
        if (xssResult.hasXSS) {
          errors.push(`XSS patterns detected: ${xssResult.patterns.join(', ')}`);
          logger.warn({
            filename,
            patterns: xssResult.patterns,
          }, 'XSS detection triggered');
        }
      }
    }

    // 9. Validate EXIF data if enabled
    if (this.config.enableEXIFValidation) {
      const exifResult = validateEXIFData(buffer);
      warnings.push(...exifResult.warnings);
      if (exifResult.warnings.length > 0) {
        logger.info({
          filename,
          warnings: exifResult.warnings,
        }, 'EXIF validation warnings');
      }
    }

    // 10. Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename);
    if (sanitizedFilename !== filename) {
      warnings.push(`Filename was sanitized: ${filename} -> ${sanitizedFilename}`);
      logger.info({
        original: filename,
        sanitized: sanitizedFilename,
      }, 'Filename sanitized');
    }

    // 11. Calculate checksum
    const checksum = calculateChecksum(buffer);

    // 12. Get file extension
    const extension = this.getFileExtension(declaredMime);

    const result: FileValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      details: {
        size: buffer.length,
        format: declaredMime,
        dimensions: dimensions
          ? {
              width: dimensions.width,
              height: dimensions.height,
              aspectRatio: dimensions.width / dimensions.height,
            }
          : undefined,
        mimetype: declaredMime,
        extension,
        checksum,
      },
    };

    if (result.valid) {
      logger.info({
        filename,
        checksum,
        dimensions: result.details.dimensions,
      }, 'File validation passed');
    } else {
      logger.error({
        filename,
        errors: result.errors,
      }, 'File validation failed');
    }

    return result;
  }

  /**
   * Perform comprehensive security validation
   */
  public validateSecurity(
    buffer: Buffer,
    declaredMime: string,
    filename: string
  ): SecurityValidationResult {
    logger.info({
      filename,
      declaredMime,
      size: buffer.length,
    }, 'Starting security validation');

    const result = validateFileSecurity(buffer, declaredMime, filename, this.config);

    if (result.valid) {
      logger.info({
        filename,
        metadata: result.metadata,
      }, 'Security validation passed');
    } else {
      logger.error({
        filename,
        errors: result.errors,
        metadata: result.metadata,
      }, 'Security validation failed');
    }

    return result;
  }

  // ============================================================================
  // Magic Number Detection
  // ============================================================================

  /**
   * Detect file format from magic numbers
   */
  public detectFormat(buffer: Buffer): string | null {
    const format = detectFileFormat(buffer);
    logger.debug({
      format,
      signature: getFileSignature(buffer),
    }, 'Format detected from magic numbers');
    return format;
  }

  /**
   * Get file signature for logging
   */
  public getFileSignature(buffer: Buffer, bytes: number = 8): string {
    return getFileSignature(buffer, bytes);
  }

  /**
   * Validate file signature against declared type
   */
  public validateSignature(
    buffer: Buffer,
    declaredMime: string
  ): SecurityValidationResult {
    return validateFileSignature(buffer, declaredMime);
  }

  // ============================================================================
  // Malware Detection
  // ============================================================================

  /**
   * Detect malware in file
   */
  public detectMalware(buffer: Buffer): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    return detectMalware(buffer);
  }

  /**
   * Check for embedded scripts
   */
  public detectEmbeddedScripts(buffer: Buffer): boolean {
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
    const suspiciousPatterns = [
      /<script/i,
      /<\/script>/i,
      /javascript:/i,
      /vbscript:/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // XSS Detection
  // ============================================================================

  /**
   * Detect XSS patterns in content
   */
  public detectXSS(content: string): {
    hasXSS: boolean;
    patterns: string[];
  } {
    return detectXSS(content);
  }

  /**
   * Sanitize content to prevent XSS
   */
  public sanitizeForXSS(content: string): string {
    return content
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // ============================================================================
  // Content Sanitization
  // ============================================================================

  /**
   * Sanitize filename
   */
  public sanitizeFilename(filename: string): string {
    return sanitizeFilename(filename);
  }

  /**
   * Sanitize user input
   */
  public sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/["']/g, '')
      .substring(0, 1000);
  }

  /**
   * Sanitize URL parameter
   */
  public sanitizeUrlParam(param: string): string {
    return param
      .replace(/[<>]/g, '')
      .replace(/["']/g, '')
      .replace(/[;&]/g, '')
      .trim()
      .substring(0, 100);
  }

  // ============================================================================
  // EXIF Data Handling
  // ============================================================================

  /**
   * Validate EXIF data
   */
  public validateEXIF(buffer: Buffer): {
    valid: boolean;
    warnings: string[];
  } {
    return validateEXIFData(buffer);
  }

  /**
   * Strip EXIF metadata from image
   */
  public async stripMetadata(buffer: Buffer): Promise<Buffer> {
    try {
      const processed = await sharp(buffer)
        .withMetadata() // This removes EXIF data
        .toBuffer();
      logger.info({
        originalSize: buffer.length,
        newSize: processed.length,
      }, 'Metadata stripped successfully');
      return processed;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Error stripping metadata');
      throw error;
    }
  }

  // ============================================================================
  // Checksum and Hashing
  // ============================================================================

  /**
   * Calculate file checksum
   */
  public calculateChecksum(buffer: Buffer): string {
    return calculateChecksum(buffer);
  }

  /**
   * Verify file checksum
   */
  public verifyChecksum(buffer: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = calculateChecksum(buffer);
    return actualChecksum === expectedChecksum;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/bmp': 'bmp',
    };
    return extensions[mimetype] || 'bin';
  }

  /**
   * Generate audit log entry
   */
  public generateAuditLog(
    action: string,
    userId?: string,
    details?: Record<string, any>
  ): string {
    return generateAuditLog(action, userId, details);
  }

  /**
   * Format security event for logging
   */
  public formatSecurityEvent(
    eventType: string,
    details: Record<string, any>
  ): string {
    return formatSecurityEvent(eventType, details);
  }

  /**
   * Log security event
   */
  public logSecurityEvent(
    eventType: string,
    level: 'info' | 'warn' | 'error',
    details: Record<string, any>
  ): void {
    const event = this.formatSecurityEvent(eventType, details);
    
    switch (level) {
      case 'info':
        logger.info(event);
        break;
      case 'warn':
        logger.warn(event);
        break;
      case 'error':
        logger.error(event);
        break;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let securityServiceInstance: SecurityService | null = null;

/**
 * Get or create the security service singleton instance
 */
export function getSecurityService(config?: Partial<SecurityConfig>): SecurityService {
  if (!securityServiceInstance) {
    securityServiceInstance = new SecurityService(config);
  } else if (config) {
    securityServiceInstance.updateConfig(config);
  }
  return securityServiceInstance;
}

/**
 * Reset the security service singleton (useful for testing)
 */
export function resetSecurityService(): void {
  securityServiceInstance = null;
}

// ============================================================================
// Export Default
// ============================================================================

export default SecurityService;
