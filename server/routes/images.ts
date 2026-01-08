/**
 * Image Routes
 *
 * This module provides routes for image upload, retrieval, deletion, and listing
 * with comprehensive security validations.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, requirePermission, requireOwnership } from '../middleware/auth.js';
import { handleSingleFileUpload, generateUniqueFilename, getFileExtension, validateFile } from '../middleware/upload.js';
import { APIError, ImageUploadResponse, UploadedFile } from '../types/index.js';
import { handleError, handleSuccess } from '../middleware/errorHandler.js';
import { getSecurityService } from '../services/securityService.js';
import { logger } from '../utils/logger.js';
import sharp from 'sharp';
import { imageService } from '../services/imageServicePostgres.js';

export default async function imageRoutes(fastify: FastifyInstance) {
  const securityService = getSecurityService();

  // ============================================================================
  // Upload image endpoint
  // ============================================================================
  fastify.post(
    '/upload',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      logger.info({
        userId: request.userId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }, 'Image upload request received');

      // Log security event
      securityService.logSecurityEvent(
        'IMAGE_UPLOAD_ATTEMPT',
        'info',
        {
          userId: request.userId,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        }
      );

      // Handle file upload with security validation
      const uploadedFile = await handleSingleFileUpload(request, reply);

      if (!uploadedFile) {
        // Error already sent by handleSingleFileUpload
        securityService.logSecurityEvent(
          'IMAGE_UPLOAD_FAILED',
          'warn',
          {
            userId: request.userId,
            ip: request.ip,
            reason: 'File validation failed',
          }
        );
        return;
      }

      try {
        // Store image using image service with authenticated user ID
        const userId = request.userId!;

        const storedImage = await imageService.storeImage({
          userId,
          filename: uploadedFile.filename,
          originalFilename: uploadedFile.originalFilename,
          buffer: uploadedFile.data,
          mimetype: uploadedFile.mimetype,
          isTemporary: false,
          generateVariants: true,
        });

        // Validate that image ID was generated
        if (!storedImage || !storedImage.image || !storedImage.image.id) {
          logger.error({
            userId,
            filename: uploadedFile.filename,
            storedImage,
          }, 'Image storage failed - no image ID returned');
          
          throw new Error('Failed to store image - no image ID generated');
        }

        // Generate image URLs for all variants
        const variants = storedImage.variants.map(v => ({
          name: v.name,
          url: `/api/images/${storedImage.image.id}?variant=${v.name}`,
          width: v.width,
          height: v.height,
          size: v.size,
        }));

        // Log successful upload
        logger.info({
          userId,
          imageId: storedImage.image.id,
          filename: storedImage.image.filename,
          originalFilename: uploadedFile.originalFilename,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.data.length,
          dimensions: storedImage.image.metadata,
          checksum: storedImage.image.checksum,
          variants: variants.length,
        }, 'Image upload successful');

        // Log security event
        securityService.logSecurityEvent(
          'IMAGE_UPLOAD_SUCCESS',
          'info',
          {
            userId,
            imageId: storedImage.image.id,
            filename: storedImage.image.filename,
            originalFilename: uploadedFile.originalFilename,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.data.length,
            dimensions: storedImage.image.metadata,
            checksum: storedImage.image.checksum,
          }
        );

        const response: ImageUploadResponse = {
          success: true,
          image: {
            id: storedImage.image.id,
            url: `/api/images/${storedImage.image.id}`,
            filename: storedImage.image.filename,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.data.length,
            uploadedAt: new Date(),
          },
        };

        return reply.status(201).send(response);
      } catch (error) {
        const apiError = handleError(
          500,
          'Upload Error',
          'Failed to upload image',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: request.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }, 'Image upload error');

        securityService.logSecurityEvent(
          'IMAGE_UPLOAD_ERROR',
          'error',
          {
            userId: request.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        return reply.status(500).send(apiError);
      }
    }
  );

  // ============================================================================
  // Get image by ID endpoint
  // ============================================================================
  fastify.get(
    '/:imageId',
    {
      // No authentication required - images are publicly accessible
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { imageId } = request.params as { imageId: string };

      logger.info({
        userId: (request as any).userId || 'anonymous',
        imageId,
      }, 'Image retrieval request');

      // Validate image ID
      const idValidation = /^[a-zA-Z0-9\-_]+$/.test(imageId);
      if (!idValidation) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid image ID format',
        };
        logger.warn({
          userId: (request as any).userId || 'anonymous',
          imageId,
        }, 'Invalid image ID');
        securityService.logSecurityEvent(
          'INVALID_IMAGE_ID',
          'warn',
          {
            userId: (request as any).userId || 'anonymous',
            imageId,
          }
        );
        return reply.status(400).send(error);
      }

      try {
        // Get variant from query params (default to original)
        const query = request.query as { variant?: string };
        const variant = query.variant || 'original';

        // Retrieve image from image service
        const imageBuffer = await imageService.getImage(imageId, { variant });

        if (!imageBuffer) {
          const error: APIError = {
            statusCode: 404,
            error: 'Not Found',
            message: 'Image not found',
          };
          logger.warn({
            userId: (request as any).userId || 'anonymous',
            imageId,
            variant,
          }, 'Image not found');
          return reply.status(404).send(error);
        }

        // Get image metadata to determine content type
        const metadata = await imageService.getImageMetadata(imageId);
        const contentType = metadata?.mimetype || 'image/jpeg';

        // Return image with proper content type and CORS headers for public access
        return reply
          .type(contentType)
          .header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
          .header('Cross-Origin-Resource-Policy', 'cross-origin') // Allow cross-origin access
          .send(imageBuffer);
      } catch (error) {
        const apiError = handleError(
          500,
          'Retrieval Error',
          'Failed to retrieve image',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: (request as any).userId || 'anonymous',
          imageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Image retrieval error');

        securityService.logSecurityEvent(
          'IMAGE_RETRIEVAL_ERROR',
          'error',
          {
            userId: (request as any).userId || 'anonymous',
            imageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        return reply.status(500).send(apiError);
      }
    }
  );

  // ============================================================================
  // Delete image endpoint
  // ============================================================================
  fastify.delete(
    '/:imageId',
    {
      preHandler: [authMiddleware, requirePermission('image:delete')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { imageId } = request.params as { imageId: string };

      logger.info({
        userId: request.userId,
        imageId,
      }, 'Image deletion request');

      // Validate image ID
      const idValidation = /^[a-zA-Z0-9\-_]+$/.test(imageId);
      if (!idValidation) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid image ID format',
        };
        logger.warn({
          userId: (request as any).userId || 'anonymous',
          imageId,
        }, 'Invalid image ID');
        securityService.logSecurityEvent(
          'INVALID_IMAGE_ID',
          'warn',
          {
            userId: (request as any).userId || 'anonymous',
            imageId,
          }
        );
        return reply.status(400).send(error);
      }

      try {
        // Delete image using image service
        await imageService.deleteImage(imageId, request.userId!);
        
        logger.info({
          userId: request.userId,
          imageId,
        }, 'Image deletion successful');
        
        return reply.status(200).send({
          success: true,
          message: 'Image deleted successfully',
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Deletion Error',
          'Failed to delete image',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: request.userId,
          imageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Image deletion error');

        securityService.logSecurityEvent(
          'IMAGE_DELETION_ERROR',
          'error',
          {
            userId: request.userId,
            imageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        return reply.status(500).send(apiError);
      }
    }
  );

  // ============================================================================
  // List user's images endpoint
  // ============================================================================
  fastify.get(
    '/',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      logger.info({
        userId: request.userId,
        query,
      }, 'Image list request');

      // Validate pagination parameters
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '20', 10);

      if (isNaN(page) || page < 1) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid page parameter',
          details: { page: query.page },
        };
        logger.warn({
          userId: request.userId,
          page: query.page,
        }, 'Invalid page parameter');
        return reply.status(400).send(error);
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid limit parameter (must be between 1 and 100)',
          details: { limit: query.limit },
        };
        logger.warn({
          userId: request.userId,
          limit: query.limit,
        }, 'Invalid limit parameter');
        return reply.status(400).send(error);
      }

      // Validate sort parameters
      const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'size'];
      const allowedSortOrders = ['asc', 'desc'];

      if (query.sortBy && !allowedSortFields.includes(query.sortBy)) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid sort field',
          details: {
            sortBy: query.sortBy,
            allowedFields: allowedSortFields,
          },
        };
        logger.warn({
          userId: request.userId,
          sortBy: query.sortBy,
        }, 'Invalid sort field');
        return reply.status(400).send(error);
      }

      if (query.sortOrder && !allowedSortOrders.includes(query.sortOrder)) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid sort order',
          details: {
            sortOrder: query.sortOrder,
            allowedOrders: allowedSortOrders,
          },
        };
        logger.warn({
          userId: request.userId,
          sortOrder: query.sortOrder,
        }, 'Invalid sort order');
        return reply.status(400).send(error);
      }

      try {
        // List images using image service
        const images = await imageService.listImages({
          userId: request.userId,
          page,
          limit,
          sortBy: query.sortBy as any,
          sortOrder: query.sortOrder as any,
        });
        
        return reply.status(200).send({
          success: true,
          images: images.images,
          pagination: {
            page,
            limit,
            total: images.total,
            totalPages: Math.ceil(images.total / limit),
          },
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Listing Error',
          'Failed to list images',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: request.userId,
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Image listing error');

        securityService.logSecurityEvent(
          'IMAGE_LISTING_ERROR',
          'error',
          {
            userId: request.userId,
            query,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        return reply.status(500).send(apiError);
      }
    }
  );

  // ============================================================================
  // Validate image endpoint (security check without upload)
  // ============================================================================
  fastify.post(
    '/validate',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      logger.info({
        userId: request.userId,
      }, 'Image validation request');

      const uploadedFile = await handleSingleFileUpload(request, reply);

      if (!uploadedFile) {
        return;
      }

      try {
        // Perform comprehensive validation
        const validationResult = await validateFile(
          uploadedFile.data,
          uploadedFile.mimetype,
          uploadedFile.filename
        );

        logger.info({
          userId: request.userId,
          filename: uploadedFile.filename,
          valid: validationResult.valid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        }, 'Image validation completed');

        securityService.logSecurityEvent(
          'IMAGE_VALIDATION_COMPLETED',
          'info',
          {
            userId: request.userId,
            filename: uploadedFile.filename,
            valid: validationResult.valid,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          }
        );

        return reply.status(200).send({
          success: true,
          valid: validationResult.valid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          details: validationResult.details,
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Validation Error',
          'Failed to validate image',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: request.userId,
          filename: uploadedFile.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Image validation error');

        securityService.logSecurityEvent(
          'IMAGE_VALIDATION_ERROR',
          'error',
          {
            userId: request.userId,
            filename: uploadedFile.filename,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        return reply.status(500).send(apiError);
      }
    }
  );

  // ============================================================================
  // Get image metadata endpoint
  // ============================================================================
  fastify.get(
    '/:imageId/metadata',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { imageId } = request.params as { imageId: string };

      logger.info({
        userId: request.userId,
        imageId,
      }, 'Image metadata request');

      // Validate image ID
      const idValidation = /^[a-zA-Z0-9\-_]+$/.test(imageId);
      if (!idValidation) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid image ID format',
        };
        logger.warn({
          userId: request.userId,
          imageId,
        }, 'Invalid image ID');
        return reply.status(400).send(error);
      }

      try {
        // Get image metadata from image service
        const metadata = await imageService.getImageMetadata(imageId);
        
        if (!metadata) {
          const error: APIError = {
            statusCode: 404,
            error: 'Not Found',
            message: 'Image not found',
          };
          return reply.status(404).send(error);
        }
        
        return reply.status(200).send({
          success: true,
          metadata,
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Metadata Error',
          'Failed to retrieve image metadata',
          error instanceof Error ? error.message : 'Unknown error'
        );

        logger.error({
          userId: request.userId,
          imageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Image metadata error');

        return reply.status(500).send(apiError);
      }
    }
  );
}
