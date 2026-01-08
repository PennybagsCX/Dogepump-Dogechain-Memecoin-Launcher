# Dogepump API Documentation

## Overview

The Dogepump API provides a RESTful interface for the Dogechain memecoin launcher platform. All endpoints are prefixed with `/api` unless otherwise noted.

**Base URL:** `https://api.dogepump.com/api` (production) or `http://localhost:3001/api` (development)

**Authentication:** Most endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

## Authentication

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "karma": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "karma": 100,
    "walletAddress": "0x..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Logout All Devices

```http
POST /api/auth/logout-all
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from 5 device(s)",
  "sessionsRevoked": 5
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "karma": 100,
    "walletAddress": "0x...",
    "avatarUrl": "https://...",
    "bio": "User bio",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Profile

```http
PATCH /api/auth/me
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "username": "newusername",
  "bio": "Updated bio",
  "avatarUrl": "https://...",
  "walletAddress": "0x..."
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "newusername",
    "bio": "Updated bio",
    "avatarUrl": "https://...",
    "walletAddress": "0x...",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Change Password

```http
POST /api/auth/change-password
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

### Get Permissions

```http
GET /api/auth/permissions
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "role": "user",
  "permissions": [
    "image:upload",
    "image:delete",
    "comment:create",
    "comment:delete"
  ]
}
```

## Images

### Upload Image

```http
POST /api/images/upload
```

**Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Request Body:**
```
image: <binary file data>
```

**Response (201):**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "url": "/api/images/uuid",
    "filename": "timestamp-random.jpg",
    "mimetype": "image/jpeg",
    "size": 1048576,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Requirements:**
- Authenticated user with `image:upload` permission
- File size: Max 10MB
- Allowed formats: JPEG, PNG, GIF, WebP, AVIF
- Dimensions: 32x32 to 4096x4096 pixels
- Aspect ratio: 0.1 to 10

### Get Image

```http
GET /api/images/:imageId?variant=thumbnail
```

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `variant` (optional): `thumbnail`, `small`, `medium`, `large`, `extra_large`, `original` (default)

**Response:** Binary image data with appropriate `Content-Type` header

**Cache Headers:** `Cache-Control: public, max-age=31536000`

### Delete Image

```http
DELETE /api/images/:imageId
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### List Images

```http
GET /api/images?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `sortBy` (optional, default: createdAt): Sort field (`createdAt`, `updatedAt`, `filename`, `size`)
- `sortOrder` (optional, default: desc): Sort order (`asc`, `desc`)

**Response (200):**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "url": "/api/images/uuid",
      "filename": "image.jpg",
      "size": 1048576,
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Get Image Metadata

```http
GET /api/images/:imageId/metadata
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "hasAlpha": false,
    "density": 72,
    "size": 1048576,
    "checksum": "sha256-hash",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Validate Image

```http
POST /api/images/validate
```

**Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Request Body:**
```
image: <binary file data>
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "details": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 1048576,
    "mimeType": "image/jpeg",
    "fileSignature": "valid",
    "malwareDetected": false,
    "xssPatterns": []
  }
}
```

## Comments

### Create Comment

```http
POST /api/comments
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "content": "This is a comment",
  "imageId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "content": "This is a comment",
    "userId": "user-uuid",
    "username": "johndoe",
    "imageId": "image-uuid",
    "imageUrl": "/api/images/image-uuid",
    "likes": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation:**
- Content: 1-1000 characters
- No HTML tags allowed
- XSS filtering applied

### Create Comment with Image

```http
POST /api/comments/with-image
```

**Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Request Body:**
```
content: "This is a comment with image"
image: <binary file data>
```

**Response (201):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "content": "This is a comment with image",
    "userId": "user-uuid",
    "username": "johndoe",
    "imageId": "image-uuid",
    "imageUrl": "/api/images/image-uuid",
    "likes": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "image": {
    "id": "image-uuid",
    "url": "/api/images/image-uuid",
    "filename": "uploaded-image.jpg"
  }
}
```

### Get Comments

