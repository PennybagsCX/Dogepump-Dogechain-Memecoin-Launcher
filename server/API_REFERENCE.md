# Image Upload System - API Reference

Complete API documentation for the Image Upload System.

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [Response Format](#response-format)
7. [Integrated Endpoints](#integrated-endpoints)

---

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

---

## Authentication

### Overview

Most endpoints require JWT (JSON Web Token) authentication. You must include the access token in the `Authorization` header.

### Getting a Token

#### Register New User

**POST** `/auth/register`

Register a new user account.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123",
  "walletAddress": "0x123...abc" (optional)
}
```

**Password Requirements:**
- Minimum length: 8 characters (configurable)
- At least one uppercase letter (configurable)
- At least one lowercase letter (configurable)
- At least one number (configurable)
- Special characters optional (configurable)

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123def456",
    "email": "user@example.com",
    "username": "username",
    "walletAddress": "0x123...abc",
    "role": "user",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email or username already exists
- `500 Internal Server Error`: Server error

#### Login

**POST** `/auth/login`

Authenticate with email and password.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123def456",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "isActive": true,
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

#### Refresh Token

**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid refresh token
- `401 Unauthorized`: Refresh token expired
- `500 Internal Server Error`: Server error

### Using the Token

Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Expiration

- **Access Token**: 15 minutes (default, configurable)
- **Refresh Token**: 7 days (default, configurable)

When access token expires, use refresh token to get a new one.

---

## Endpoints

### 1. Upload Image

Upload and process an image with automatic variant generation.

**POST** `/images/upload`

**Authentication:** Required (`image:upload` permission)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file` (required): Image file

**Supported Formats:**
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

**File Size Limits:**
- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

**Dimension Limits:**
- Minimum: 32x32 pixels
- Maximum: 4096x4096 pixels
- Aspect Ratio: 0.1 to 10

**Response (201 Created):**
```json
{
  "success": true,
  "image": {
    "id": "img_abc123def456",
    "url": "/api/images/img_abc123def456",
    "filename": "image_1234567890_abc123.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Image Variants Generated:**
- `thumbnail`: 150x150px
- `small`: 300x300px
- `medium`: 500x500px
- `large`: 1200x1200px
- `xlarge`: 1920x1920px

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Invalid file signature",
    "details": {
      "declaredMime": "image/jpeg",
      "detectedMime": "application/octet-stream"
    }
  }
  ```
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `413 Payload Too Large`: File exceeds size limit
  ```json
  {
    "statusCode": 413,
    "error": "Payload Too Large",
    "message": "File size exceeds maximum limit",
    "details": {
      "maxSize": 10485760,
      "receivedSize": 15728640
    }
  }
  ```
- `500 Internal Server Error`: Server error

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/image.jpg"
```

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3001/api/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### 2. Get Image

Retrieve an image by ID with optional variant selection.

**GET** `/images/:imageId`

**Authentication:** Required

**Path Parameters:**
- `imageId` (required): Image ID (e.g., `img_abc123def456`)

**Query Parameters:**
- `variant` (optional): Image variant to retrieve
  - Options: `original`, `thumbnail`, `small`, `medium`, `large`, `xlarge`
  - Default: `original`

**Response (200 OK):**
- Returns image binary data with appropriate `Content-Type` header
- Includes `Cache-Control: public, max-age=31536000` (1 year cache)

**Error Responses:**
- `400 Bad Request`: Invalid image ID format
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Invalid image ID format"
  }
  ```
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Image not found
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Image not found"
  }
  ```
- `500 Internal Server Error`: Server error

**Example Request:**
```bash
# Get original image
curl -X GET http://localhost:3001/api/images/img_abc123def456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --output image.jpg

# Get thumbnail
curl -X GET "http://localhost:3001/api/images/img_abc123def456?variant=thumbnail" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --output thumbnail.jpg

# Get medium variant
curl -X GET "http://localhost:3001/api/images/img_abc123def456?variant=medium" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --output medium.jpg
```

**Example Request (JavaScript):**
```javascript
// Get image and display in browser
fetch('http://localhost:3001/api/images/img_abc123def456?variant=thumbnail', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
  .then(response => response.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    document.getElementById('image').src = url;
  });
