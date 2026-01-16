import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimitPlugin } from './middleware/rateLimit.js';
import { getSecurityHeaders } from './utils/securityUtils.js';
import imageRoutes from './routes/images.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import healthRoutes from './routes/health.js';
import reputationRoutes from './routes/reputation.js';
import karmaRoutes from './routes/karma.js';
import stakeRoutes from './routes/stake.js';
import sitemapRoutes from './routes/sitemap.js';
import { moderationRoutes } from './routes/moderation.js';
import { reportsRoutes } from './routes/reports.js';
import blockchainRoutes from './routes/blockchain.js';
import { logger } from './utils/logger.js';
import { closePool } from './database/db.js';
import { sentryService } from './services/sentryService.js';
import { registerSwagger } from './swagger.js';

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
});

// Register CORS
fastify.register(cors, {
  origin: config.CORS_ORIGIN,
  credentials: true,
});

// Register helmet for security headers
// Disable CSP in development to allow Vite HMR, React Fast Refresh, and external CDNs
const isDevelopment = process.env.NODE_ENV !== 'production';
fastify.register(helmet, {
  contentSecurityPolicy: !isDevelopment && config.SECURITY.CSP_ENABLED ? {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", "blob:", "data:", "https://esm.sh", "https://aistudiocdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:", "https://picsum.photos", "https://dogepump.com"],
      connectSrc: ["'self'", "blob:", "data:", "https://esm.sh", "https://aistudiocdn.com", "https://fonts.googleapis.com", "https://dogepump.com"],
      mediaSrc: ["'self'", "blob:", "data:", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      manifestSrc: ["'self'"],
      prefetchSrc: ["'self'", "https://esm.sh", "https://aistudiocdn.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' },
});

// Add custom security headers
fastify.addHook('onSend', async (request, reply) => {
  if (config.SECURITY.SECURITY_HEADERS_ENABLED) {
    const headers = getSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
      if (!reply.getHeader(key)) {
        reply.header(key, value);
      }
    }
  }
});

// Register multipart for file uploads
fastify.register(multipart, {
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 1,
  },
});

// Register rate limiting
fastify.register(rateLimitPlugin);

// Register Swagger documentation
await registerSwagger(fastify);

// Register routes
fastify.register(imageRoutes, { prefix: '/api/images' });
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(commentRoutes, { prefix: '/api/comments' });
fastify.register(reputationRoutes, { prefix: '/api/reputation' });
fastify.register(karmaRoutes, { prefix: '/api/karma' });
fastify.register(stakeRoutes, { prefix: '/api/stake' });
fastify.register(moderationRoutes, { prefix: '/api/moderation' });
fastify.register(reportsRoutes, { prefix: '/api/reports' });
fastify.register(blockchainRoutes, { prefix: '/api/blockchain' });
fastify.register(healthRoutes);

// Global error handler
fastify.setErrorHandler(errorHandler);

// Start server
const start = async () => {
  try {
    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    });
    logger.info(`🚀 Server running at ${address}`);
    logger.info(`📝 Environment: ${config.NODE_ENV}`);
    logger.info(`🔒 Security headers: ${config.SECURITY.SECURITY_HEADERS_ENABLED ? 'enabled' : 'disabled'}`);
    logger.info(`🛡️ CSP: ${!isDevelopment && config.SECURITY.CSP_ENABLED ? 'enabled' : 'disabled (development mode)'}`);
    logger.info(`🔍 Malware detection: ${config.SECURITY.ENABLE_MALWARE_DETECTION ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 XSS detection: ${config.SECURITY.ENABLE_XSS_DETECTION ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Magic number validation: ${config.SECURITY.ENABLE_MAGIC_NUMBER_VALIDATION ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 File signature validation: ${config.SECURITY.VALIDATE_FILE_SIGNATURE ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Content type validation: ${config.SECURITY.VALIDATE_CONTENT_TYPE ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Dimension validation: ${config.SECURITY.VALIDATE_DIMENSIONS ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Aspect ratio validation: ${config.SECURITY.VALIDATE_ASPECT_RATIO ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Input sanitization: ${config.SECURITY.SANITIZE_INPUTS ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Filename sanitization: ${config.SECURITY.SANITIZE_FILENAMES ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 URL param sanitization: ${config.SECURITY.SANITIZE_URL_PARAMS ? 'enabled' : 'disabled'}`);
    logger.info(`🔍 Audit logging: ${config.SECURITY.ENABLE_AUDIT_LOGGING ? 'enabled' : 'disabled'}`);
    logger.info(`💾 Database: PostgreSQL connected`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close database connections
  await closePool();
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
