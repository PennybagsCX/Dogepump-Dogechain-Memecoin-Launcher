# Dogepump Backend API

A Fastify-based backend API for the Dogepump Dogechain Memecoin Launcher, featuring image upload, authentication, and comment management.

## Features

- **Fastify Server**: High-performance web framework
- **Image Upload**: Support for image uploads with validation
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Built-in rate limiting for API protection
- **TypeScript**: Fully typed codebase
- **CORS**: Configured for frontend communication
- **Error Handling**: Comprehensive error handling middleware

## Project Structure

```
server/
├── index.ts              # Main server entry point
├── config.ts             # Configuration management
├── middleware/           # Custom middleware
│   ├── auth.ts          # JWT authentication
│   ├── validation.ts    # Request validation
│   ├── rateLimit.ts     # Rate limiting
│   ├── upload.ts        # File upload handling
│   └── errorHandler.ts  # Error handling
├── routes/              # API routes
│   ├── images.ts        # Image endpoints
│   ├── auth.ts          # Authentication endpoints
│   └── comments.ts      # Comment endpoints
├── services/            # Business logic
│   └── imageService.ts  # Image service
├── utils/               # Utility functions
│   ├── logger.ts        # Logging utility
│   └── jwt.ts           # JWT utilities
└── types/               # TypeScript type definitions
    └── index.ts         # Shared types
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
JWT_SECRET=your-secret-key-change-in-production
```

## Running the Server

### Development Mode
```bash
npm run server
```

This uses `tsx watch` for hot-reloading during development.

### Production Build
```bash
npm run server:build
```

This compiles the TypeScript code to JavaScript in the `dist/server` directory.

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Images
- `POST /api/images/upload` - Upload an image (requires auth)
- `GET /api/images/:imageId` - Get image by ID (requires auth)
- `DELETE /api/images/:imageId` - Delete image (requires auth)
- `GET /api/images/` - List user's images (requires auth)

### Comments
- `POST /api/comments/` - Create a comment (requires auth)
- `POST /api/comments/with-image` - Create comment with image (requires auth)
- `GET /api/comments/` - Get all comments
- `GET /api/comments/:commentId` - Get comment by ID
- `PUT /api/comments/:commentId` - Update comment (requires auth)
- `DELETE /api/comments/:commentId` - Delete comment (requires auth)
- `GET /api/comments/image/:imageId` - Get comments for an image

## File Upload

### Supported File Types
- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

### File Size Limit
- Default: 10MB (configurable via `MAX_FILE_SIZE` environment variable)

### Upload Example
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rate Limiting

- Default: 100 requests per minute per IP
- Custom rate limiters can be applied to specific routes
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "error": "Error Type",
  "message": "Error message",
  "details": {}
}
```

## Security Best Practices

1. **JWT Secret**: Always use a strong, random JWT secret in production
2. **CORS**: Configure CORS origin to match your frontend domain
3. **Rate Limiting**: Adjust rate limits based on your needs
4. **File Validation**: All uploaded files are validated for type and size
5. **HTTPS**: Use HTTPS in production
6. **Environment Variables**: Never commit `.env.local` to version control

## TODO

The following features are placeholders and need implementation:

- Database integration (PostgreSQL, MongoDB, etc.)
- User registration and login with database
- Image storage (S3, Cloudinary, or local filesystem)
- Comment CRUD operations with database
- Image processing (resizing, compression)
- Refresh token management
- User profile management

## Development

### Adding New Routes

1. Create a new route file in `server/routes/`
2. Export a default async function that takes `FastifyInstance`
3. Register the route in `server/index.ts`

Example:
```typescript
import { FastifyInstance } from 'fastify';

export default async function myRoutes(fastify: FastifyInstance) {
  fastify.get('/endpoint', async (request, reply) => {
    return { message: 'Hello World' };
  });
}
```

### Adding Middleware

1. Create middleware in `server/middleware/`
2. Apply to routes using `preHandler` option

## License

MIT
