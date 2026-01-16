import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

/**
 * Swagger/OpenAPI schemas for API documentation
 */

// Common schemas
export const commonSchemas = {
  // Standard error response
  APIError: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      error: { type: 'string', example: 'Bad Request' },
      message: { type: 'string', example: 'Invalid request parameters' },
      details: { type: 'object' },
    },
  },

  // Success response wrapper
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
    },
  },

  // User profile
  UserProfile: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'User unique identifier' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      username: { type: 'string', minLength: 3, maxLength: 30, description: 'Username' },
      walletAddress: { type: 'string', description: 'Connected wallet address' },
      role: { type: 'string', enum: ['user', 'admin'], description: 'User role' },
      isActive: { type: 'boolean', description: 'Account active status' },
      emailVerified: { type: 'boolean', description: 'Email verification status' },
      createdAt: { type: 'string', format: 'date-time', description: 'Account creation date' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' },
      lastLogin: { type: 'string', format: 'date-time', description: 'Last login timestamp' },
    },
  },

  // Pagination
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20, description: 'Items per page' },
      total: { type: 'number', description: 'Total number of items' },
      totalPages: { type: 'number', description: 'Total number of pages' },
    },
  },
};

// Authentication schemas
export const authSchemas = {
  // Login request
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'User email address' },
      password: { type: 'string', minLength: 8, description: 'User password' },
    },
  },

  // Register request
  RegisterRequest: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 30, description: 'Username' },
      email: { type: 'string', format: 'email', description: 'Email address' },
      password: { type: 'string', minLength: 8, description: 'Password (min 8 characters)' },
      walletAddress: { type: 'string', description: 'Wallet address (optional)' },
    },
  },

  // Auth response with tokens
  AuthResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      user: { $ref: '#/components/schemas/UserProfile' },
      tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (15min expiry)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (7 day expiry)' },
          expiresIn: { type: 'number', description: 'Access token expiry in seconds' },
        },
      },
    },
  },

  // Refresh token request
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', description: 'Valid refresh token' },
    },
  },

  // Change password request
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', description: 'Current password' },
      newPassword: { type: 'string', minLength: 8, description: 'New password (min 8 characters)' },
    },
  },

  // Update profile request
  UpdateProfileRequest: {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 30, description: 'New username' },
      walletAddress: { type: 'string', description: 'Wallet address' },
      avatarUrl: { type: 'string', format: 'uri', description: 'Avatar image URL' },
      bio: { type: 'string', maxLength: 500, description: 'User bio' },
    },
  },

  // Reset password request
  ResetPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Email address for password reset' },
    },
  },

  // Reset password confirmation
  ResetPasswordConfirmRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string', description: 'Password reset token from email' },
      newPassword: { type: 'string', minLength: 8, description: 'New password' },
    },
  },
};

// Image schemas
export const imageSchemas = {
  // Image metadata
  ImageMetadata: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Image ID' },
      url: { type: 'string', format: 'uri', description: 'Image URL' },
      filename: { type: 'string', description: 'Original filename' },
      mimetype: { type: 'string', description: 'MIME type (image/jpeg, image/png, etc.)' },
      size: { type: 'number', description: 'File size in bytes' },
      uploadedAt: { type: 'string', format: 'date-time', description: 'Upload timestamp' },
      userId: { type: 'string', format: 'uuid', description: 'Uploader user ID' },
      tokenId: { type: 'string', description: 'Associated token ID (optional)' },
    },
  },

  // Image variant
  ImageVariant: {
    type: 'object',
    properties: {
      name: { type: 'string', enum: ['thumbnail', 'small', 'medium', 'large', 'original'] },
      width: { type: 'number', description: 'Image width in pixels' },
      height: { type: 'number', description: 'Image height in pixels' },
      format: { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif'] },
      quality: { type: 'number', minimum: 1, maximum: 100, description: 'Image quality' },
      url: { type: 'string', format: 'uri', description: 'Variant URL' },
      size: { type: 'number', description: 'Variant file size in bytes' },
    },
  },

  // Upload response
  ImageUploadResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      image: { $ref: '#/components/schemas/ImageMetadata' },
      variants: {
        type: 'array',
        items: { $ref: '#/components/schemas/ImageVariant' },
        description: 'Generated image variants',
      },
    },
  },

  // Storage stats
  StorageStats: {
    type: 'object',
    properties: {
      totalImages: { type: 'number', description: 'Total number of images' },
      totalSize: { type: 'number', description: 'Total storage used in bytes' },
      totalVariants: { type: 'number', description: 'Total number of variants' },
      tempImages: { type: 'number', description: 'Number of temporary images' },
      permanentImages: { type: 'number', description: 'Number of permanent images' },
      storageUsage: { type: 'number', description: 'Storage usage percentage' },
      storageLimit: { type: 'number', description: 'Storage limit in bytes' },
    },
  },
};

