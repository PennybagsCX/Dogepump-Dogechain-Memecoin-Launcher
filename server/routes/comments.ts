import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { handleSingleFileUpload, generateUniqueFilename, getFileExtension } from '../middleware/upload.js';
import { validateCommentContent } from '../middleware/validation.js';
import { APIError, Comment, CreateCommentRequest } from '../types/index.js';
import { handleError } from '../middleware/errorHandler.js';
import { imageService } from '../services/imageServicePostgres.js';
import { commentService } from '../services/commentServicePostgres.js';

export default async function commentRoutes(fastify: FastifyInstance) {
  // Create comment endpoint
  fastify.post(
    '/',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateCommentRequest;

      // Validate comment content
      const validation = validateCommentContent(body.content);
      if (!validation.valid) {
        const error: APIError = {
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid comment content',
          details: validation.errors,
        };
        return reply.status(400).send(error);
      }

      try {
        // Get user info from request
        const userId = request.userId!;
        const username = request.user?.username || 'anonymous';

        // Validate tokenId
        if (!body.tokenId) {
          const error: APIError = {
            statusCode: 400,
            error: 'Validation Error',
            message: 'tokenId is required',
          };
          return reply.status(400).send(error);
        }

        // Create comment using comment service
        const comment = await commentService.createComment(
          userId,
          username,
          {
            tokenId: body.tokenId,
            content: body.content,
            imageId: body.imageId,
            tradeAction: body.tradeAction,
          }
        );

        return reply.status(201).send({
          success: true,
          comment,
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Creation Error',
          'Failed to create comment',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Create comment with image endpoint
  fastify.post(
    '/with-image',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Parse multipart form data
      const parts = request.parts();
      let content = '';
      let tokenId = '';
      let imageFile: any = null;

      for await (const part of parts) {
        if (part.type === 'field') {
          if (part.fieldname === 'content') {
            content = part.value as string;
          } else if (part.fieldname === 'tokenId') {
            tokenId = part.value as string;
          }
        } else if (part.type === 'file') {
          imageFile = part;
        }
      }

      // Validate comment content
      const validation = validateCommentContent(content);
      if (!validation.valid) {
        const error: APIError = {
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid comment content',
          details: validation.errors,
        };
        return reply.status(400).send(error);
      }

      // Validate tokenId
      if (!tokenId) {
        const error: APIError = {
          statusCode: 400,
          error: 'Validation Error',
          message: 'tokenId is required',
        };
        return reply.status(400).send(error);
      }

      if (!imageFile) {
        const error: APIError = {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Image file is required',
        };
        return reply.status(400).send(error);
      }

      try {
        // Get user info from request
        const userId = request.userId!;
        const username = request.user?.username || 'anonymous';

        // Process image upload
        const uploadedFile = await handleSingleFileUpload(request, reply);

        if (!uploadedFile) {
          return;
        }

        // Store image
        const storedImage = await imageService.storeImage({
          userId,
          filename: uploadedFile.originalFilename || uploadedFile.filename,
          originalFilename: uploadedFile.originalFilename || uploadedFile.filename,
          buffer: uploadedFile.data,
          mimetype: uploadedFile.mimetype,
          isTemporary: false,
          generateVariants: true,
        });

        // Create comment with image
        const comment = await commentService.createComment(
          userId,
          username,
          {
            tokenId,
            content,
            imageId: storedImage.image.id,
          }
        );

        return reply.status(201).send({
          success: true,
          comment,
          image: {
            id: storedImage.image.id,
            url: `/api/images/${storedImage.image.id}`,
            filename: storedImage.image.filename,
          },
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Creation Error',
          'Failed to create comment with image',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Get comments endpoint
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      try {
        // Get comments using comment service - search with empty query for all comments
        const result = await commentService.searchComments('', {
          page: parseInt(query.page || '1', 10),
          limit: parseInt(query.limit || '20', 10),
        });

        return reply.status(200).send({
          success: true,
          comments: result.comments,
          pagination: {
            page: parseInt(query.page || '1', 10),
            limit: parseInt(query.limit || '20', 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(query.limit || '20', 10)),
          },
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Retrieval Error',
          'Failed to retrieve comments',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Get comment by ID endpoint
  fastify.get(
    '/:commentId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { commentId } = request.params as { commentId: string };

      try {
        // Retrieve comment using comment service
        const comment = await commentService.getCommentById(commentId);

        if (!comment) {
          const error: APIError = {
            statusCode: 404,
            error: 'Not Found',
            message: 'Comment not found',
          };
          return reply.status(404).send(error);
        }

        return reply.status(200).send({
          success: true,
          comment,
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Retrieval Error',
          'Failed to retrieve comment',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Update comment endpoint
  fastify.put(
    '/:commentId',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { commentId } = request.params as { commentId: string };
      const body = request.body as { content: string };

      // Validate comment content
      const validation = validateCommentContent(body.content);
      if (!validation.valid) {
        const error: APIError = {
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid comment content',
          details: validation.errors,
        };
        return reply.status(400).send(error);
      }

      try {
        // Update comment functionality not yet implemented
        throw new Error('Update comment functionality not yet implemented');
      } catch (error) {
        const apiError = handleError(
          501,
          'Not Implemented',
          'Update comment functionality is not yet implemented',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(501).send(apiError);
      }
    }
  );

  // Delete comment endpoint
  fastify.delete(
    '/:commentId',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { commentId } = request.params as { commentId: string };

      try {
        // Delete comment using comment service
        await commentService.deleteComment(commentId, request.userId!);

        return reply.status(200).send({
          success: true,
          message: 'Comment deleted successfully',
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Deletion Error',
          'Failed to delete comment',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Get comments by image endpoint
  fastify.get(
    '/image/:imageId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { imageId } = request.params as { imageId: string };
      const query = request.query as {
        page?: string;
        limit?: string;
      };

      try {
        // Get comments by image ID using comment service - search for comments with this imageId
        const result = await commentService.searchComments(imageId, {
          page: parseInt(query.page || '1', 10),
          limit: parseInt(query.limit || '20', 10),
        });

        return reply.status(200).send({
          success: true,
          comments: result.comments,
          pagination: {
            page: parseInt(query.page || '1', 10),
            limit: parseInt(query.limit || '20', 10),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(query.limit || '20', 10)),
          },
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Retrieval Error',
          'Failed to retrieve image comments',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Like comment endpoint
  fastify.post(
    '/:commentId/like',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { commentId } = request.params as { commentId: string };

      try {
        // Like comment using comment service
        const comment = await commentService.likeComment(commentId, request.userId!);

        return reply.status(200).send({
          success: true,
          comment,
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Like Error',
          'Failed to like comment',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );

  // Report comment endpoint
  fastify.post(
    '/:commentId/report',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { commentId } = request.params as { commentId: string };
      const body = request.body as { reason: string };

      try {
        // Report comment using comment service
        await commentService.reportComment(
          commentId,
          request.userId!,
          { reason: body.reason } as any
        );

        return reply.status(200).send({
          success: true,
          message: 'Comment reported successfully',
        });
      } catch (error) {
        const apiError = handleError(
          500,
          'Report Error',
          'Failed to report comment',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return reply.status(500).send(apiError);
      }
    }
  );
}
