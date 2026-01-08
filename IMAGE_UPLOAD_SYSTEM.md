# Image Upload System Documentation

## Overview

The Dogepump image upload system provides a secure, persistent image storage solution with PostgreSQL database integration and file system storage. Images are associated with user accounts and support multiple formats, sizes, and deduplication.

## Architecture

### Components

1. **Frontend Service** (`services/backendService.ts`)
   - Handles upload requests with progress tracking
   - Manages authentication tokens
   - Provides TypeScript interfaces for type safety

2. **Backend Routes** (`server/routes/images.ts`)
   - `POST /api/images/upload` - Upload new images (requires authentication)
   - `GET /api/images/:imageId` - Retrieve images (public)
   - `GET /api/images/:imageId/metadata` - Get image metadata (requires authentication)
   - `DELETE /api/images/:imageId` - Delete images (requires authentication & ownership)
   - `GET /api/images` - List user's images (requires authentication)
   - `POST /api/images/validate` - Validate image without uploading (requires authentication)

3. **Image Service** (`server/services/imageServicePostgres.ts`)
   - PostgreSQL-based image storage
   - File system storage for actual image data
   - Automatic deduplication by checksum
   - Image variant generation (thumbnail, small, medium, large, extra_large)

4. **Storage Service** (`server/services/storageService.ts`)
   - Manages file system operations
   - Handles temporary and permanent storage
   - Automatic cleanup of old files

## Database Schema

### Images Table

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  format VARCHAR(50) NOT NULL,
  checksum VARCHAR(64) NOT NULL UNIQUE,
  is_temporary BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  storage_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_checksum ON images(checksum);
CREATE INDEX idx_images_created_at ON images(created_at);
```

### Image Variants Table

```sql
CREATE TABLE image_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size INTEGER NOT NULL,
  format VARCHAR(50) NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_image_variants_image_id ON image_variants(image_id);
CREATE INDEX idx_image_variants_name ON image_variants(name);
```

## File Storage Structure

```
uploads/
├── permanent/
│   └── {userId}/
│       ├── {imageId}.{format}
│       └── variants/
│           ├── thumbnail/
│           ├── small/
│           ├── medium/
│           ├── large/
│           └── extra_large/
└── temp/
    └── {userId}/
        └── {imageId}.{format}
```

## API Endpoints

### Upload Image

**Endpoint:** `POST /api/images/upload`

**Authentication:** Required (JWT token)

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "339554a4-2c2d-43b6-a1db-110b1e757ae0",
    "url": "/api/images/339554a4-2c2d-43b6-a1db-110b1e757ae0",
    "filename": "uuid-generated-filename.png",
    "mimetype": "image/png",
    "size": 5963670,
    "uploadedAt": "2025-12-27T21:58:06.563Z"
  }
}
```

**Features:**
- Automatic deduplication by SHA-256 checksum
- EXIF metadata stripping for privacy
- Image format validation (JPEG, PNG, WebP, AVIF, GIF)
- File size limits (configurable, default 10MB)
- Dimension validation (32px to 4096px)
- Automatic variant generation

### Get Image

**Endpoint:** `GET /api/images/:imageId`

**Authentication:** Not required (public access)

**Query Parameters:**
- `variant` - Optional: `original`, `thumbnail`, `small`, `medium`, `large`, `extra_large`

**Response:** Image file with proper Content-Type header

**CORS Headers:**
```
Cross-Origin-Resource-Policy: cross-origin
Cache-Control: public, max-age=31536000
```

### Delete Image

**Endpoint:** `DELETE /api/images/:imageId`

**Authentication:** Required

**Authorization:** User must own the image

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Note:** Soft delete - images are marked as deleted but not removed from disk immediately.

### List User Images

**Endpoint:** `GET /api/images`

