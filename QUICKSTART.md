# Image Upload System - Quick Start Guide

Get up and running with the Image Upload System in minutes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Servers](#running-the-servers)
5. [Testing the System](#testing-the-system)
6. [Testing Integrated Features](#testing-integrated-features)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) - Check version with `npm --version`
- **Git** - [Download Git](https://git-scm.com/)

### Verify Installation

```bash
node --version  # Should be v18 or higher
npm --version   # Should be 9 or higher
git --version   # Should be 2.x or higher
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dogepump-dogechain-memecoin-launcher
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Fastify (web framework)
- Sharp (image processing)
- TypeScript (type safety)
- And all other dependencies

### 3. Create Environment File

```bash
cp .env.example .env
```

### 4. Create Upload Directories

```bash
mkdir -p uploads/temp
mkdir -p uploads/permanent
```

---

## Configuration

### Basic Configuration

Edit the `.env` file to configure basic settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

### Recommended Development Settings

For development, use these settings:

```env
NODE_ENV=development
LOG_LEVEL=debug
IMAGE_STRIP_METADATA=false
SECURITY_VALIDATE_FILE_SIGNATURE=true
SECURITY_ENABLE_MALWARE_DETECTION=true
```

### Recommended Production Settings

For production, use these settings:

```env
NODE_ENV=production
LOG_LEVEL=warn
IMAGE_STRIP_METADATA=true
SECURITY_VALIDATE_FILE_SIGNATURE=true
SECURITY_ENABLE_MALWARE_DETECTION=true
SECURITY_ENABLE_XSS_DETECTION=true
SECURITY_VALIDATE_CONTENT_TYPE=true
SECURITY_VALIDATE_DIMENSIONS=true
SECURITY_VALIDATE_ASPECT_RATIO=true
```

---

## Running the Servers

### Development Mode

Run both frontend and backend in development mode:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

### Production Mode

For production, build and start the optimized versions:

```bash
# Build frontend
npm run build

# Start production server
npm run server:prod
```

### Verify Servers are Running

Check that servers are accessible:

```bash
# Check frontend (default: http://localhost:5173)
curl http://localhost:5173

# Check backend (default: http://localhost:3001)
curl http://localhost:3001
```

---

## Testing the System

### 1. Test Authentication

First, you need to authenticate to get a JWT token.

#### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "test@example.com",
    "username": "testuser",
    "role": "user"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

Save the `accessToken` for subsequent requests.

#### Login (Alternative to Registration)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 2. Test Image Upload

Upload an image using the access token:

```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@/path/to/your/image.jpg"
```

Expected response:
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

Save the `image.id` for retrieval.

### 3. Test Image Retrieval

Retrieve the uploaded image:

```bash
# Get original image
curl -X GET http://localhost:3001/api/images/img_abc123def456 \
  -H "Authorization: Bearer <your-access-token>" \
  --output downloaded.jpg

# Get thumbnail variant
curl -X GET "http://localhost:3001/api/images/img_abc123def456?variant=thumbnail" \
  -H "Authorization: Bearer <your-access-token>" \
  --output thumbnail.jpg

# Get medium variant
curl -X GET "http://localhost:3001/api/images/img_abc123def456?variant=medium" \
  -H "Authorization: Bearer <your-access-token>" \
  --output medium.jpg
```

### 4. Test Image Validation

Validate an image without uploading:

```bash
curl -X POST http://localhost:3001/api/images/validate \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@/path/to/your/image.jpg"
```

Expected response:
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

### 5. Test with Different Image Formats

Test uploading different image formats:

```bash
# JPEG
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@photo.jpg"

# PNG
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@graphic.png"

# WebP
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@image.webp"

# AVIF
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@image.avif"
```

### 6. Test Error Handling

Test various error scenarios:

#### Test File Too Large

```bash
# Create a large file (>10MB)
dd if=/dev/zero of=large.img bs=1M count=15

# Try to upload
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@large.img"
```

Expected response:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "File size exceeds maximum limit",
  "details": {
    "maxSize": 10485760,
    "receivedSize": 15728640
  }
}
```

#### Test Invalid File Type

```bash
# Try to upload a text file
echo "This is not an image" > fake.jpg
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@fake.jpg"
```

Expected response:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid file signature"
}
```

#### Test Missing Authentication

```bash
# Try to upload without token
curl -X POST http://localhost:3001/api/images/upload \
  -F "file=@image.jpg"
```

Expected response:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid authorization token"
}
```

---

## Testing Integrated Features

### 1. Test Profile Avatar Upload

Upload and update a profile avatar.

```bash
curl -X PATCH http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-access-token>" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "username=newusername"
```

Expected response:
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

### 2. Test Token Logo Upload

Upload a token logo during token creation.

```bash
curl -X POST http://localhost:3001/api/tokens \
  -H "Authorization: Bearer <your-access-token>" \
  -F "logo=@/path/to/logo.png" \
  -F "name=MyToken" \
  -F "symbol=MTK" \
  -F "description=My awesome token"
```

Expected response:
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

### 3. Test Comment Image Upload

Upload a comment with an attached image.

```bash
curl -X POST http://localhost:3001/api/comments/with-image \
  -H "Authorization: Bearer <your-access-token>" \
  -F "content=Check out this image!" \
  -F "image=@/path/to/image.jpg"
```

Expected response:
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

## Common Issues and Solutions

### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3002
```

### Issue 2: Permission Denied on Upload Directory

**Error:**
```
Error: EACCES: permission denied, mkdir './uploads'
```

**Solution:**
```bash
# Create directories with proper permissions
mkdir -p uploads/temp uploads/permanent
chmod 755 uploads
chmod 755 uploads/temp
chmod 755 uploads/permanent
```

### Issue 3: JWT Token Expired

**Error:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token expired"
}
```

**Solution:**
```bash
# Refresh your token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your-refresh-token>"
  }'

# Or login again to get a new token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### Issue 4: File Upload Timeout

**Error:**
```
Error: Request timeout
```

**Solution:**
```bash
# Increase timeout in server configuration
# In server/index.ts, add:
fastify.addContentTypeParser('multipart/form-data', {
  bodyLimit: 10485760 * 10, // 100MB
  parseAs: 'buffer'
}, (req, body, done) => {
  done(null, body)
})
```

### Issue 5: Sharp Installation Error

**Error:**
```
Error: Cannot find module 'sharp'
```

**Solution:**
```bash
# Rebuild sharp
npm rebuild sharp

# Or reinstall
npm uninstall sharp
npm install sharp
```

### Issue 6: CORS Errors in Browser

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
```bash
# Update CORS_ORIGIN in .env to match your frontend URL
CORS_ORIGIN=http://localhost:5173

# Or allow all origins (not recommended for production)
CORS_ORIGIN=*
```

### Issue 7: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run server

# Or reduce image processing quality in .env
IMAGE_QUALITY_HIGH=70
IMAGE_QUALITY_MEDIUM=60
IMAGE_QUALITY_LOW=50
```

### Issue 8: Temporary Files Not Cleaning Up

**Symptom:**
Uploads directory keeps growing

**Solution:**
```bash
# Manually clean up old files
find uploads/temp -type f -mtime +1 -delete

# Or verify cleanup interval in .env
STORAGE_CLEANUP_INTERVAL=3600000  # 1 hour
STORAGE_TEMP_TTL=86400000  # 24 hours
```

### Issue 9: Image Variants Not Generated

**Symptom:**
Only original image is available

**Solution:**
```bash
# Check if variant generation is enabled
# In .env, ensure:
IMAGE_ALLOWED_FORMATS=jpeg,png,webp,avif

# Or check server logs for errors
npm run server 2>&1 | grep -i error
```

### Issue 10: Database Connection Errors

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# If using database, ensure it's running
# For MongoDB:
mongod

# For PostgreSQL:
pg_ctl -D /usr/local/var/postgres start

# Or check connection string in .env
DATABASE_URL=mongodb://localhost:27017/dogepump
```

---

## Next Steps

### 1. Explore the Documentation

- [Complete System Documentation](./server/IMAGE_UPLOAD_SYSTEM.md)
- [API Reference](./server/API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### 2. Customize Configuration

Adjust the system to your needs:
- Change image quality settings
- Customize storage paths
- Configure security options
- Set up rate limiting

### 3. Integrate with Frontend

Add image upload functionality to your React app:

```typescript
// Example React component
import { useState } from 'react';

function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch('http://localhost:3001/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

### 4. Set Up Production Deployment

Follow the [Deployment Guide](./DEPLOYMENT.md) to:
- Configure production environment
- Set up HTTPS/SSL
- Configure security headers
- Set up monitoring and logging
- Scale the system

### 5. Implement Advanced Features

- Add image editing capabilities
- Implement batch uploads
- Add image galleries
- Create image sharing features
- Implement image analytics

---

## Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review server logs: `npm run server`
3. Check the [API Reference](./server/API_REFERENCE.md)
4. Open an issue in the repository

---

## Quick Reference

### Useful Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev          # Frontend
npm run server        # Backend

# Build for production
npm run build

# Run tests (if available)
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Default Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Default Credentials

No default credentials - you must register a new user.

### Important Files

- `.env` - Environment configuration
- `server/index.ts` - Backend entry point
- `server/config.ts` - Configuration settings
- `server/routes/images.ts` - Image routes
- `server/services/imageService.ts` - Image processing
- `server/services/storageService.ts` - Storage management
- `server/services/securityService.ts` - Security validations

---

**Ready to dive deeper?** Check out the [Complete System Documentation](./server/IMAGE_UPLOAD_SYSTEM.md) for comprehensive details.
