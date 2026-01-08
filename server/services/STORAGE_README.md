# Storage Service

A production-ready, S3-like storage service for managing images with local file-based storage that supports easy migration to MinIO or S3.

## Features

- **S3-like API Interface**: Methods mirror S3 operations for easy migration
- **Multiple Storage Backends**: Local filesystem (current), with S3/MinIO support planned
- **Image Variants**: Automatic generation of multiple size variants
- **File Deduplication**: SHA-256 checksum-based deduplication
- **Lifecycle Management**: Temporary and permanent storage with TTL
- **Batch Operations**: Support for bulk operations
- **Storage Statistics**: Track usage and limits
- **Automatic Cleanup**: Scheduled cleanup of old/temporary files
- **Type Safety**: Full TypeScript support

## Directory Structure

```
uploads/
├── temp/           # Temporary storage (auto-cleanup)
│   └── {userId}/
│       └── {tokenId}/
│           ├── original/
│           ├── thumbnail/
│           ├── small/
│           ├── medium/
│           ├── large/
│           └── xlarge/
└── permanent/      # Permanent storage
    └── {userId}/
        └── {tokenId}/
            ├── original/
            ├── thumbnail/
            ├── small/
            ├── medium/
            ├── large/
            └── xlarge/
```

## Configuration

Add to your `.env` file:

```env
# Storage Configuration
STORAGE_BACKEND=local
STORAGE_BASE_PATH=./uploads
STORAGE_MAX_SIZE=10737418240
STORAGE_TEMP_TTL=86400000
STORAGE_ENABLE_DEDUPLICATION=true
STORAGE_CLEANUP_INTERVAL=3600000
STORAGE_MAX_FILE_SIZE=52428800
STORAGE_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/avif

# S3/MinIO Configuration (for future use)
S3_ENDPOINT=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_USE_SSL=true
```

## Usage

### Initialization

```typescript
import { storageService } from './services/storageService';

// Initialize storage service (called automatically on server start)
await storageService.initialize();
```

### Store an Image

```typescript
const storedImage = await storageService.storeImage({
  userId: 'user123',
  tokenId: 'token456',
  filename: 'image.jpg',
  buffer: imageBuffer,
  mimetype: 'image/jpeg',
  isTemporary: false,
  generateVariants: true,
  deduplicate: true,
});

console.log(storedImage.id); // 'abc123...'
console.log(storedImage.variants); // Array of generated variants
```

### Get an Image

```typescript
// Get original image
const buffer = await storageService.getImage('imageId123');

// Get specific variant
const thumbnail = await storageService.getImage('imageId123', {
  variant: 'thumbnail',
  fallbackToOriginal: true,
});
```

### Delete an Image

```typescript
const deleted = await storageService.deleteImage('imageId123');
```

### List Images

```typescript
// List all images for a user
const images = await storageService.listImages({
  userId: 'user123',
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// List temporary images
const tempImages = await storageService.listImages({
  isTemporary: true,
  olderThan: new Date(Date.now() - 86400000),
});
```

### Clean Up Old Images

```typescript
// Cleanup old temporary files
const result = await storageService.cleanupOldImages({
  olderThan: new Date(Date.now() - 86400000),
  temporaryOnly: true,
  dryRun: false,
});

console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);
```

### Move to Permanent Storage

```typescript
const moved = await storageService.moveToPermanent('imageId123');
```

### Get Storage Statistics

```typescript
const stats = await storageService.getStorageStats();

console.log(`Total images: ${stats.totalImages}`);
console.log(`Total size: ${formatBytes(stats.totalSize)}`);
console.log(`Storage usage: ${formatBytes(stats.storageUsage)} / ${formatBytes(stats.storageLimit)}`);
```

### Batch Delete Images

```typescript
const result = await storageService.batchDeleteImages(['id1', 'id2', 'id3']);
```

### Check Available Space

```typescript
const hasSpace = await storageService.hasAvailableSpace(5242880); // 5MB
```

## API Methods

### S3-like Methods

| Method | S3 Equivalent | Description |
|--------|--------------|-------------|
| `storeImage()` | `putObject()` | Store an image with metadata |
| `getImage()` | `getObject()` | Retrieve an image |
| `deleteImage()` | `deleteObject()` | Delete an image |
| `listImages()` | `listObjects()` | List images by criteria |
| `batchDeleteImages()` | `deleteObjects()` | Batch delete images |

### Additional Methods

| Method | Description |
|--------|-------------|
| `cleanupOldImages()` | Clean up old/temporary images |
| `getStorageStats()` | Get storage usage statistics |
| `moveToPermanent()` | Move from temp to permanent storage |
| `hasAvailableSpace()` | Check if storage has space |
| `getImageUrl()` | Get URL for serving image |

## Image Variants