**Authentication:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field: `createdAt`, `updatedAt`, `filename`, `size`
- `sortOrder` - Sort order: `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "images": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Image Processing

### Variant Sizes

| Variant | Width | Quality | Use Case |
|---------|-------|---------|----------|
| Thumbnail | 150px | Low (60%) | Avatars, thumbnails |
| Small | 300px | Medium (75%) | Cards, small displays |
| Medium | 500px | Medium (75%) | Standard display |
| Large | 1200px | High (90%) | High-resolution displays |
| Extra Large | 1920px | High (90%) | Full-screen images |

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- AVIF (.avif)
- GIF (.gif)

### Security Features

1. **File Validation**
   - Magic number verification
   - Content-type validation
   - File signature validation
   - Dimension limits
   - Aspect ratio validation

2. **Metadata Stripping**
   - EXIF data removal
   - GPS location removal
   - Device information removal

3. **Deduplication**
   - SHA-256 checksum calculation
   - Automatic duplicate detection
   - Storage optimization

4. **Access Control**
   - Authentication required for upload
   - Ownership verification for deletion
   - Public read access for images

## User Association

### Authentication Requirement

All image uploads require authentication. The system:

1. Validates JWT tokens
2. Extracts user ID from token
3. Associates all images with the authenticated user
4. Stores user ID in database `user_id` field

### Wallet Address Integration

User profiles include optional wallet addresses:

```typescript
interface UserProfile {
  id: string;
  email: string;
  username: string;
  walletAddress?: string;  // Optional wallet address
  role: 'user' | 'admin';
  // ... other fields
}
```

### Ownership Verification

Users can only:
- Upload images under their own account
- Delete their own images
- List their own images
- View metadata for their own images

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/dogepump_dev

# CORS
CORS_ORIGIN=http://localhost:3005

# Storage
STORAGE_BASE_PATH=./uploads
STORAGE_MAX_SIZE=10737418240  # 10GB
STORAGE_TEMP_TTL=86400000      # 24 hours
STORAGE_CLEANUP_INTERVAL=3600000  # 1 hour

# Image Processing
IMAGE_QUALITY_HIGH=90
IMAGE_QUALITY_MEDIUM=75
IMAGE_QUALITY_LOW=60
IMAGE_SIZE_THUMBNAIL=150
IMAGE_SIZE_SMALL=300
IMAGE_SIZE_MEDIUM=500
IMAGE_SIZE_LARGE=1200
IMAGE_SIZE_EXTRA_LARGE=1920

# Security
SECURITY_MAX_FILE_SIZE=10485760  # 10MB
SECURITY_MAX_WIDTH=4096
SECURITY_MAX_HEIGHT=4096
SECURITY_MIN_WIDTH=32
SECURITY_MIN_HEIGHT=32
```

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid file, size, or format |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Not the image owner |
| 404 | Not Found - Image doesn't exist |
| 413 | Payload Too Large - File exceeds size limit |
| 415 | Unsupported Media Type - Invalid file format |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "File size exceeds maximum allowed size",
  "details": {
    "maxSize": 10485760,
    "receivedSize": 20971520
  }
}
```

## Frontend Integration

### Upload Example

```typescript
import { uploadImage } from './services/backendService';

const handleUpload = async (file: File) => {
  try {
    const response = await uploadImage(file, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });

    if (response.success) {
      console.log('Image uploaded:', response.image);
      // Image URL: response.image.url
      // Image ID: response.image.id
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Display Image Example

```tsx
<img
  src={`http://localhost:3001${image.url}`}
  alt={image.filename}
  onError={() => console.error('Failed to load image')}
/>
```

### Delete Image Example

```typescript
import { deleteImage } from './services/backendService';

const handleDelete = async (imageId: string) => {
  try {
    await deleteImage(imageId);
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};
```

## Maintenance

### Cleanup Tasks

1. **Temporary Image Cleanup**
   - Runs automatically every hour
   - Removes temporary images older than 24 hours
   - Configurable via `STORAGE_TEMP_TTL`

2. **Soft Delete Cleanup**
   - Mark images as deleted instead of removing
   - Can be purged periodically
   - Maintains data integrity

3. **Storage Monitoring**
   - Track total storage usage per user
   - Enforce storage limits
   - Generate usage reports

## Monitoring & Logging

### Key Metrics

- Upload success rate
- Average upload size
- Storage usage per user
- Deduplication savings
- Error rates by type

### Log Events

- `IMAGE_UPLOAD_ATTEMPT` - Upload started
- `IMAGE_UPLOAD_SUCCESS` - Upload completed
- `IMAGE_UPLOAD_FAILED` - Upload failed
- `IMAGE_RETRIEVAL_ERROR` - Get image failed
- `IMAGE_DELETION_ERROR` - Delete failed
- `INVALID_IMAGE_ID` - Invalid ID format
- `FILE_UPLOAD_SUCCESS` - File validated and stored

## Security Considerations

1. **Authentication**
   - JWT token validation
   - Token expiration handling
   - Refresh token support

2. **Authorization**
   - User ownership verification
   - Permission checks
   - Role-based access control

3. **Input Validation**
   - File type validation
   - Size limits
   - Dimension checks
   - Magic number verification

4. **Privacy**
   - EXIF data stripping
   - Metadata sanitization
   - Secure file storage

5. **Rate Limiting**
   - Upload rate limits per user
   - IP-based rate limiting
   - Configurable windows

## Troubleshooting

### Image Not Displaying

1. Check image ID is valid
2. Verify image exists in database
3. Confirm file exists on disk
4. Check CORS headers
5. Verify `Cross-Origin-Resource-Policy` header

### Upload Failing

1. Verify user is authenticated
2. Check file size limits
3. Validate file format
4. Check disk space
5. Review error logs

### Permission Errors

1. Verify upload directory exists
2. Check directory permissions
3. Ensure `STORAGE_BASE_PATH` is writable
4. Review user permissions

## Future Enhancements

1. **CDN Integration**
   - CloudFront/CloudFlare integration
   - Geographic distribution
   - Edge caching

2. **Alternative Storage**
   - S3 integration
   - MinIO support
   - Azure Blob Storage

3. **Advanced Processing**
   - WebP/AVIF conversion
   - Progressive loading
   - Lazy loading support
   - Responsive images

4. **Analytics**
   - Image view tracking
   - Popular images
   - User engagement metrics

## Support

For issues or questions:
1. Check server logs at `/server/logs/`
2. Review PostgreSQL logs
3. Verify environment configuration
4. Check database connectivity
5. Validate file system permissions

---

**Last Updated:** December 27, 2025
**Version:** 1.0.0