```

---

### 3. Validate Image

Validate an image without uploading it. Useful for client-side validation.

**POST** `/images/validate`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file` (required): Image file to validate

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
    "checksum": "abc123def456789..."
  }
}
```

**Response with Warnings:**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [
    "Filename was sanitized: my image.jpg -> my-image.jpg",
    "EXIF data detected and will be stripped"
  ],
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
    "checksum": "abc123def456789..."
  }
}
```

**Response with Errors:**
```json
{
  "success": true,
  "valid": false,
  "errors": [
    "Invalid file signature",
    "File size exceeds maximum limit"
  ],
  "warnings": [],
  "details": null
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/images/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/image.jpg"
```

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3001/api/images/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
  .then(response => response.json())
  .then(data => {
    if (data.valid) {
      console.log('Image is valid!');
    } else {
      console.error('Validation errors:', data.errors);
    }
  });
```

---

### 4. Delete Image

Delete an image and all its variants.

**DELETE** `/images/:imageId`

**Authentication:** Required (`image:delete` permission)

**Path Parameters:**
- `imageId` (required): Image ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid image ID format
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Server error

**Note:** This endpoint is not yet implemented. Returns `501 Not Implemented`.

---

### 5. List Images

List user's images with pagination and sorting.

**GET** `/images`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 20, range: 1-100)
- `sortBy` (optional): Sort field
  - Options: `createdAt`, `updatedAt`, `name`, `size`
  - Default: `createdAt`
- `sortOrder` (optional): Sort order
  - Options: `asc`, `desc`
  - Default: `desc`

**Response (200 OK):**
```json
{
  "success": true,
  "images": [
    {
      "id": "img_abc123def456",
      "url": "/api/images/img_abc123def456",
      "filename": "image_1234567890_abc123.jpg",
      "mimetype": "image/jpeg",
      "size": 1024000,
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "variants": [
        {
          "name": "thumbnail",
          "url": "/api/images/img_abc123def456?variant=thumbnail",
          "width": 150,
          "height": 150,
          "size": 25600
        },
        {
          "name": "small",
          "url": "/api/images/img_abc123def456?variant=small",
          "width": 300,
          "height": 300,
          "size": 51200
        }
      ]
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

**Error Responses:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

**Note:** This endpoint is not yet implemented. Returns `501 Not Implemented`.

---

### 6. Get Image Metadata

Get detailed metadata for an image.

**GET** `/images/:imageId/metadata`

**Authentication:** Required

**Path Parameters:**
- `imageId` (required): Image ID

**Response (200 OK):**
```json
{
  "success": true,
  "metadata": {
    "id": "img_abc123def456",
    "filename": "image_1234567890_abc123.jpg",
    "format": "jpeg",
    "width": 1920,
    "height": 1080,
    "aspectRatio": 1.78,
    "size": 1024000,
    "mimetype": "image/jpeg",
    "checksum": "abc123def456789...",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "variants": [
      {
        "name": "thumbnail",
        "width": 150,
        "height": 150,
        "format": "jpeg",
        "quality": 75,
        "url": "/api/images/img_abc123def456?variant=thumbnail",
        "size": 25600
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid image ID format
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Server error

**Note:** This endpoint is not yet implemented. Returns `501 Not Implemented`.

---

## Error Codes

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | Request body too large |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 501 | Not Implemented | Feature not implemented |

### Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "details": {
    "field": "value",
    "additional": "context"
  }
}
```

### Common Error Scenarios

#### Authentication Errors

**Missing Token:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid authorization token"
}
```

**Expired Token:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token expired"
}
```

**Invalid Token:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

#### Validation Errors

**Invalid File Type:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid file type",
  "details": {
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
    "receivedType": "application/pdf"
  }
}
```

**File Too Large:**
```json
{
  "statusCode": 413,
  "error": "Payload Too Large",
  "message": "File size exceeds maximum limit",
  "details": {
    "maxSize": 10485760,
    "receivedSize": 15728640,
    "maxSizeMB": "10.00",
    "receivedSizeMB": "15.00"
  }
}
```

**Invalid Dimensions:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid image dimensions",
  "details": {
    "width": 5000,
    "minWidth": 32,
    "maxWidth": 4096
  }
}
```

**Invalid Aspect Ratio:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid aspect ratio",
  "details": {
    "aspectRatio": "15.00",
    "minAspectRatio": 0.1,
    "maxAspectRatio": 10
  }
}
```

#### Security Errors

**Invalid File Signature:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid file signature",
  "details": {
    "declaredMime": "image/jpeg",
    "detectedMime": "application/octet-stream",
    "fileSignature": "FFD8FFE0"
  }
}
```