The service automatically generates the following variants:

| Variant | Size | Quality | Use Case |
|---------|------|---------|----------|
| `thumbnail` | 150px | Low | Thumbnails, avatars |
| `small` | 300px | Medium | Small previews |
| `medium` | 500px | Medium | Medium previews |
| `large` | 1200px | High | Large displays |
| `xlarge` | 1920px | High | Full-size displays |
| `original` | Original | Original | Original upload |

## File Deduplication

When enabled, the service uses SHA-256 checksums to detect duplicate files:

```typescript
// First upload
const image1 = await storageService.storeImage({
  userId: 'user1',
  filename: 'photo.jpg',
  buffer: sameBuffer,
  // ...
});

// Second upload of same file
const image2 = await storageService.storeImage({
  userId: 'user1',
  filename: 'photo-copy.jpg',
  buffer: sameBuffer, // Same buffer
  deduplicate: true,
});

// image2 will be the same as image1 (same ID)
console.log(image1.id === image2.id); // true
```

## Migration to S3/MinIO

The service is designed for easy migration:

1. Set `STORAGE_BACKEND` to `'s3'` or `'minio'`
2. Configure S3/MinIO credentials
3. The same API methods will work without code changes

Example migration:

```typescript
// Before (local)
const image = await storageService.storeImage({ /* ... */ });

// After (S3/MinIO) - same code!
const image = await storageService.storeImage({ /* ... */ });
```

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const image = await storageService.storeImage(options);
} catch (error) {
  if (error.message.includes('File size exceeds')) {
    // Handle file size error
  } else if (error.message.includes('File type')) {
    // Handle file type error
  } else {
    // Handle other errors
  }
}
```

## Storage Limits

Default limits (configurable):

- **Max file size**: 50MB
- **Max storage size**: 10GB
- **Temporary file TTL**: 24 hours
- **Cleanup interval**: 1 hour

## Security Features

- Path traversal protection
- Filename sanitization
- File type validation
- Size validation
- Checksum verification

## Performance Considerations

- **Deduplication**: Uses in-memory cache for checksums
- **Cleanup**: Runs on configurable interval
- **Variants**: Generated asynchronously
- **Batch operations**: Optimized for bulk operations

## Monitoring

Use `getStorageStats()` to monitor:

```typescript
const stats = await storageService.getStorageStats();

// Log to monitoring service
monitoringService.gauge('storage.total_images', stats.totalImages);
monitoringService.gauge('storage.total_size', stats.totalSize);
monitoringService.gauge('storage.temp_images', stats.tempImages);
monitoringService.gauge('storage.permanent_images', stats.permanentImages);
monitoringService.gauge('storage.usage_percent', (stats.storageUsage / stats.storageLimit) * 100);
```

## Best Practices

1. **Use temporary storage for uploads**: Store uploads as temporary first
2. **Move to permanent when needed**: Use `moveToPermanent()` after validation
3. **Enable deduplication**: Reduces storage usage
4. **Monitor storage usage**: Use `getStorageStats()` regularly
5. **Configure appropriate TTL**: Set TTL based on your use case
6. **Use variants**: Always generate variants for better performance
7. **Handle errors**: Always wrap calls in try-catch

## Example: Complete Upload Flow

```typescript
import { storageService } from './services/storageService';

async function uploadImage(userId: string, tokenId: string, file: File) {
  try {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimetype = file.type;

    // Check available space
    if (!(await storageService.hasAvailableSpace(buffer.length))) {
      throw new Error('Insufficient storage space');
    }

    // Store as temporary
    const image = await storageService.storeImage({
      userId,
      tokenId,
      filename: file.name,
      buffer,
      mimetype,
      isTemporary: true,
      ttl: 3600000, // 1 hour
      generateVariants: true,
      deduplicate: true,
    });

    // Validate image (your validation logic)
    const isValid = await validateImage(image);

    if (isValid) {
      // Move to permanent storage
      await storageService.moveToPermanent(image.id);
      return { success: true, image };
    } else {
      // Delete invalid image
      await storageService.deleteImage(image.id);
      return { success: false, error: 'Invalid image' };
    }
  } catch (error) {
    logger.error('Upload failed:', error);
    throw error;
  }
}
```

## Troubleshooting

### Images not appearing

1. Check directory permissions
2. Verify `STORAGE_BASE_PATH` configuration
3. Check storage limits

### Cleanup not running

1. Verify `STORAGE_CLEANUP_INTERVAL` is set
2. Check server logs for errors
3. Manually trigger cleanup for testing

### Deduplication not working

1. Ensure `STORAGE_ENABLE_DEDUPLICATION=true`
2. Check that `deduplicate: true` is passed to `storeImage()`
3. Verify checksum cache is not cleared

## License

MIT
