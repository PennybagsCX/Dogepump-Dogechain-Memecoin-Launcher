# Image Upload System Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Integrated Features](#integrated-features)
6. [Security](#security)
7. [Setup Instructions](#setup-instructions)
8. [API Documentation](#api-documentation)
9. [Configuration](#configuration)
10. [Deployment Guide](#deployment-guide)
11. [Best Practices](#best-practices)

---

## System Overview

The Image Upload System is a comprehensive, production-ready solution for handling image uploads with advanced security features, image processing capabilities, and flexible storage options. The system is designed to be secure, scalable, and easy to maintain.

### Key Capabilities

- **Multi-format Support**: JPEG, PNG, WebP, AVIF, GIF
- **Image Processing**: Resizing, compression, format conversion, metadata stripping
- **Multiple Variants**: Automatic generation of thumbnail, small, medium, large, and extra-large versions
- **Security First**: Magic number validation, malware detection, XSS prevention, EXIF sanitization
- **Flexible Storage**: Local filesystem with S3/MinIO compatibility
- **Deduplication**: Content-based deduplication to save storage space
- **Automatic Cleanup**: Scheduled cleanup of temporary files
- **Comprehensive Logging**: Detailed audit logs for all operations
- **Integrated Features**: Seamless integration with platform features
  - **Profile Avatar Upload**: User profile picture management
  - **Token Logo Upload**: Memecoin token logo management
  - **Comment Image Upload**: Image attachments in comments

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                        │
│                    (React Frontend)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Profile    │  │   Token      │  │   Comments   │   │
│  │   Avatar     │  │   Logo       │  │   Images     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Fastify Server                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Middleware Layer                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Auth       │  │ Rate Limit   │  │   Upload     │   │  │
│  │  │ Middleware   │  │ Middleware   │  │ Middleware   │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Route Handlers                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ /auth/me     │  │ /tokens      │  │ /comments     │   │  │
│  │  │ (Profile)    │  │ (Logo)       │  │ (Images)     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  /upload     │  │  /:imageId   │  │  /validate   │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Security Service                        │  │
│  │  • File Signature Validation                             │  │
│  │  • Malware Detection                                     │  │
│  │  • XSS Prevention                                        │  │
│  │  • EXIF Data Handling                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Image Service                           │  │
│  │  • Image Processing (Sharp)                              │  │
│  │  • Variant Generation                                    │  │
│  │  • Format Conversion                                    │  │
│  │  • Compression                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Storage Service                         │  │
│  │  • File Storage (Local/S3/MinIO)                         │  │
│  │  • Deduplication                                        │  │
│  │  • Cleanup Management                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Local Filesystem                         │  │
│  │  ./uploads/temp/                                          │  │
│  │  ./uploads/permanent/                                     │  │
│  │  ./uploads/avatars/                                       │  │
│  │  ./uploads/tokens/                                       │  │
│  │  ./uploads/comments/                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Cloud Storage (Optional)                 │  │
│  │  • Amazon S3                                             │  │
│  │  • MinIO                                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Integration Flow                      │
└─────────────────────────────────────────────────────────────────┘

Profile Avatar Upload Flow:
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───▶│  Auth Route  │───▶│  Image      │───▶│ Storage  │
│  Upload  │    │  /auth/me    │    │  Service    │    │ Service  │
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
                      │                   │
                      ▼                   ▼
                 ┌──────────────┐    ┌──────────────┐
                 │  User        │    │  Variants   │
                 │  Profile     │    │  Generated  │
                 └──────────────┘    └──────────────┘

Token Logo Upload Flow:
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───▶│  Token      │───▶│  Image      │───▶│ Storage  │
│  Upload  │    │  Route      │    │  Service    │    │ Service  │
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
                      │                   │
                      ▼                   ▼
                 ┌──────────────┐    ┌──────────────┐
                 │  Token       │    │  Variants   │
                 │  Metadata   │    │  Generated  │
                 └──────────────┘    └──────────────┘

Comment Image Upload Flow:
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───▶│  Comment    │───▶│  Image      │───▶│ Storage  │
│  Upload  │    │  Route      │    │  Service    │    │ Service  │
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
                      │                   │
                      ▼                   ▼
                 ┌──────────────┐    ┌──────────────┐
                 │  Comment     │    │  Variants   │
                 │  Created    │    │  Generated  │
                 └──────────────┘    └──────────────┘
```

### Component Overview

#### 1. Middleware Layer

- **Auth Middleware**: JWT-based authentication and authorization
- **Rate Limit Middleware**: Request throttling to prevent abuse
- **Upload Middleware**: File handling with comprehensive validation

#### 2. Route Handlers

- **POST /api/images/upload**: Upload and process images
- **GET /api/images/:imageId**: Retrieve images by ID
- **DELETE /api/images/:imageId**: Delete images (not yet implemented)
- **GET /api/images**: List user's images (not yet implemented)
- **POST /api/images/validate**: Validate images without uploading
- **GET /api/images/:imageId/metadata**: Get image metadata (not yet implemented)

#### 3. Service Layer

- **Security Service**: Comprehensive security validations
- **Image Service**: Image processing using Sharp
- **Storage Service**: File storage and management

#### 4. Storage Layer

- **Local Filesystem**: Default storage backend
- **Cloud Storage**: S3/MinIO compatible (optional)

---

## Tech Stack

### Backend

- **Node.js**: Runtime environment
- **TypeScript**: Type-safe JavaScript
- **Fastify**: High-performance web framework
- **Sharp**: High-performance image processing

### Security

- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Magic Number Detection**: File signature validation
- **Content Security Policy**: XSS prevention

### Storage

- **Local Filesystem**: Default storage
- **S3/MinIO**: Optional cloud storage (future)

### Development

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **dotenv**: Environment configuration

---

## Features

### 1. Image Upload & Processing

#### Supported Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- AVIF (`.avif`)
- GIF (`.gif`)

#### Processing Capabilities

- **Automatic Resizing**: Generate multiple size variants
  - Thumbnail: 150x150px
  - Small: 300x300px
  - Medium: 500x500px
  - Large: 1200x1200px
  - Extra Large: 1920x1920px

- **Quality Control**: Adjustable compression levels
  - High: 90%
  - Medium: 75%
  - Low: 60%

- **Format Conversion**: Convert between supported formats
- **Progressive Loading**: Enable progressive JPEG/PNG
- **Metadata Stripping**: Remove EXIF data for privacy

### 2. Security Features

#### File Validation

- **Magic Number Detection**: Verify file signatures
- **MIME Type Validation**: Ensure content matches declared type
- **File Size Limits**: Enforce maximum file sizes
- **Dimension Validation**: Check image dimensions
- **Aspect Ratio Validation**: Enforce reasonable aspect ratios

#### Security Checks

- **Malware Detection**: Basic pattern-based detection
- **XSS Prevention**: Sanitize content to prevent attacks
- **EXIF Validation**: Check for suspicious metadata
- **Path Traversal Prevention**: Sanitize filenames
- **Input Sanitization**: Clean all user inputs

#### Authentication & Authorization

- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: User and admin roles
- **Permission System**: Granular permissions for operations
- **Rate Limiting**: Prevent brute force attacks
- **Session Management**: Track and manage user sessions

### 3. Storage Management

#### Storage Options

- **Local Filesystem**: Default, easy to set up
- **S3/MinIO**: Cloud storage ready (future)

#### Storage Features

- **Deduplication**: Content-based deduplication
- **Temporary Storage**: TTL-based cleanup
- **Automatic Cleanup**: Scheduled cleanup of old files
- **Storage Statistics**: Track usage and limits
- **Batch Operations**: Efficient batch processing

### 4. Monitoring & Logging

#### Comprehensive Logging

- **Request Logging**: Log all incoming requests
- **Security Events**: Track security-related events
- **Error Logging**: Detailed error information
- **Audit Logs**: Track all operations
- **Performance Metrics**: Monitor system performance

---

## Integrated Features

The Image Upload System is seamlessly integrated with various platform features to provide a cohesive user experience.

### 1. Profile Avatar Upload

Users can upload and manage their profile avatars through the authentication system.

#### Implementation

The profile avatar upload is integrated via the [`PATCH /auth/me`](./API_REFERENCE.md#update-profile) endpoint in [`server/routes/auth.ts`](./routes/auth.ts:313).

#### Features

- **Avatar Storage**: Profile images are stored permanently with user association
- **Automatic Processing**: Images are automatically resized and optimized
- **Variant Generation**: Multiple sizes for different UI contexts
- **Security**: All standard security validations apply
- **User Control**: Users can update their avatar at any time

#### Usage Example

```typescript
// Update user profile with avatar
const formData = new FormData();
formData.append('avatar', avatarFile);
formData.append('username', 'newusername');

fetch('http://localhost:3001/api/auth/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
  .then(response => response.json())
  .then(data => {
    console.log('Profile updated:', data.user);
  });
```

#### API Endpoint

**PATCH** `/api/auth/me`

**Request Body:**
- `avatar` (optional): Image file for profile avatar
- `username` (optional): New username
- `walletAddress` (optional): Wallet address

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "username": "newusername",
    "avatarUrl": "/api/images/img_avatar_abc123",
    "role": "user",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Token Logo Upload

Memecoin creators can upload logos for their tokens during token creation or management.

#### Implementation

Token logo upload is integrated through the token management system, utilizing the same image upload infrastructure.

#### Features

- **Token Association**: Logos are linked to specific tokens
- **Brand Identity**: Consistent branding across the platform
- **Multiple Formats**: Support for various image formats
- **Optimization**: Automatic resizing for optimal display
- **Variant Support**: Different sizes for cards, lists, and detail views

#### Usage Example

```typescript
// Upload token logo
const formData = new FormData();
formData.append('logo', logoFile);
formData.append('name', 'MyToken');
formData.append('symbol', 'MTK');
formData.append('description', 'My awesome token');

fetch('http://localhost:3001/api/tokens', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
  .then(response => response.json())
  .then(data => {
    console.log('Token created with logo:', data.token);
  });
```

#### API Endpoint

**POST** `/api/tokens`

**Request Body:**
- `logo` (optional): Image file for token logo
- `name` (required): Token name
- `symbol` (required): Token symbol
- `description` (optional): Token description

**Response:**
```json
{
  "success": true,
  "token": {
    "id": "token_abc123",
    "name": "MyToken",
    "symbol": "MTK",
    "logoUrl": "/api/images/img_token_abc123",
    "logoVariants": {
      "thumbnail": "/api/images/img_token_abc123?variant=thumbnail",
      "small": "/api/images/img_token_abc123?variant=small",
      "medium": "/api/images/img_token_abc123?variant=medium"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Comment Image Upload

Users can attach images to their comments, enabling rich discussions and visual sharing.

#### Implementation

Comment image upload is integrated via the [`POST /comments/with-image`](./API_REFERENCE.md#create-comment-with-image) endpoint in [`server/routes/comments.ts`](./routes/comments.ts:91).

#### Features

- **Seamless Integration**: Upload image and comment in single request
- **Automatic Processing**: Images are processed and optimized
- **Variant Generation**: Multiple sizes for different display contexts
- **Security**: Full security validation on all uploads
- **Content Association**: Images are linked to specific comments

#### Usage Example

```typescript
// Create comment with image
const formData = new FormData();
formData.append('content', 'Check out this image!');
formData.append('image', imageFile);

fetch('http://localhost:3001/api/comments/with-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
  .then(response => response.json())
  .then(data => {
    console.log('Comment created:', data.comment);
    console.log('Image:', data.image);
  });
```

#### API Endpoint

**POST** `/api/comments/with-image`

**Request Body:**
- `content` (required): Comment text
- `image` (required): Image file to attach

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment_abc123",
    "content": "Check out this image!",
    "userId": "user_abc123",
    "username": "username",
    "imageId": "img_abc123def456",
    "imageUrl": "/api/images/img_abc123def456",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "image": {
    "id": "img_abc123def456",
    "url": "/api/images/img_abc123def456",
    "filename": "image_1234567890_abc123.jpg"
  }
}
```

---

### Integration Benefits

#### Unified Architecture

All integrated features share the same underlying image upload infrastructure, ensuring:

- **Consistent Security**: Same validation and security checks across all uploads
- **Optimized Storage**: Content-based deduplication across all image types
- **Automatic Processing**: Uniform image processing and variant generation
- **Centralized Management**: Single point of control for image configuration

#### Developer Experience

- **Simple API**: Consistent endpoint patterns for all features
- **Type Safety**: Full TypeScript support with proper type definitions
- **Error Handling**: Unified error responses and validation
- **Documentation**: Comprehensive API documentation for all endpoints

#### User Experience

- **Fast Uploads**: Optimized upload process with progress tracking
- **Instant Preview**: Immediate availability of uploaded images
- **Responsive Images**: Automatic serving of appropriate image sizes
- **Secure Storage**: All images protected with authentication

---

## Security

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Network Layer                                               │
│     • HTTPS/TLS encryption                                      │
│     • CORS configuration                                       │
│     • Security headers                                         │
├─────────────────────────────────────────────────────────────────┤
│  2. Authentication Layer                                       │
│     • JWT tokens                                                │
│     • Refresh tokens                                           │
│     • Session management                                       │
├─────────────────────────────────────────────────────────────────┤
│  3. Authorization Layer                                        │
│     • Role-based access control                                │
│     • Permission system                                        │
│     • Ownership validation                                     │
├─────────────────────────────────────────────────────────────────┤
│  4. Input Validation Layer                                     │
│     • File signature validation                                 │
│     • MIME type validation                                     │
│     • File size validation                                     │
│     • Dimension validation                                     │
├─────────────────────────────────────────────────────────────────┤
│  5. Content Security Layer                                     │
│     • Malware detection                                        │
│     • XSS prevention                                           │
│     • EXIF sanitization                                        │
│     • Path traversal prevention                                │
├─────────────────────────────────────────────────────────────────┤
│  6. Rate Limiting Layer                                        │
│     • Request throttling                                       │
│     • IP-based limits                                          │
│     • User-based limits                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Security Features

#### 1. File Signature Validation

The system validates file signatures (magic numbers) to ensure uploaded files match their declared MIME types:

```typescript
// Example: JPEG file signature
const JPEG_SIGNATURE = Buffer.from([0xFF, 0xD8, 0xFF]);
```

#### 2. Malware Detection

Basic pattern-based detection for suspicious content:
- Embedded scripts
- Executable code patterns
- Suspicious file structures

#### 3. XSS Prevention

Content sanitization to prevent XSS attacks:
- HTML entity encoding
- Script tag detection
- JavaScript pattern detection

#### 4. EXIF Data Handling

- **Validation**: Check for suspicious EXIF data
- **Stripping**: Remove EXIF data for privacy
- **Logging**: Track EXIF data in audit logs

#### 5. Rate Limiting

- **Global Rate Limit**: 100 requests per minute
- **Auth Rate Limit**: 5 attempts per 15 minutes
- **Security Rate Limit**: 10 security events per 15 minutes

### Security Best Practices

1. **Always use HTTPS** in production
2. **Keep JWT secrets secure** and rotate them regularly
3. **Enable all security validations** in production
4. **Monitor security events** and set up alerts
5. **Regular security audits** of the codebase
6. **Keep dependencies updated**
7. **Use strong password policies**
8. **Implement proper error handling** (don't leak sensitive info)

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- TypeScript 5+
- 2GB+ RAM
- 10GB+ storage space

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dogepump-dogechain-memecoin-launcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create upload directories**
   ```bash
   mkdir -p uploads/temp
   mkdir -p uploads/permanent
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Environment Configuration

See [Configuration](#configuration) section for detailed configuration options.

---

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### 1. Upload Image

**POST** `/images/upload`

Upload and process an image.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: Image file (required)

**Response (201 Created):**
```json
{
  "success": true,
  "image": {
    "id": "img_abc123",
    "url": "/api/images/img_abc123",
    "filename": "image_1234567890_abc123.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

#### 2. Get Image

**GET** `/images/:imageId`

Retrieve an image by ID.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `variant`: Image variant to retrieve (optional, default: `original`)
  - Options: `original`, `thumbnail`, `small`, `medium`, `large`, `xlarge`

**Response (200 OK):**
- Returns the image binary data with appropriate Content-Type header

**Error Responses:**
- `400 Bad Request`: Invalid image ID format
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:3001/api/images/img_abc123?variant=thumbnail \
  -H "Authorization: Bearer <token>" \
  --output thumbnail.jpg
```

#### 3. Validate Image

**POST** `/images/validate`

Validate an image without uploading it.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: Image file (required)

**Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "details": {
    "size": 1024000,
    "format": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080,
      "aspectRatio": 1.78
    },
    "mimetype": "image/jpeg",
    "extension": "jpg",
    "checksum": "abc123def456..."
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/images/validate \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

#### 4. Delete Image (Not Implemented)

**DELETE** `/images/:imageId`

Delete an image and all its variants.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (501 Not Implemented):**
```json
{
  "statusCode": 501,
  "error": "Not Implemented",
  "message": "Image deletion not yet implemented"
}
```

#### 5. List Images (Not Implemented)

**GET** `/images`

List user's images with pagination.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-100, default: 20)
- `sortBy`: Sort field (createdAt, updatedAt, name, size)
- `sortOrder`: Sort order (asc, desc)

**Response (501 Not Implemented):**
```json
{
  "statusCode": 501,
  "error": "Not Implemented",
  "message": "Image listing not yet implemented"
}
```

#### 6. Get Image Metadata (Not Implemented)

**GET** `/images/:imageId/metadata`

Get detailed metadata for an image.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (501 Not Implemented):**
```json
{
  "statusCode": 501,
  "error": "Not Implemented",
  "message": "Image metadata retrieval not yet implemented"
}
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads

# Image Processing
IMAGE_QUALITY_HIGH=90
IMAGE_QUALITY_MEDIUM=75
IMAGE_QUALITY_LOW=60
IMAGE_SIZE_THUMBNAIL=150
IMAGE_SIZE_SMALL=300
IMAGE_SIZE_MEDIUM=500
IMAGE_SIZE_LARGE=1200
IMAGE_SIZE_EXTRA_LARGE=1920
IMAGE_ALLOWED_FORMATS=jpeg,png,webp,avif
IMAGE_DEFAULT_FORMAT=webp
IMAGE_MAX_WIDTH=4096
IMAGE_MAX_HEIGHT=4096
IMAGE_MIN_WIDTH=32
IMAGE_MIN_HEIGHT=32
IMAGE_PROGRESSIVE=true
IMAGE_STRIP_METADATA=true
IMAGE_BACKGROUND_COLOR=#ffffff

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Authentication
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false
USERNAME_MIN_LENGTH=3
USERNAME_MAX_LENGTH=20
BCRYPT_ROUNDS=10
MAX_SESSIONS_PER_USER=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Storage Configuration
STORAGE_BACKEND=local
STORAGE_BASE_PATH=./uploads
STORAGE_MAX_SIZE=10737418240
STORAGE_TEMP_TTL=86400000
STORAGE_ENABLE_DEDUPLICATION=true
STORAGE_CLEANUP_INTERVAL=3600000
STORAGE_MAX_FILE_SIZE=52428800
STORAGE_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/avif

# Security Configuration
SECURITY_JPEG_MAX_SIZE=10485760
SECURITY_PNG_MAX_SIZE=10485760
SECURITY_GIF_MAX_SIZE=5242880
SECURITY_WEBP_MAX_SIZE=10485760
SECURITY_AVIF_MAX_SIZE=20971520
SECURITY_MAX_FILE_SIZE=10485760
SECURITY_MAX_WIDTH=4096
SECURITY_MAX_HEIGHT=4096
SECURITY_MIN_WIDTH=32
SECURITY_MIN_HEIGHT=32
SECURITY_MIN_ASPECT_RATIO=0.1
SECURITY_MAX_ASPECT_RATIO=10
SECURITY_ENABLE_MALWARE_DETECTION=true
SECURITY_ENABLE_XSS_DETECTION=true
SECURITY_ENABLE_EXIF_VALIDATION=true
SECURITY_ENABLE_MAGIC_NUMBER_VALIDATION=true
SECURITY_STRIP_METADATA=true
SECURITY_CSP_ENABLED=true
SECURITY_HEADERS_ENABLED=true
SECURITY_ENABLE_AUDIT_LOGGING=true
SECURITY_AUDIT_LOG_RETENTION_DAYS=30
SECURITY_VALIDATE_FILE_SIGNATURE=true
SECURITY_VALIDATE_CONTENT_TYPE=true
SECURITY_VALIDATE_DIMENSIONS=true
SECURITY_VALIDATE_ASPECT_RATIO=true
SECURITY_SANITIZE_INPUTS=true
SECURITY_SANITIZE_FILENAMES=true
SECURITY_SANITIZE_URL_PARAMS=true

# S3/MinIO Configuration (Optional)
S3_ENDPOINT=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_USE_SSL=true
```

### Configuration Categories

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment (development/production) |
| `PORT` | `3001` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `LOG_LEVEL` | `info` | Logging level |

#### Image Processing

| Variable | Default | Description |
|----------|---------|-------------|
| `IMAGE_QUALITY_HIGH` | `90` | High quality percentage |
| `IMAGE_QUALITY_MEDIUM` | `75` | Medium quality percentage |
| `IMAGE_QUALITY_LOW` | `60` | Low quality percentage |
| `IMAGE_SIZE_THUMBNAIL` | `150` | Thumbnail size in pixels |
| `IMAGE_SIZE_SMALL` | `300` | Small size in pixels |
| `IMAGE_SIZE_MEDIUM` | `500` | Medium size in pixels |
| `IMAGE_SIZE_LARGE` | `1200` | Large size in pixels |
| `IMAGE_SIZE_EXTRA_LARGE` | `1920` | Extra large size in pixels |
| `IMAGE_DEFAULT_FORMAT` | `webp` | Default output format |
| `IMAGE_MAX_WIDTH` | `4096` | Maximum image width |
| `IMAGE_MAX_HEIGHT` | `4096` | Maximum image height |
| `IMAGE_MIN_WIDTH` | `32` | Minimum image width |
| `IMAGE_MIN_HEIGHT` | `32` | Minimum image height |

#### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `SECURITY_MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |
| `SECURITY_MAX_WIDTH` | `4096` | Max image width |
| `SECURITY_MAX_HEIGHT` | `4096` | Max image height |
| `SECURITY_MIN_WIDTH` | `32` | Min image width |
| `SECURITY_MIN_HEIGHT` | `32` | Min image height |
| `SECURITY_MIN_ASPECT_RATIO` | `0.1` | Min aspect ratio |
| `SECURITY_MAX_ASPECT_RATIO` | `10` | Max aspect ratio |
| `SECURITY_ENABLE_MALWARE_DETECTION` | `true` | Enable malware detection |
| `SECURITY_ENABLE_XSS_DETECTION` | `true` | Enable XSS detection |
| `SECURITY_VALIDATE_FILE_SIGNATURE` | `true` | Validate file signatures |

#### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_BACKEND` | `local` | Storage backend (local/s3/minio) |
| `STORAGE_BASE_PATH` | `./uploads` | Base storage path |
| `STORAGE_MAX_SIZE` | `10737418240` | Max storage size (10GB) |
| `STORAGE_TEMP_TTL` | `86400000` | Temp file TTL (24h) |
| `STORAGE_ENABLE_DEDUPLICATION` | `true` | Enable deduplication |
| `STORAGE_CLEANUP_INTERVAL` | `3600000` | Cleanup interval (1h) |

---

## Deployment Guide

### Production Setup

#### 1. Environment Preparation

```bash
# Set production environment
export NODE_ENV=production

# Use secure secrets
export JWT_SECRET=<strong-random-secret>
export JWT_REFRESH_SECRET=<strong-random-secret>
```

#### 2. Security Hardening

- Use HTTPS with a valid SSL certificate
- Set strong JWT secrets (32+ characters)
- Enable all security validations
- Configure proper CORS origins
- Set up firewall rules
- Enable security headers

#### 3. Performance Optimization

- Enable compression
- Configure caching headers
- Use CDN for static assets
- Optimize image quality settings
- Enable progressive loading

#### 4. Monitoring & Logging

- Set up log aggregation
- Configure error tracking
- Monitor performance metrics
- Set up alerts for security events
- Regular backup of uploads

#### 5. Scaling

- Use load balancer for multiple instances
- Configure horizontal scaling
- Use S3/MinIO for distributed storage
- Implement caching layer
- Consider microservices architecture

### Deployment Checklist

- [ ] Environment variables configured
- [ ] HTTPS/SSL enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database migrations run (if applicable)
- [ ] Storage directories created with proper permissions
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Security audit completed

---

## Best Practices

### 1. Image Upload Best Practices

- **Validate on Client Side**: Pre-validate images before uploading
- **Use Appropriate Formats**: WebP for web, JPEG for photos, PNG for graphics
- **Optimize File Size**: Compress images before upload when possible
- **Handle Errors Gracefully**: Provide clear error messages to users
- **Show Upload Progress**: Display progress indicators for large files

### 2. Security Best Practices

- **Never Trust Client Input**: Always validate on the server
- **Use HTTPS**: Always use HTTPS in production
- **Rotate Secrets**: Regularly rotate JWT secrets
- **Monitor Security Events**: Set up alerts for suspicious activity
- **Keep Dependencies Updated**: Regularly update packages

### 3. Performance Best Practices

- **Use Caching**: Cache frequently accessed images
- **Optimize Image Sizes**: Serve appropriate sizes for different devices
- **Use CDN**: Distribute images globally
- **Lazy Load**: Implement lazy loading for images
- **Compress Responses**: Enable response compression

### 4. Storage Best Practices

- **Use Deduplication**: Enable content-based deduplication
- **Regular Cleanup**: Schedule regular cleanup of old files
- **Monitor Storage Usage**: Track storage usage and set alerts
- **Use Cloud Storage**: Consider S3/MinIO for scalability
- **Backup Important Files**: Regular backup of critical uploads

### 5. Code Quality Best Practices

- **Type Safety**: Use TypeScript for type safety
- **Error Handling**: Implement comprehensive error handling
- **Logging**: Log important events and errors
- **Testing**: Write unit and integration tests
- **Documentation**: Keep documentation up to date

---

## Troubleshooting

See [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) for detailed troubleshooting guide.

## Additional Resources

- [Integration Guide](./INTEGRATION_GUIDE.md) - Comprehensive guide for all integrated features
- [API Reference](./API_REFERENCE.md)
- [Quick Start Guide](../QUICKSTART.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)

---

## Support

For issues, questions, or contributions, please refer to the main project repository.