**Malware Detected:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Security validation failed",
  "details": {
    "errors": [
      "Suspicious pattern detected: embedded script"
    ],
    "warnings": []
  }
}
```

#### Rate Limit Errors

**Rate Limit Exceeded:**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "current": 150,
    "reset": "2024-01-01T00:01:00.000Z"
  }
}
```

---

## Rate Limiting

### Global Rate Limit

- **Limit**: 100 requests per minute
- **Window**: 60 seconds
- **Headers:**
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Current`: Current request count
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

### Authentication Rate Limit

- **Limit**: 5 attempts per 15 minutes
- **Window**: 900 seconds
- **Applies to**: Login, register, password reset endpoints

### Security Event Rate Limit

- **Limit**: 10 security events per 15 minutes
- **Window**: 900 seconds
- **Applies to**: Failed validations, suspicious activities

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "current": 101,
    "retryAfter": 60
  }
}
```

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Current: 101
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 60
```

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

Or for specific endpoints:

```json
{
  "success": true,
  "image": {
    // Image data
  }
}
```

### Error Response

All error responses follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "details": {
    // Additional context
  }
}
```

### Pagination Response

For paginated endpoints:

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Integrated Endpoints

### Update Profile with Avatar

Update user profile including avatar image upload.

**PATCH** `/auth/me`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `avatar` (optional): Image file for profile avatar
- `username` (optional): New username
- `walletAddress` (optional): Wallet address

**Supported Image Formats:**
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

**File Size Limits:**
- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123def456",
    "email": "user@example.com",
    "username": "newusername",
    "walletAddress": "0x123...abc",
    "role": "user",
    "isActive": true,
    "emailVerified": true,
    "avatarUrl": "/api/images/img_avatar_abc123def456",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
- `401 Unauthorized`: Missing or invalid token
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error

**Example Request:**
```bash
curl -X PATCH http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "username=newusername"
```

**Example Request (JavaScript):**
```javascript
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

---

### Create Comment with Image

Create a new comment with an attached image.

**POST** `/comments/with-image`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `content` (required): Comment text
- `image` (required): Image file to attach

**Supported Image Formats:**
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

**File Size Limits:**
- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

**Response (201 Created):**
```json
{
  "success": true,
  "comment": {
    "id": "comment_abc123def456",
    "content": "Check out this image!",
    "userId": "user_abc123def456",
    "username": "username",
    "imageId": "img_abc123def456",
    "imageUrl": "/api/images/img_abc123def456",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "image": {
    "id": "img_abc123def456",
    "url": "/api/images/img_abc123def456",
    "filename": "image_1234567890_abc123.jpg"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
- `401 Unauthorized`: Missing or invalid token
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/comments/with-image \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "content=Check out this image!" \
  -F "image=@/path/to/image.jpg"
```

**Example Request (JavaScript):**
```javascript
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

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class ImageUploadClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async uploadImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async getImage(imageId: string, variant?: string): Promise<Blob> {
    const url = variant
      ? `${this.baseUrl}/images/${imageId}?variant=${variant}`
      : `${this.baseUrl}/images/${imageId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return response.blob();
  }

  async validateImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/images/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }
}

// Usage
const client = new ImageUploadClient('http://localhost:3001/api', token);
const result = await client.uploadImage(file);
```

### Python

```python
import requests

class ImageUploadClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {'Authorization': f'Bearer {token}'}

    def upload_image(self, file_path):
        url = f'{self.base_url}/images/upload'
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, headers=self.headers, files=files)
        return response.json()

    def get_image(self, image_id, variant=None):
        url = f'{self.base_url}/images/{image_id}'
        if variant:
            url += f'?variant={variant}'
        response = requests.get(url, headers=self.headers)
        return response.content

    def validate_image(self, file_path):
        url = f'{self.base_url}/images/validate'
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, headers=self.headers, files=files)
        return response.json()

# Usage
client = ImageUploadClient('http://localhost:3001/api', token)
result = client.upload_image('/path/to/image.jpg')
```

---

## Additional Resources

- [Integration Guide](./INTEGRATION_GUIDE.md) - Comprehensive guide for all integrated features
- [Complete System Documentation](./IMAGE_UPLOAD_SYSTEM.md)
- [Quick Start Guide](../QUICKSTART.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
