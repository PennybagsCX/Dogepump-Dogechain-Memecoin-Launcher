# Image Upload System - Integration Guide

Complete guide for integrating image upload functionality across the platform.

## Table of Contents

1. [Overview](#overview)
2. [Integrated Features](#integrated-features)
3. [Profile Avatar Upload](#profile-avatar-upload)
4. [Token Logo Upload](#token-logo-upload)
5. [Comment Image Upload](#comment-image-upload)
6. [Unified Architecture](#unified-architecture)
7. [Benefits of Integration](#benefits-of-integration)
8. [Implementation Examples](#implementation-examples)
9. [Best Practices](#best-practices)
10. [Migration Guide](#migration-guide)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Image Upload System provides seamless integration with various platform features, enabling users to upload and manage images for different purposes. All integrated features share the same underlying infrastructure, ensuring consistent security, processing, and storage across the platform.

### Key Benefits

- **Unified Infrastructure**: All image uploads use the same secure, validated, and optimized pipeline
- **Consistent Security**: Same validation and security checks across all uploads
- **Automatic Processing**: Uniform image processing and variant generation
- **Centralized Management**: Single point of control for image configuration
- **Developer Experience**: Consistent API patterns and error handling
- **User Experience**: Fast uploads with instant preview and responsive images

### Integration Points

The image upload system integrates with three main features:

1. **Profile Avatar Upload** - User profile picture management
2. **Token Logo Upload** - Memecoin token logo management
3. **Comment Image Upload** - Image attachments in comments

Each integration is documented in detail below with implementation details, API endpoints, usage examples, and best practices.

---

## Integrated Features

### Profile Avatar Upload

Users can upload and manage their profile avatars through the authentication system. The avatar upload is integrated via the profile update endpoint, allowing users to change their profile picture at any time.

#### Implementation Details

- **Endpoint**: `PATCH /api/auth/me`
- **Route File**: [`server/routes/auth.ts`](./routes/auth.ts:313)
- **Authentication**: Required (JWT token)
- **Content Type**: `multipart/form-data`

#### Features

- **Avatar Storage**: Profile images are stored permanently with user association
- **Automatic Processing**: Images are automatically resized and optimized
- **Variant Generation**: Multiple sizes for different UI contexts (thumbnail, small, medium, large)
- **Security**: All standard security validations apply (magic number, malware detection, XSS prevention)
- **User Control**: Users can update their avatar at any time
- **Privacy**: EXIF data is stripped for user privacy

#### Supported Image Formats

- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

#### File Size Limits

- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

#### Dimension Limits

- Minimum: 32x32 pixels
- Maximum: 4096x4096 pixels
- Aspect Ratio: 0.1 to 10

#### API Endpoint

**PATCH** `/api/auth/me`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `avatar` (optional): Image file for profile avatar
- `username` (optional): New username
- `walletAddress` (optional): Wallet address

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

#### Usage Examples

**cURL:**
```bash
curl -X PATCH http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-access-token>" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "username=newusername"
```

**JavaScript/TypeScript:**
```typescript
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
    console.log('Avatar URL:', data.user.avatarUrl);
  });
```

**React Component:**
```typescript
import { useState } from 'react';

function ProfileAvatarUpload() {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!avatar) return;

    const formData = new FormData();
    formData.append('avatar', avatar);

    setUploading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Profile updated:', result.user);
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
        onChange={(e) => setAvatar(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Avatar'}
      </button>
    </div>
  );
}
```

---

### Token Logo Upload

Memecoin creators can upload logos for their tokens during token creation or management. The token logo upload integrates with the token management system, providing consistent branding across the platform.

#### Implementation Details

- **Endpoint**: `POST /api/tokens` (with logo file)
- **Route File**: Token management routes
- **Authentication**: Required (JWT token)
- **Content Type**: `multipart/form-data`

#### Features

- **Token Association**: Logos are linked to specific tokens
- **Brand Identity**: Consistent branding across the platform
- **Multiple Formats**: Support for various image formats
- **Optimization**: Automatic resizing for optimal display
- **Variant Support**: Different sizes for cards, lists, and detail views
- **Security**: Full security validation on all uploads
- **Deduplication**: Content-based deduplication saves storage space

#### Supported Image Formats

- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

#### File Size Limits

- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

#### Dimension Limits

- Minimum: 32x32 pixels
- Maximum: 4096x4096 pixels
- Aspect Ratio: 0.1 to 10

#### API Endpoint

**POST** `/api/tokens`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `logo` (optional): Image file for token logo
- `name` (required): Token name
- `symbol` (required): Token symbol
- `description` (optional): Token description

**Response (201 Created):**
```json
{
  "success": true,
  "token": {
    "id": "token_abc123def456",
    "name": "MyToken",
    "symbol": "MTK",
    "logoUrl": "/api/images/img_token_abc123def456",
    "logoVariants": {
      "thumbnail": "/api/images/img_token_abc123def456?variant=thumbnail",
      "small": "/api/images/img_token_abc123def456?variant=small",
      "medium": "/api/images/img_token_abc123def456?variant=medium"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
- `401 Unauthorized`: Missing or invalid token
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error

#### Usage Examples

**cURL:**
```bash
curl -X POST http://localhost:3001/api/tokens \
  -H "Authorization: Bearer <your-access-token>" \
  -F "logo=@/path/to/logo.png" \
  -F "name=MyToken" \
  -F "symbol=MTK" \
  -F "description=My awesome token"
```

**JavaScript/TypeScript:**
```typescript
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
    console.log('Logo URL:', data.token.logoUrl);
  });
```

**React Component:**
```typescript
import { useState } from 'react';

function TokenLogoUpload() {
  const [logo, setLogo] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!logo || !name || !symbol) return;

    const formData = new FormData();
    formData.append('logo', logo);
    formData.append('name', name);
    formData.append('symbol', symbol);

    setUploading(true);
    try {
      const response = await fetch('http://localhost:3001/api/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Token created:', result.token);
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
        onChange={(e) => setLogo(e.target.files?.[0] || null)}
      />
      <input
        type="text"
        placeholder="Token Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Token Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Creating Token...' : 'Create Token'}
      </button>
    </div>
  );
}
```

---

### Comment Image Upload

Users can attach images to their comments, enabling rich discussions and visual sharing. The comment image upload is integrated via a dedicated endpoint that handles both the comment text and image in a single request.

#### Implementation Details

- **Endpoint**: `POST /api/comments/with-image`
- **Route File**: [`server/routes/comments.ts`](./routes/comments.ts:91)
- **Authentication**: Required (JWT token)
- **Content Type**: `multipart/form-data`

#### Features

- **Seamless Integration**: Upload image and comment in single request
- **Automatic Processing**: Images are processed and optimized
- **Variant Generation**: Multiple sizes for different display contexts
- **Security**: Full security validation on all uploads
- **Content Association**: Images are linked to specific comments
- **User Control**: Users can attach images to enhance their comments

#### Supported Image Formats

- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/avif` (`.avif`)
- `image/gif` (`.gif`)

#### File Size Limits

- JPEG: 10MB
- PNG: 10MB
- WebP: 10MB
- AVIF: 20MB
- GIF: 5MB

#### Dimension Limits

- Minimum: 32x32 pixels
- Maximum: 4096x4096 pixels
- Aspect Ratio: 0.1 to 10

#### API Endpoint

**POST** `/api/comments/with-image`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `content` (required): Comment text
- `image` (required): Image file to attach

**Response (201 Created):**
```json
{
  "success": true,
  "comment": {
    "id": "comment_abc123def456",
    "content": "Check out this image!",
    "userId": "user_abc123def456",
    "username": "username",
    "imageId": "img_abc123def456789",
    "imageUrl": "/api/images/img_abc123def456789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "image": {
    "id": "img_abc123def456789",
    "url": "/api/images/img_abc123def456789",
    "filename": "image_1234567890_abc123.jpg"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, validation failed
- `401 Unauthorized`: Missing or invalid token
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error

#### Usage Examples

**cURL:**
```bash
curl -X POST http://localhost:3001/api/comments/with-image \
  -H "Authorization: Bearer <your-access-token>" \
  -F "content=Check out this image!" \
  -F "image=@/path/to/image.jpg"
```

**JavaScript/TypeScript:**
```typescript
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

**React Component:**
```typescript
import { useState } from 'react';

function CommentWithImage() {
  const [image, setImage] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!image || !content) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('image', image);

    setUploading(true);
    try {
      const response = await fetch('http://localhost:3001/api/comments/with-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Comment created:', result.comment);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Posting...' : 'Post Comment'}
      </button>
    </div>
  );
}
```

---

## Unified Architecture

All integrated features share the same underlying image upload infrastructure, ensuring consistency across the platform.

### Shared Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                        │
│                 (React Frontend)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Profile    │  │   Token      │  │   Comments   │   │
│  │   Avatar     │  │   Logo       │  │   Images     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Fastify Server                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Middleware Layer                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  │   Auth       │  │ Rate Limit   │  │   Upload     │   │
│  │  │ Middleware   │  │ Middleware   │  │   Middleware   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Route Handlers                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  │ /auth/me     │  │ /tokens      │  │ /comments     │   │
│  │  │ (Profile)    │  │ (Logo)       │  │ (Images)     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Security Service                        │  │
│  │  • File Signature Validation                             │  │
│  │  • Malware Detection                                     │  │
│  │  • XSS Prevention                                        │  │
│  │  • EXIF Data Handling                                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Image Service                           │  │
│  │  • Image Processing (Sharp)                              │  │
│  │  • Variant Generation                                    │  │
│  │  • Format Conversion                                    │  │
│  │  • Compression                                           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Storage Service                         │  │
│  │  • File Storage (Local/S3/MinIO)                         │  │
│  │  • Deduplication                                        │  │
│  │  • Cleanup Management                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Storage Layer                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Local Filesystem                         │  │
│  │  ./uploads/temp/                                          │  │
│  │  ./uploads/permanent/                                     │  │
│  │  ./uploads/avatars/                                       │  │
│  │  ./uploads/tokens/                                       │  │
│  │  ./uploads/comments/                                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Cloud Storage (Optional)                 │  │
│  │  • Amazon S3                                             │  │
│  │  • MinIO                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Shared Services

#### Security Service

All image uploads go through the same security validation:
- **File Signature Validation**: Verify file signatures (magic numbers)
- **Malware Detection**: Pattern-based detection for suspicious content
- **XSS Prevention**: Sanitize content to prevent attacks
- **EXIF Validation**: Check for suspicious metadata
- **EXIF Stripping**: Remove EXIF data for privacy
- **Path Traversal Prevention**: Sanitize filenames

#### Image Service

All images are processed using the same pipeline:
- **Image Processing**: Using Sharp for high-performance image processing
- **Variant Generation**: Automatic generation of multiple size variants
  - Thumbnail: 150x150px
  - Small: 300x300px
  - Medium: 500x500px
  - Large: 1200x1200px
  - Extra Large: 1920x1920px
- **Format Conversion**: Convert between supported formats
- **Compression**: Adjustable quality levels (high: 90%, medium: 75%, low: 60%)
- **Progressive Loading**: Enable progressive JPEG/PNG
- **Metadata Stripping**: Remove EXIF data for privacy

#### Storage Service

All images are stored using the same storage infrastructure:
- **Deduplication**: Content-based deduplication across all image types
- **Automatic Cleanup**: Scheduled cleanup of temporary files
- **Storage Statistics**: Track usage and limits
- **Batch Operations**: Efficient batch processing

---

## Benefits of Integration

### Unified Architecture

All integrated features share the same underlying infrastructure, providing:

- **Consistent Security**: Same validation and security checks across all uploads
- **Optimized Storage**: Content-based deduplication across all image types
- **Automatic Processing**: Uniform image processing and variant generation
- **Centralized Management**: Single point of control for image configuration
- **Unified Error Handling**: Consistent error responses and validation

### Developer Experience

- **Simple API**: Consistent endpoint patterns for all features
- **Type Safety**: Full TypeScript support with proper type definitions
- **Error Handling**: Unified error responses and validation
- **Documentation**: Comprehensive API documentation for all endpoints
- **Code Reusability**: Shared services reduce code duplication

### User Experience

- **Fast Uploads**: Optimized upload process with progress tracking
- **Instant Preview**: Immediate availability of uploaded images
- **Responsive Images**: Automatic serving of appropriate image sizes
- **Secure Storage**: All images protected with authentication
- **Consistent UI**: Familiar patterns across all features

### Operational Benefits

- **Easier Maintenance**: Single infrastructure to maintain
- **Unified Monitoring**: Centralized logging and metrics
- **Scalability**: Shared storage and processing resources
- **Cost Efficiency**: Deduplication reduces storage costs
- **Performance**: Optimized image processing and caching

---

## Implementation Examples

### Complete Profile Management Example

```typescript
import { useState, useEffect } from 'react';

function ProfileManager() {
  const [user, setUser] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load user profile on mount
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setUser(data.user))
      .catch(error => console.error('Failed to load profile:', error));
  }, []);

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      setUser(result.user);
      console.log('Profile updated:', result.user);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-manager">
      <h2>Profile Settings</h2>
      
      {user && (
        <div className="current-avatar">
          <img 
            src={user.avatarUrl} 
            alt="Profile Avatar"
            className="avatar-image"
          />
          <p>Current avatar URL: {user.avatarUrl}</p>
        </div>
      )}

      <div className="avatar-upload">
        <h3>Update Avatar</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
        />
        <button 
          onClick={handleAvatarUpload} 
          disabled={uploading || !avatarFile}
        >
          {uploading ? 'Uploading...' : 'Upload New Avatar'}
        </button>
      </div>
    </div>
  );
}
```

### Token Creation with Logo Example

```typescript
import { useState } from 'react';

function TokenCreator() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleCreateToken = async () => {
    if (!logoFile || !name || !symbol) {
      alert('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('name', name);
    formData.append('symbol', symbol);
    formData.append('description', description);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Token created:', result.token);
      
      // Reset form
      setLogoFile(null);
      setName('');
      setSymbol('');
      setDescription('');
    } catch (error) {
      console.error('Creation failed:', error);
      alert('Failed to create token. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="token-creator">
      <h2>Create New Token</h2>
      
      <div className="logo-upload">
        <h3>Token Logo</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
        />
        <p>Recommended: Square image, at least 200x200px</p>
      </div>

      <div className="token-details">
        <h3>Token Information</h3>
        <input
          type="text"
          placeholder="Token Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Token Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <textarea
          placeholder="Token Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button 
        onClick={handleCreateToken} 
        disabled={uploading}
      >
        {uploading ? 'Creating Token...' : 'Create Token'}
      </button>
    </div>
  );
}
```

### Comment System with Image Support

```typescript
import { useState, useEffect } from 'react';

function CommentSystem() {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load comments on mount
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/comments', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setComments(data.comments || []))
      .catch(error => console.error('Failed to load comments:', error));
  }, []);

  const handlePostComment = async () => {
    if (!content) {
      alert('Please enter a comment');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = imageFile 
        ? 'http://localhost:3001/api/comments/with-image'
        : 'http://localhost:3001/api/comments';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Comment posted:', result.comment);
      
      // Reset form
      setContent('');
      setImageFile(null);
    } catch (error) {
      console.error('Post failed:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="comment-system">
      <h2>Comments</h2>
      
      <div className="comment-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <img 
              src={comment.imageUrl} 
              alt="Comment Image"
              className="comment-image"
            />
            <div className="comment-content">
              <p><strong>{comment.username}</strong></p>
              <p>{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="comment-form">
        <textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <button 
          onClick={handlePostComment} 
          disabled={uploading || !content}
        >
          {uploading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}
```

---

## Best Practices

### Image Upload Best Practices

1. **Client-Side Validation**
   - Validate file type and size before uploading
   - Check image dimensions before sending
   - Show preview before uploading
   - Provide clear error messages to users

2. **Choose Appropriate Formats**
   - Use WebP for web images (smaller file size, good quality)
   - Use JPEG for photographs
   - Use PNG for graphics with transparency
   - Avoid AVIF for older browser compatibility

3. **Optimize File Size**
   - Compress images before upload when possible
   - Use appropriate dimensions for the intended use
   - Avoid unnecessarily large files

4. **Handle Errors Gracefully**
   - Provide clear, actionable error messages
   - Implement retry logic for failed uploads
   - Show upload progress for large files
   - Handle network timeouts gracefully

5. **Security Considerations**
   - Always use HTTPS in production
   - Never trust client-side validation
   - Implement proper authentication
   - Sanitize all user inputs
   - Use CSRF tokens for state-changing operations

6. **Performance Optimization**
   - Use image variants for different screen sizes
   - Implement lazy loading for images
   - Use CDN for static assets in production
   - Cache frequently accessed images
   - Compress responses

7. **User Experience**
   - Show upload progress indicators
   - Provide immediate preview after upload
   - Allow users to cancel uploads in progress
   - Show file size and format information
   - Implement drag-and-drop for better UX

8. **Storage Management**
   - Enable content-based deduplication
   - Implement automatic cleanup of temporary files
   - Monitor storage usage and set alerts
   - Use appropriate storage backend for scale
   - Implement backup strategy for important images

### API Integration Best Practices

1. **Authentication Management**
   - Store tokens securely (use localStorage or secure storage)
   - Implement token refresh logic
   - Handle token expiration gracefully
   - Clear tokens on logout

2. **Request Optimization**
   - Use appropriate HTTP methods (GET, POST, PATCH, DELETE)
   - Implement request batching when appropriate
   - Use connection pooling for multiple requests
   - Cache API responses when appropriate

3. **Error Handling**
   - Implement centralized error handling
   - Parse error responses correctly
   - Show user-friendly error messages
   - Log errors for debugging
   - Implement retry logic with exponential backoff

4. **Type Safety**
   - Use TypeScript for type safety
   - Define proper interfaces for API requests/responses
   - Validate data at compile time
   - Use proper type assertions

---

## Migration Guide

### Migrating from Standalone Image Upload

If you have existing standalone image upload functionality, follow these steps to migrate to the integrated system:

#### Step 1: Update Authentication

Replace standalone image upload with integrated profile avatar upload:

**Before:**
```typescript
// Standalone image upload
const formData = new FormData();
formData.append('file', imageFile);

fetch('/api/images/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

**After:**
```typescript
// Integrated profile avatar upload
const formData = new FormData();
formData.append('avatar', avatarFile);
formData.append('username', 'newusername');

fetch('/api/auth/me', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

#### Step 2: Update Token Creation

Replace standalone token creation with integrated token logo upload:

**Before:**
```typescript
// Standalone token creation
const formData = new FormData();
formData.append('name', 'MyToken');
formData.append('symbol', 'MTK');
```

**After:**
```typescript
// Integrated token creation with logo
const formData = new FormData();
formData.append('logo', logoFile);
formData.append('name', 'MyToken');
formData.append('symbol', 'MTK');
formData.append('description', 'My awesome token');

fetch('/api/tokens', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

#### Step 3: Update Comment System

Replace standalone comment creation with integrated comment image upload:

**Before:**
```typescript
// Standalone comment creation
const formData = new FormData();
formData.append('content', 'Great post!');

fetch('/api/comments', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

**After:**
```typescript
// Integrated comment creation with image
const formData = new FormData();
formData.append('content', 'Check out this image!');
formData.append('image', imageFile);

fetch('/api/comments/with-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

#### Step 4: Update Image Retrieval

Replace standalone image retrieval with integrated variant support:

**Before:**
```typescript
// Standalone image retrieval
fetch(`/api/images/${imageId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**After:**
```typescript
// Integrated image retrieval with variant support
fetch(`/api/images/${imageId}?variant=thumbnail`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

#### Step 5: Update Error Handling

Replace standalone error handling with unified error responses:

**Before:**
```typescript
// Standalone error handling
if (error) {
  console.error('Upload failed:', error);
}
```

**After:**
```typescript
// Unified error handling
if (error) {
  console.error('Upload failed:', error);
  alert(`Upload failed: ${error.message}`);
}
```

### Migration Benefits

- **Improved Security**: All uploads go through same security validations
- **Better UX**: Consistent patterns and error messages
- **Reduced Code Duplication**: Shared services reduce code
- **Easier Maintenance**: Single infrastructure to maintain
- **Enhanced Features**: Automatic variant generation and deduplication

---

## Troubleshooting

### Common Issues

#### Issue: Avatar Upload Fails

**Symptom:** Avatar upload returns error

**Possible Causes:**
- Invalid image format
- File too large
- Network timeout
- Invalid token

**Solutions:**
1. Check image format and size before uploading
2. Verify token is valid and not expired
3. Check network connection
4. Review server logs for detailed error messages
5. Ensure image dimensions meet requirements (32x32 to 4096x4096)

#### Issue: Token Logo Not Displaying

**Symptom:** Token logo uploaded but not showing

**Possible Causes:**
- Image processing failed
- Invalid image URL returned
- Browser caching issue
- Network error during retrieval

**Solutions:**
1. Verify logo URL is correct
2. Check browser console for errors
3. Clear browser cache
4. Test image URL directly in browser
5. Check server logs for processing errors

#### Issue: Comment Image Not Loading

**Symptom:** Comment posted but image not displaying

**Possible Causes:**
- Image upload failed
- Invalid image ID
- Network timeout
- CORS error

**Solutions:**
1. Check image upload response
2. Verify image ID is correct
3. Check network requests in browser dev tools
4. Ensure proper authentication headers
5. Review server logs for errors

#### Issue: File Too Large

**Symptom:** Upload fails with file size error

**Possible Causes:**
- Image exceeds size limit
- Incorrect file size calculation

**Solutions:**
1. Check image file size before uploading
2. Compress image if possible
3. Use appropriate image format (WebP for smaller size)
4. Review file size limits in configuration

#### Issue: Invalid File Type

**Symptom:** Upload fails with invalid file type error

**Possible Causes:**
- File is not a supported image format
- File extension doesn't match content type
- Corrupted file

**Solutions:**
1. Verify file is a valid image format (JPEG, PNG, WebP, AVIF, GIF)
2. Check file extension matches content type
3. Try opening file in image viewer to verify it's valid
4. Use a different file if current one is corrupted

### Debugging Tips

1. **Enable Debug Logging**
   ```bash
   # Set in .env
   LOG_LEVEL=debug
   ```

2. **Check Server Logs**
   ```bash
   # Run server and watch logs
   npm run server
   ```

3. **Monitor Network Requests**
   - Use browser dev tools Network tab
   - Check request/response headers
   - Verify authentication headers are included

4. **Test API Endpoints Directly**
   ```bash
   # Test authentication
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456"}'

   # Test image upload
   curl -X POST http://localhost:3001/api/images/upload \
     -H "Authorization: Bearer <token>" \
     -F "file=@test.jpg"
   ```

5. **Validate Image Files**
   - Check file size: `ls -lh image.jpg`
   - Check image dimensions: Use image viewer or `file` command
   - Verify file format: `file image.jpg`

6. **Check Configuration**
   ```bash
   # Verify environment variables
   cat .env | grep IMAGE_
   ```

---

## Additional Resources

- [Complete System Documentation](./IMAGE_UPLOAD_SYSTEM.md) - Comprehensive system overview
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Quick Start Guide](../QUICKSTART.md) - Get started quickly
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment instructions
- [Troubleshooting Guide](../TROUBLESHOOTING.md) - Common issues and solutions

---

## Support

For issues, questions, or contributions related to image upload integrations:

1. Review this integration guide
2. Check [Complete System Documentation](./IMAGE_UPLOAD_SYSTEM.md)
3. Check [API Reference](./API_REFERENCE.md)
4. Review [Quick Start Guide](../QUICKSTART.md)
5. Check server logs: `npm run server`
6. Open an issue in the repository

---

**Ready to integrate?** Follow the examples in this guide to seamlessly add image upload functionality to your platform features.
