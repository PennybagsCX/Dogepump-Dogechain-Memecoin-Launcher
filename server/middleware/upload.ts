/**
 * Upload Middleware
 * 
 * This middleware provides comprehensive file upload handling with security validations,
 * including magic number detection, file size validation, dimension validation, and
 * content type verification.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { config } from '../config.js';
import { APIError, UploadedFile, FileValidationResult } from '../types/index.js';
import { getSecurityService } from '../services/securityService.js';
import { logger } from '../utils/logger.js';
import sharp from 'sharp';

// ============================================================================
// Upload Options Interface
// ============================================================================

export interface UploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  validateDimensions?: boolean;
  validateAspectRatio?: boolean;
  stripMetadata?: boolean;
  requireAuth?: boolean;
  maxFiles?: number;
}

// ============================================================================
// Default Upload Options
// ============================================================================

const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  maxFileSize: config.SECURITY.MAX_FILE_SIZE,
  allowedTypes: config.SECURITY.ALLOWED_FORMATS,
  validateDimensions: config.SECURITY.VALIDATE_DIMENSIONS,
  validateAspectRatio: config.SECURITY.VALIDATE_ASPECT_RATIO,
  stripMetadata: config.SECURITY.STRIP_METADATA,
  requireAuth: true,
  maxFiles: 1,
};

// ============================================================================
// Upload Middleware Functions
// ============================================================================

/**
 * Handle single file upload with comprehensive security validation
 */