// Comment schemas
export const commentSchemas = {
  // Comment object
  Comment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Comment ID' },
      content: { type: 'string', maxLength: 1000, description: 'Comment content' },
      userId: { type: 'string', format: 'uuid', description: 'Author user ID' },
      username: { type: 'string', description: 'Author username' },
      imageId: { type: 'string', description: 'Associated image ID (optional)' },
      imageUrl: { type: 'string', format: 'uri', description: 'Associated image URL' },
      createdAt: { type: 'string', format: 'date-time', description: 'Comment timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last edit timestamp' },
    },
  },

  // Create comment request
  CreateCommentRequest: {
    type: 'object',
    required: ['tokenId', 'content'],
    properties: {
      tokenId: { type: 'string', description: 'Token ID to comment on' },
      content: { type: 'string', minLength: 1, maxLength: 1000, description: 'Comment content' },
      imageId: { type: 'string', description: 'Attach image (optional)' },
      tradeAction: {
        type: 'object',
        description: 'Trade action (optional)',
        properties: {
          type: { type: 'string', enum: ['buy', 'sell'] },
          amount: { type: 'number', minimum: 0 },
        },
      },
    },
  },
};

// Blockchain schemas
export const blockchainSchemas = {
  // Token info
  TokenInfo: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Token contract address' },
      symbol: { type: 'string', description: 'Token symbol' },
      name: { type: 'string', description: 'Token name' },
      decimals: { type: 'number', description: 'Token decimals' },
      totalSupply: { type: 'string', description: 'Total supply' },
    },
  },

  // Transaction info
  TransactionInfo: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'Transaction hash' },
      from: { type: 'string', description: 'Sender address' },
      to: { type: 'string', description: 'Recipient address' },
      value: { type: 'string', description: 'Transaction value' },
      gasUsed: { type: 'string', description: 'Gas used' },
      status: { type: 'number', enum: [0, 1], description: 'Transaction status' },
    },
  },
};

/**
 * Register Swagger documentation
 */
export async function registerSwagger(fastify: FastifyInstance) {
  const { logger } = await import('./utils/logger.js');
  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'DogePump API',
        description: `
          DogePump Dogechain Memecoin Launcher API Documentation

          ## Overview
          DogePump is a decentralized exchange (DEX) and token launchpad built on Dogechain.
          This API provides endpoints for token management, user authentication, trading,
          liquidity provision, and social features.

          ## Authentication
          Most endpoints require JWT authentication. Include the access token in the
          Authorization header:

          \`\`\`
          Authorization: Bearer <access_token>
          \`\`\`

          ## Rate Limiting
          - Global: 100 requests per minute
          - Auth endpoints: 5 attempts per 15 minutes
          - WebSocket: 10 concurrent connections per user

          ## CSRF Protection
          State-changing endpoints (POST, PUT, DELETE, PATCH) require a CSRF token:

          \`\`\`
          x-csrf-token: <csrf_token>
          \`\`\`

          Get a CSRF token: \`GET /api/auth/csrf-token\`

          ## Error Handling
          All errors follow this format:

          \`\`\`json
          {
            "statusCode": 400,
            "error": "Error Type",
            "message": "Human-readable error message",
            "details": {}
          }
          \`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'DogePump Team',
          email: 'support@dogepump.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
        {
          url: 'https://api.dogepump.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Authentication', description: 'User authentication and authorization' },
        { name: 'Images', description: 'Image upload and management' },
        { name: 'Comments', description: 'Token comments and social features' },
        { name: 'Blockchain', description: 'Blockchain interactions and data' },
        { name: 'Moderation', description: 'Content moderation (admin only)' },
        { name: 'Reports', description: 'User reports (admin only)' },
        { name: 'Health', description: 'Health check endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT access token',
          },
          csrfAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-csrf-token',
            description: 'CSRF token for state-changing operations',
          },
        },
        schemas: {
          ...commonSchemas,
          ...authSchemas,
          ...imageSchemas,
          ...commentSchemas,
          ...blockchainSchemas,
        },
      },
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: false, // Disable built-in CSP to avoid conflicts
  });

  // Note: Security schemes are automatically documented by @fastify/swagger
  // Route-level security should be added to individual route schemas if needed
  logger.info('Swagger documentation registered at /docs');
}
