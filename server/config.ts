import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database
  DATABASE_URL: (() => {
    const url = process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !url) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }
    
    // Parse connection string and explicitly set database name
    const connectionString = url || 'postgresql://localhost:5432/dogepump_dev';
    const urlObj = new URL(connectionString);
    
    // Explicitly set database name to override PGDATABASE
    if (urlObj.pathname) {
      const dbName = urlObj.pathname.split('/').pop();
      process.env.PGDATABASE = dbName;
    }
    
    return connectionString;
  })(),

  // CORS
  // Support multiple origins for development (ports 3000-3010, 5173)
  CORS_ORIGIN: process.env.CORS_ORIGIN || (() => {
    // Dynamic CORS configuration for development
    if (process.env.NODE_ENV === 'production') {
      return process.env.FRONTEND_URL || 'https://yourdomain.com';
    }

    // Development: Allow common Vite ports
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://localhost:3009',
      'http://localhost:3010',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.2.43:3007', // Network IP
    ];

    // Return comma-separated list for Express CORS middleware
    return allowedOrigins.join(',');
  })(),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // Image Processing
  IMAGE: {
    // Quality settings (0-100)
    QUALITY: {
      HIGH: parseInt(process.env.IMAGE_QUALITY_HIGH || '90', 10),
      MEDIUM: parseInt(process.env.IMAGE_QUALITY_MEDIUM || '75', 10),
      LOW: parseInt(process.env.IMAGE_QUALITY_LOW || '60', 10),
    },
    // Size variants (in pixels)
    SIZES: {
      THUMBNAIL: parseInt(process.env.IMAGE_SIZE_THUMBNAIL || '150', 10),
      SMALL: parseInt(process.env.IMAGE_SIZE_SMALL || '300', 10),
      MEDIUM: parseInt(process.env.IMAGE_SIZE_MEDIUM || '500', 10),
      LARGE: parseInt(process.env.IMAGE_SIZE_LARGE || '1200', 10),
      EXTRA_LARGE: parseInt(process.env.IMAGE_SIZE_EXTRA_LARGE || '1920', 10),
    },
    // Allowed formats
    ALLOWED_FORMATS: (process.env.IMAGE_ALLOWED_FORMATS || 'jpeg,png,webp,avif').split(',') as Array<'jpeg' | 'png' | 'webp' | 'avif'>,
    // Default format
    DEFAULT_FORMAT: (process.env.IMAGE_DEFAULT_FORMAT || 'webp') as 'jpeg' | 'png' | 'webp' | 'avif',
    // Maximum dimensions
    MAX_WIDTH: parseInt(process.env.IMAGE_MAX_WIDTH || '4096', 10),
    MAX_HEIGHT: parseInt(process.env.IMAGE_MAX_HEIGHT || '4096', 10),
    // Minimum dimensions
    MIN_WIDTH: parseInt(process.env.IMAGE_MIN_WIDTH || '32', 10),
    MIN_HEIGHT: parseInt(process.env.IMAGE_MIN_HEIGHT || '32', 10),
    // Progressive loading
    PROGRESSIVE: process.env.IMAGE_PROGRESSIVE === 'true',
    // Strip metadata by default
    STRIP_METADATA: process.env.IMAGE_STRIP_METADATA !== 'false',
    // Background color for transparent images (hex)
    BACKGROUND_COLOR: process.env.IMAGE_BACKGROUND_COLOR || '#ffffff',
  },

  // JWT
  JWT_SECRET: (() => {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (secret === 'your-secret-key-change-in-production' || !secret || secret.length < 32)) {
      throw new Error('JWT_SECRET must be set to a secure random value (at least 32 characters) in production!');
    }
    return secret;
  })(),
  JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  JWT_REFRESH_SECRET: (() => {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (secret === 'your-refresh-secret-key-change-in-production' || !secret || secret.length < 32)) {
      throw new Error('JWT_REFRESH_SECRET must be set to a secure random value (at least 32 characters) in production!');
    }
    return secret;
  })(),
  
  // Authentication
  AUTH: {
    // Password requirements
    PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    PASSWORD_REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    PASSWORD_REQUIRE_LOWERCASE: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    PASSWORD_REQUIRE_NUMBER: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
    PASSWORD_REQUIRE_SPECIAL: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
    PASSWORD_SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    
    // Username requirements
    USERNAME_MIN_LENGTH: parseInt(process.env.USERNAME_MIN_LENGTH || '3', 10),
    USERNAME_MAX_LENGTH: parseInt(process.env.USERNAME_MAX_LENGTH || '20', 10),
    USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/,
    
    // Token management
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    MAX_SESSIONS_PER_USER: parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10),
    SESSION_CLEANUP_INTERVAL: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000', 10), // 1 hour
    
    // Rate limiting for auth endpoints
    AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || '5', 10),
  },

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Redis (optional - falls back to in-memory cache if not configured)
  REDIS_URL: process.env.REDIS_URL || '',

  // Storage Configuration
  STORAGE: {
    // Storage backend: 'local', 's3', or 'minio'
    BACKEND: (process.env.STORAGE_BACKEND || 'local') as 'local' | 's3' | 'minio',
    // Base directory for local storage
    BASE_PATH: process.env.STORAGE_BASE_PATH || './uploads',
    // Maximum storage size in bytes (default: 10GB)
    MAX_STORAGE_SIZE: parseInt(process.env.STORAGE_MAX_SIZE || '10737418240', 10),
    // Time-to-live for temporary files in milliseconds (default: 24 hours)
    TEMP_FILE_TTL: parseInt(process.env.STORAGE_TEMP_TTL || '86400000', 10),
    // Enable file deduplication
    ENABLE_DEDUPLICATION: process.env.STORAGE_ENABLE_DEDUPLICATION !== 'false',
    // Cleanup interval in milliseconds (default: 1 hour)
    CLEANUP_INTERVAL: parseInt(process.env.STORAGE_CLEANUP_INTERVAL || '3600000', 10),
    // Maximum file size for storage (default: 50MB)
    MAX_FILE_SIZE: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '52428800', 10),
    // Allowed file types for storage
    ALLOWED_TYPES: (process.env.STORAGE_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp,image/avif').split(','),
    // Directory structure template
    DIR_STRUCTURE: {
      TEMP: 'temp',
      PERMANENT: 'permanent',
      VARIANTS: 'variants',
    },
  },

  // Security Configuration
  SECURITY: {
    // File size limits per format (in bytes)
    FILE_SIZE_LIMITS: {
      'image/jpeg': parseInt(process.env.SECURITY_JPEG_MAX_SIZE || '10485760', 10), // 10MB
      'image/png': parseInt(process.env.SECURITY_PNG_MAX_SIZE || '10485760', 10), // 10MB
      'image/gif': parseInt(process.env.SECURITY_GIF_MAX_SIZE || '5242880', 10), // 5MB
      'image/webp': parseInt(process.env.SECURITY_WEBP_MAX_SIZE || '10485760', 10), // 10MB
      'image/avif': parseInt(process.env.SECURITY_AVIF_MAX_SIZE || '20971520', 10), // 20MB
    },
    // Maximum file size (fallback)
    MAX_FILE_SIZE: parseInt(process.env.SECURITY_MAX_FILE_SIZE || '10485760', 10), // 10MB
    // Allowed file formats
    ALLOWED_FORMATS: (process.env.SECURITY_ALLOWED_FORMATS || 'image/jpeg,image/png,image/gif,image/webp,image/avif').split(','),
    // Dimension limits
    MAX_WIDTH: parseInt(process.env.SECURITY_MAX_WIDTH || '4096', 10),
    MAX_HEIGHT: parseInt(process.env.SECURITY_MAX_HEIGHT || '4096', 10),
    MIN_WIDTH: parseInt(process.env.SECURITY_MIN_WIDTH || '32', 10),
    MIN_HEIGHT: parseInt(process.env.SECURITY_MIN_HEIGHT || '32', 10),
    // Aspect ratio limits
    MIN_ASPECT_RATIO: parseFloat(process.env.SECURITY_MIN_ASPECT_RATIO || '0.1'),
    MAX_ASPECT_RATIO: parseFloat(process.env.SECURITY_MAX_ASPECT_RATIO || '10'),
    // Security features
    ENABLE_MALWARE_DETECTION: process.env.SECURITY_ENABLE_MALWARE_DETECTION !== 'false',
    ENABLE_XSS_DETECTION: process.env.SECURITY_ENABLE_XSS_DETECTION !== 'false',
    ENABLE_EXIF_VALIDATION: process.env.SECURITY_ENABLE_EXIF_VALIDATION !== 'false',
    ENABLE_MAGIC_NUMBER_VALIDATION: process.env.SECURITY_ENABLE_MAGIC_NUMBER_VALIDATION !== 'false',
    STRIP_METADATA: process.env.SECURITY_STRIP_METADATA !== 'false',
    // Content Security Policy
    CSP_ENABLED: process.env.SECURITY_CSP_ENABLED !== 'false',
    CSP_DIRECTIVES: process.env.SECURITY_CSP_DIRECTIVES || "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    // Security headers
    SECURITY_HEADERS_ENABLED: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    // Rate limiting for security events
    SECURITY_RATE_LIMIT_WINDOW_MS: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    SECURITY_RATE_LIMIT_MAX_ATTEMPTS: parseInt(process.env.SECURITY_RATE_LIMIT_MAX_ATTEMPTS || '10', 10),
    // Audit logging
    ENABLE_AUDIT_LOGGING: process.env.SECURITY_ENABLE_AUDIT_LOGGING !== 'false',
    AUDIT_LOG_RETENTION_DAYS: parseInt(process.env.SECURITY_AUDIT_LOG_RETENTION_DAYS || '30', 10),
    // File validation
    VALIDATE_FILE_SIGNATURE: process.env.SECURITY_VALIDATE_FILE_SIGNATURE !== 'false',
    VALIDATE_CONTENT_TYPE: process.env.SECURITY_VALIDATE_CONTENT_TYPE !== 'false',
    VALIDATE_DIMENSIONS: process.env.SECURITY_VALIDATE_DIMENSIONS !== 'false',
    VALIDATE_ASPECT_RATIO: process.env.SECURITY_VALIDATE_ASPECT_RATIO !== 'false',
    // Input sanitization
    SANITIZE_INPUTS: process.env.SECURITY_SANITIZE_INPUTS !== 'false',
    SANITIZE_FILENAMES: process.env.SECURITY_SANITIZE_FILENAMES !== 'false',
    SANITIZE_URL_PARAMS: process.env.SECURITY_SANITIZE_URL_PARAMS !== 'false',
  },

  // S3/MinIO Configuration (for future use)
  S3: {
    ENDPOINT: process.env.S3_ENDPOINT || '',
    REGION: process.env.S3_REGION || 'us-east-1',
    ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
    SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
    BUCKET: process.env.S3_BUCKET || '',
    USE_SSL: process.env.S3_USE_SSL !== 'false',
  },

  // Sentry Error Tracking (optional)
  SENTRY: {
    DSN: process.env.SENTRY_DSN || '',
    TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
    PROFILES_SAMPLE_RATE: process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1',
  },
} as const;

export default config;
