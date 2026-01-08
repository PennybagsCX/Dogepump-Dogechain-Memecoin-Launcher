# Image Upload System - Quick Start Guide

## For Developers

### Basic Usage

```typescript
import { uploadImage, deleteImage, listImages } from './services/backendService';

// Upload an image
const handleUpload = async (file: File) => {
  const response = await uploadImage(file, (progress) => {
    console.log(`Progress: ${progress}%`);
  });

  if (response.success) {
    console.log('Image ID:', response.image.id);
    console.log('Image URL:', response.image.url);
  }
};

// List user's images
const getMyImages = async () => {
  const result = await listImages({ page: 1, limit: 20 });
  console.log('Images:', result.images);
};

// Delete an image
const removeImage = async (imageId: string) => {
  await deleteImage(imageId);
};
```

### React Component Example

```tsx
import { useState } from 'react';
import { uploadImage } from '../services/backendService';

function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const response = await uploadImage(file, (prog) => {
        setProgress(prog);
      });

      if (response.success) {
        const fullUrl = `http://localhost:3001${response.image.url}`;
        setImageUrl(fullUrl);
      }
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
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max={100} />}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
}
```

## API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/images/upload` | Required | Upload new image |
| GET | `/api/images/:id` | None | Get image |
| GET | `/api/images/:id?variant=thumbnail` | None | Get image variant |
| GET | `/api/images/:id/metadata` | Required | Get image metadata |
| DELETE | `/api/images/:id` | Required | Delete image |
| GET | `/api/images` | Required | List user's images |
| POST | `/api/images/validate` | Required | Validate without upload |

## Configuration

Add to your `.env` file:

```bash
# Required
DATABASE_URL=postgresql://localhost:5432/dogepump_dev
CORS_ORIGIN=http://localhost:3005

# Optional (with defaults)
STORAGE_BASE_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB
IMAGE_QUALITY_HIGH=90
IMAGE_QUALITY_MEDIUM=75
IMAGE_QUALITY_LOW=60
```

## Common Issues

### "Session expired" error
- User needs to log in again
- Check JWT token expiration

### "File too large" error
- Reduce file size or increase `MAX_FILE_SIZE`
- Default limit is 10MB

### "Invalid file format" error
- Supported formats: JPEG, PNG, WebP, AVIF, GIF
- Check file extension and magic number

### Image not displaying
- Check browser console for CORS errors
- Verify `Cross-Origin-Resource-Policy` header is `cross-origin`
- Ensure image ID is valid

## File Storage

Images are stored at:
```
uploads/permanent/{userId}/{imageId}.{format}
```

Variants are at:
```
uploads/permanent/{userId}/variants/{variantName}/{imageId}.{format}
```

## Database Queries

### Get user's images
```sql
SELECT id, filename, original_filename, size, width, height, created_at
FROM images
WHERE user_id = $1 AND is_deleted = false
ORDER BY created_at DESC;
```

### Get image storage info
```sql
SELECT
  user_id,
  COUNT(*) as image_count,
  SUM(size) as total_size
FROM images
WHERE user_id = $1 AND is_deleted = false
GROUP BY user_id;
```

## Testing

```bash
# Test upload (requires auth token)
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png"

# Test get image
curl http://localhost:3001/api/images/IMAGE_ID

# Test delete (requires auth token)
curl -X DELETE http://localhost:3001/api/images/IMAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Need more details?** See [IMAGE_UPLOAD_SYSTEM.md](./IMAGE_UPLOAD_SYSTEM.md)