export async function handleSingleFileUpload(
  request: FastifyRequest,
  reply: FastifyReply,
  options?: Partial<UploadOptions>
): Promise<UploadedFile | null> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  const securityService = getSecurityService();

  try {
    logger.info({
      userId: request.userId,
      options: opts,
    }, 'Starting single file upload');

    // Get the file from request
    const data = await request.file();

    if (!data) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'No file uploaded',
      };
      logger.warn({ userId: request.userId }, 'No file uploaded');
      reply.status(400).send(error);
      return null;
    }

    const file = data as MultipartFile;
    const originalFilename = file.filename || 'unknown';

    logger.info({
      userId: request.userId,
      filename: originalFilename,
      mimetype: file.mimetype,
    }, 'File received');

    // Convert file to buffer for validation
    const buffer = await file.toBuffer();

    // Step 1: Validate file signature (magic numbers)
    if (config.SECURITY.VALIDATE_FILE_SIGNATURE) {
      const signatureResult = securityService.validateSignature(buffer, file.mimetype);
      if (!signatureResult.valid) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid file signature',
          details: {
            declaredMime: file.mimetype,
            detectedMime: signatureResult.metadata?.detectedMime,
            fileSignature: signatureResult.metadata?.fileSignature,
          },
        };
        logger.warn({
          userId: request.userId,
          filename: originalFilename,
          errors: signatureResult.errors,
        }, 'File signature validation failed');
        securityService.logSecurityEvent(
          'FILE_SIGNATURE_VALIDATION_FAILED',
          'warn',
          {
            userId: request.userId,
            filename: originalFilename,
            declaredMime: file.mimetype,
            detectedMime: signatureResult.metadata?.detectedMime,
            errors: signatureResult.errors,
          }
        );
        reply.status(400).send(error);
        return null;
      }
    }

    // Step 2: Validate MIME type
    if (!opts.allowedTypes?.includes(file.mimetype)) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid file type',
        details: {
          allowedTypes: opts.allowedTypes,
          receivedType: file.mimetype,
        },
      };
      logger.warn({
        userId: request.userId,
        filename: originalFilename,
        receivedType: file.mimetype,
        allowedTypes: opts.allowedTypes,
      }, 'MIME type validation failed');
      securityService.logSecurityEvent(
        'MIME_TYPE_VALIDATION_FAILED',
        'warn',
        {
          userId: request.userId,
          filename: originalFilename,
          receivedType: file.mimetype,
          allowedTypes: opts.allowedTypes,
        }
      );
      reply.status(400).send(error);
      return null;
    }

    // Step 3: Validate file size
    const maxSize = opts.maxFileSize || (config.SECURITY.FILE_SIZE_LIMITS as any)[file.mimetype] || config.SECURITY.MAX_FILE_SIZE;
    if (buffer.length > maxSize) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'File size exceeds maximum limit',
        details: {
          maxSize: maxSize,
          receivedSize: buffer.length,
          maxSizeMB: (maxSize / (1024 * 1024)).toFixed(2),
          receivedSizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
        },
      };
      logger.warn({
        userId: request.userId,
        filename: originalFilename,
        size: buffer.length,
        maxSize,
      }, 'File size validation failed');
      securityService.logSecurityEvent(
        'FILE_SIZE_VALIDATION_FAILED',
        'warn',
        {
          userId: request.userId,
          filename: originalFilename,
          size: buffer.length,
          maxSize,
        }
      );
      reply.status(400).send(error);
      return null;
    }

    // Step 4: Get image dimensions
    let dimensions: { width: number; height: number } | undefined;
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width && metadata.height) {
        dimensions = { width: metadata.width, height: metadata.height };

        // Step 5: Validate dimensions if enabled
        if (opts.validateDimensions) {
          if (metadata.width < config.SECURITY.MIN_WIDTH || metadata.width > config.SECURITY.MAX_WIDTH) {
            const error: APIError = {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Invalid image width',
              details: {
                width: metadata.width,
                minWidth: config.SECURITY.MIN_WIDTH,
                maxWidth: config.SECURITY.MAX_WIDTH,
              },
            };
            logger.warn({
              userId: request.userId,
              filename: originalFilename,
              width: metadata.width,
            }, 'Width validation failed');
            reply.status(400).send(error);
            return null;
          }

          if (metadata.height < config.SECURITY.MIN_HEIGHT || metadata.height > config.SECURITY.MAX_HEIGHT) {
            const error: APIError = {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Invalid image height',
              details: {
                height: metadata.height,
                minHeight: config.SECURITY.MIN_HEIGHT,
                maxHeight: config.SECURITY.MAX_HEIGHT,
              },
            };
            logger.warn({
              userId: request.userId,
              filename: originalFilename,
              height: metadata.height,
            }, 'Height validation failed');
            reply.status(400).send(error);
            return null;
          }
        }

        // Step 6: Validate aspect ratio if enabled
        if (opts.validateAspectRatio) {
          const aspectRatio = metadata.width / metadata.height;
          if (aspectRatio < config.SECURITY.MIN_ASPECT_RATIO || aspectRatio > config.SECURITY.MAX_ASPECT_RATIO) {
            const error: APIError = {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Invalid aspect ratio',
              details: {
                aspectRatio: aspectRatio.toFixed(2),
                minAspectRatio: config.SECURITY.MIN_ASPECT_RATIO,
                maxAspectRatio: config.SECURITY.MAX_ASPECT_RATIO,
              },
            };
            logger.warn({
              userId: request.userId,
              filename: originalFilename,
              aspectRatio,
            }, 'Aspect ratio validation failed');
            reply.status(400).send(error);
            return null;
          }
        }
      }
    } catch (error) {
      logger.error({
        userId: request.userId,
        filename: originalFilename,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Error reading image dimensions');
      const apiError: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid image file',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
      reply.status(400).send(apiError);
      return null;
    }

    // Step 7: Perform comprehensive security validation
    const securityValidation = securityService.validateSecurity(
      buffer,
      file.mimetype,
      originalFilename
    );

    if (!securityValidation.valid) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Security validation failed',
        details: {
          errors: securityValidation.errors,
          warnings: securityValidation.warnings,
        },
      };
      
      // Enhanced logging with detailed security validation information
      logger.error({
        userId: request.userId,
        filename: originalFilename,
        mimetype: file.mimetype,
        fileSize: buffer.length,
        errors: securityValidation.errors,
        warnings: securityValidation.warnings,
        metadata: securityValidation.metadata,
        validationDetails: {
          hasErrors: securityValidation.errors.length > 0,
          hasWarnings: securityValidation.warnings.length > 0,
          errorTypes: securityValidation.errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)),
          warningTypes: securityValidation.warnings.map(w => typeof w === 'string' ? w : JSON.stringify(w)),
        },
      }, 'Security validation failed');
      
      securityService.logSecurityEvent(
        'SECURITY_VALIDATION_FAILED',
        'error',
        {
          userId: request.userId,
          filename: originalFilename,
          mimetype: file.mimetype,
          fileSize: buffer.length,
          errors: securityValidation.errors,
          warnings: securityValidation.warnings,
          metadata: securityValidation.metadata,
        }
      );
      reply.status(400).send(error);
      return null;
    }

    // Step 8: Strip metadata if enabled
    let processedBuffer = buffer;
    if (opts.stripMetadata) {
      try {
        processedBuffer = await securityService.stripMetadata(buffer);
        logger.info({
          userId: request.userId,
          filename: originalFilename,
          originalSize: buffer.length,
          newSize: processedBuffer.length,
        }, 'Metadata stripped');
      } catch (error) {
        logger.error({
          userId: request.userId,
          filename: originalFilename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Error stripping metadata');
        // Continue with original buffer if stripping fails
      }
    }

    // Step 9: Sanitize filename
    const sanitizedFilename = securityService.sanitizeFilename(originalFilename);

    // Return uploaded file data
    const uploadedFile: UploadedFile = {
      data: processedBuffer,
      filename: sanitizedFilename,
      originalFilename: originalFilename,
      mimetype: file.mimetype,
      encoding: file.encoding,
      fieldname: file.fieldname,
      dimensions,
      checksum: securityService.calculateChecksum(processedBuffer),
    };

    logger.info({
      userId: request.userId,
      filename: sanitizedFilename,
      originalFilename,
      mimetype: file.mimetype,
      size: processedBuffer.length,
      dimensions,
      checksum: uploadedFile.checksum,
    }, 'File upload successful');

    securityService.logSecurityEvent(
      'FILE_UPLOAD_SUCCESS',
      'info',
      {
        userId: request.userId,
        filename: sanitizedFilename,
        originalFilename,
        mimetype: file.mimetype,
        size: processedBuffer.length,
        dimensions,
        checksum: uploadedFile.checksum,
      }
    );

    return uploadedFile;
  } catch (error) {
    const apiError: APIError = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Failed to process file upload',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({
      userId: request.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'File upload error');
    securityService.logSecurityEvent(
      'FILE_UPLOAD_ERROR',
      'error',
      {
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    reply.status(500).send(apiError);
    return null;
  }
}

/**
 * Handle multiple file uploads with comprehensive security validation
 */
export async function handleMultipleFileUploads(
  request: FastifyRequest,
  reply: FastifyReply,
  options?: Partial<UploadOptions>
): Promise<UploadedFile[] | null> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  const securityService = getSecurityService();
  const maxFiles = opts.maxFiles || 5;

  try {
    logger.info({
      userId: request.userId,
      maxFiles,
      options: opts,
    }, 'Starting multiple file upload');

    const files: UploadedFile[] = [];
    const parts = request.files({ limits: { files: maxFiles } });

    let fileCount = 0;
    for await (const part of parts) {
      fileCount++;
      const file = part as MultipartFile;
      const originalFilename = file.filename || `file-${fileCount}`;

      logger.info({
        userId: request.userId,
        fileNumber: fileCount,
        filename: originalFilename,
        mimetype: file.mimetype,
      }, 'Processing file');

      // Convert file to buffer for validation
      const buffer = await file.toBuffer();

      // Step 1: Validate file signature (magic numbers)
      if (config.SECURITY.VALIDATE_FILE_SIGNATURE) {
        const signatureResult = securityService.validateSignature(buffer, file.mimetype);
        if (!signatureResult.valid) {
          const error: APIError = {
            statusCode: 400,
            error: 'Bad Request',
            message: `Invalid file signature for ${originalFilename}`,
            details: {
              filename: originalFilename,
              declaredMime: file.mimetype,
              detectedMime: signatureResult.metadata?.detectedMime,
              fileSignature: signatureResult.metadata?.fileSignature,
            },
          };
          logger.warn({
            userId: request.userId,
            filename: originalFilename,
            errors: signatureResult.errors,
          }, 'File signature validation failed');
          securityService.logSecurityEvent(
            'FILE_SIGNATURE_VALIDATION_FAILED',
            'warn',
            {
              userId: request.userId,
              filename: originalFilename,
              declaredMime: file.mimetype,
              errors: signatureResult.errors,
            }
          );
          reply.status(400).send(error);
          return null;
        }
      }

      // Step 2: Validate MIME type
      if (!opts.allowedTypes?.includes(file.mimetype)) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid file type for ${originalFilename}`,
          details: {
            filename: originalFilename,
            allowedTypes: opts.allowedTypes,
            receivedType: file.mimetype,
          },
        };
        logger.warn({
          userId: request.userId,
          filename: originalFilename,
          receivedType: file.mimetype,
        }, 'MIME type validation failed');
        reply.status(400).send(error);
        return null;
      }

      // Step 3: Validate file size
      const maxSize = opts.maxFileSize || (config.SECURITY.FILE_SIZE_LIMITS as any)[file.mimetype] || config.SECURITY.MAX_FILE_SIZE;
      if (buffer.length > maxSize) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: `File size exceeds maximum limit for ${originalFilename}`,
          details: {
            filename: originalFilename,
            maxSize: maxSize,
            receivedSize: buffer.length,
          },
        };
        logger.warn({
          userId: request.userId,
          filename: originalFilename,
          size: buffer.length,
          maxSize,
        }, 'File size validation failed');
        reply.status(400).send(error);
        return null;
      }

      // Step 4: Get image dimensions
      let dimensions: { width: number; height: number } | undefined;
      try {
        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height };

          // Step 5: Validate dimensions if enabled
          if (opts.validateDimensions) {
            if (
              metadata.width < config.SECURITY.MIN_WIDTH ||
              metadata.width > config.SECURITY.MAX_WIDTH ||
              metadata.height < config.SECURITY.MIN_HEIGHT ||
              metadata.height > config.SECURITY.MAX_HEIGHT
            ) {
              const error: APIError = {
                statusCode: 400,
                error: 'Bad Request',
                message: `Invalid dimensions for ${originalFilename}`,
                details: {
                  filename: originalFilename,
                  width: metadata.width,
                  height: metadata.height,
                  minWidth: config.SECURITY.MIN_WIDTH,
                  maxWidth: config.SECURITY.MAX_WIDTH,
                  minHeight: config.SECURITY.MIN_HEIGHT,
                  maxHeight: config.SECURITY.MAX_HEIGHT,
                },
              };
              logger.warn({
                userId: request.userId,
                filename: originalFilename,
                dimensions,
              }, 'Dimension validation failed');
              reply.status(400).send(error);
              return null;
            }
          }

          // Step 6: Validate aspect ratio if enabled
          if (opts.validateAspectRatio) {
            const aspectRatio = metadata.width / metadata.height;
            if (
              aspectRatio < config.SECURITY.MIN_ASPECT_RATIO ||
              aspectRatio > config.SECURITY.MAX_ASPECT_RATIO
            ) {
              const error: APIError = {
                statusCode: 400,
                error: 'Bad Request',
                message: `Invalid aspect ratio for ${originalFilename}`,
                details: {
                  filename: originalFilename,
                  aspectRatio: aspectRatio.toFixed(2),
                  minAspectRatio: config.SECURITY.MIN_ASPECT_RATIO,
                  maxAspectRatio: config.SECURITY.MAX_ASPECT_RATIO,
                },
              };
              logger.warn({
                userId: request.userId,
                filename: originalFilename,
                aspectRatio,
              }, 'Aspect ratio validation failed');
              reply.status(400).send(error);
              return null;
            }
          }
        }
      } catch (error) {
        logger.error({
          userId: request.userId,
          filename: originalFilename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Error reading image dimensions');
        const apiError: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid image file: ${originalFilename}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        };
        reply.status(400).send(apiError);
        return null;
      }

      // Step 7: Perform comprehensive security validation
      const securityValidation = securityService.validateSecurity(
        buffer,
        file.mimetype,
        originalFilename
      );

      if (!securityValidation.valid) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: `Security validation failed for ${originalFilename}`,
          details: {
            filename: originalFilename,
            errors: securityValidation.errors,
            warnings: securityValidation.warnings,
          },
        };
        logger.error({
          userId: request.userId,
          filename: originalFilename,
          errors: securityValidation.errors,
        }, 'Security validation failed');
        reply.status(400).send(error);
        return null;
      }

      // Step 8: Strip metadata if enabled
      let processedBuffer = buffer;
      if (opts.stripMetadata) {
        try {
          processedBuffer = await securityService.stripMetadata(buffer);
        } catch (error) {
          logger.error({
            userId: request.userId,
            filename: originalFilename,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, 'Error stripping metadata');
          // Continue with original buffer if stripping fails
        }
      }

      // Step 9: Sanitize filename
      const sanitizedFilename = securityService.sanitizeFilename(originalFilename);

      files.push({
        data: processedBuffer,
        filename: sanitizedFilename,
        originalFilename: originalFilename,
        mimetype: file.mimetype,
        encoding: file.encoding,
        fieldname: file.fieldname,
        dimensions,
        checksum: securityService.calculateChecksum(processedBuffer),
      });
    }

    if (files.length === 0) {
      const error: APIError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'No files uploaded',
      };
      logger.warn({ userId: request.userId }, 'No files uploaded');
      reply.status(400).send(error);
      return null;
    }

    logger.info({
      userId: request.userId,
      fileCount: files.length,
      files: files.map(f => ({
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.data.length,
      })),
    }, 'Multiple file upload successful');

    securityService.logSecurityEvent(
      'MULTIPLE_FILE_UPLOAD_SUCCESS',
      'info',
      {
        userId: request.userId,
        fileCount: files.length,
        files: files.map(f => ({
          filename: f.filename,
          mimetype: f.mimetype,
          size: f.data.length,
          checksum: f.checksum,
        })),
      }
    );

    return files;
  } catch (error) {
    const apiError: APIError = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Failed to process file uploads',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({
      userId: request.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Multiple file upload error');
    reply.status(500).send(apiError);
    return null;
  }
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop() || 'bin';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimetype: string): string {
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
 * Validate file with comprehensive security checks
 */
export async function validateFile(
  buffer: Buffer,
  mimetype: string,
  filename: string,
  options?: Partial<UploadOptions>
): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  const securityService = getSecurityService();

  return await securityService.validateFile(buffer, mimetype, filename);
}

/**
 * Create upload middleware
 */
export function createUploadMiddleware(options?: Partial<UploadOptions>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const uploadedFile = await handleSingleFileUpload(request, reply, options);
    if (!uploadedFile) {
      return; // Error already sent
    }
    // Attach file to request for use in route handler
    (request as any).uploadedFile = uploadedFile;
  };
}