```http
GET /api/comments?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `sortBy` (optional, default: createdAt): Sort field
- `sortOrder` (optional, default: desc): Sort order

**Response (200):**
```json
{
  "success": true,
  "comments": [
    {
      "id": "uuid",
      "content": "Comment content",
      "userId": "user-uuid",
      "username": "johndoe",
      "imageId": "image-uuid",
      "imageUrl": "/api/images/image-uuid",
      "likes": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Get Comment by ID

```http
GET /api/comments/:commentId
```

**Response (200):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "content": "Comment content",
    "userId": "user-uuid",
    "username": "johndoe",
    "imageId": "image-uuid",
    "imageUrl": "/api/images/image-uuid",
    "likes": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Comment

```http
PUT /api/comments/:commentId
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response (200):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "content": "Updated comment content",
    "userId": "user-uuid",
    "username": "johndoe",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Delete Comment

```http
DELETE /api/comments/:commentId
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Get Comments by Image

```http
GET /api/comments/image/:imageId?page=1&limit=20
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response (200):**
```json
{
  "success": true,
  "comments": [
    {
      "id": "uuid",
      "content": "Comment on image",
      "userId": "user-uuid",
      "username": "johndoe",
      "imageId": "image-uuid",
      "imageUrl": "/api/images/image-uuid",
      "likes": 3,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

### Like Comment

```http
POST /api/comments/:commentId/like
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "likes": 6
  }
}
```

### Report Comment

```http
POST /api/comments/:commentId/report
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment reported successfully"
}
```

## Health Checks

### Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Readiness Check

```http
GET /health/ready
```

**Response (200):**
```json
{
  "status": "ready",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    }
  }
}
```

**Response (503):**
```json
{
  "status": "not ready",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Connection refused"
    }
  }
}
```

### Liveness Check

```http
GET /health/live
```

**Response (200):**
```json
{
  "status": "alive"
}
```

### Metrics

```http
GET /health/metrics
```

**Response (200):**
```json
{
  "uptime": 86400,
  "version": "1.0.0",
  "performance": {
    "requestCount": 10000,
    "errorCount": 50,
    "errorRate": "0.5%",
    "averageResponseTime": 150,
    "p50ResponseTime": 120,
    "p95ResponseTime": 300,
    "p99ResponseTime": 500
  },
  "resources": {
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50
    },
    "cpu": 45,
    "activeConnections": 25
  }
}
```

### Dependencies Check

```http
GET /health/dependencies
```

**Response (200):**
```json
{
  "status": "healthy",
  "dependencies": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "redis": {
      "status": "healthy",
      "latency": 2
    },
    "storage": {
      "status": "healthy",
      "availableSpace": 107374182400
    }
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "statusCode": 400,
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `501 Not Implemented`: Feature not yet implemented
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Default:** 100 requests per minute per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **Image upload:** 10 uploads per minute per user
- **Comment creation:** 20 comments per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (1-indexed)
- `limit`: Items per page (max 100)
- `sortBy`: Field to sort by
- `sortOrder`: Sort direction (`asc` or `desc`)

Pagination metadata is included in responses:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Security

### Authentication

JWT tokens are used for authentication:
- **Access Token:** 15 minute expiry, sent in `Authorization` header
- **Refresh Token:** 7 day expiry, used to obtain new access tokens

### Permissions

Role-based access control:
- **user**: Basic permissions (upload images, create comments)
- **admin**: Full permissions (manage users, moderate content)

### Data Sanitization

All user inputs are sanitized:
- XSS pattern detection and filtering
- SQL injection prevention
- Filename sanitization
- URL parameter sanitization

### File Validation

Uploaded files undergo comprehensive validation:
- Magic number validation (file signature)
- MIME type verification
- Size limits (10MB max)
- Dimension validation (32x32 to 4096x4096)
- Aspect ratio validation (0.1 to 10)
- Malware detection
- EXIF metadata stripping

## Webhooks

The API supports webhooks for real-time notifications:

### Comment Created

```http
POST /webhooks/comment
```

**Request Body:**
```json
{
  "event": "comment.created",
  "data": {
    "commentId": "uuid",
    "userId": "user-uuid",
    "imageId": "image-uuid",
    "content": "Comment content",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "signature": "sha256-signature"
}
```

### User Registered

```http
POST /webhooks/user
```

**Request Body:**
```json
{
  "event": "user.registered",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "signature": "sha256-signature"
}
```

## SDKs

Official SDKs are available for popular platforms:

- **JavaScript/TypeScript**: `@dogepump/sdk-js`
- **React**: `@dogepump/sdk-react`
- **Python**: `dogepump-sdk-python`

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- Authentication endpoints
- Image upload and management
- Comment system
- Health check endpoints
- Rate limiting
- Security validations

## Support

For support and questions:
- **Documentation**: https://docs.dogepump.com
- **GitHub Issues**: https://github.com/dogepump/platform/issues
- **Email**: support@dogepump.com
- **Discord**: https://discord.gg/dogepump
