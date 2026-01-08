# Authentication and Authorization System

A complete, production-ready authentication and authorization system with JWT tokens, role-based access control, and comprehensive security features.

## Features

### Authentication
- **User Registration** with email validation
- **User Login** with secure password verification
- **JWT Access Tokens** (15 min expiry)
- **JWT Refresh Tokens** (7 days expiry)
- **Token Refresh Mechanism**
- **Password Hashing** with bcrypt (10 rounds)
- **Session Management** with automatic cleanup
- **Token Blacklisting** for logout
- **Rate Limiting** for auth endpoints (5 attempts per 15 minutes)

### Authorization
- **Role-Based Access Control** (user, admin)
- **Permission-Based Authorization**
- **User Ownership Validation**
- **Admin-Only Endpoints**
- **Fine-Grained Permissions**

### Security
- **Password Strength Validation**
- **Common Password Detection**
- **Disposable Email Detection**
- **Input Sanitization**
- **Brute Force Protection**
- **Session Limiting** (max 5 sessions per user)

## Configuration

Add these environment variables to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Authentication Configuration
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false

# Username Requirements
USERNAME_MIN_LENGTH=3
USERNAME_MAX_LENGTH=20

# Token Management
BCRYPT_ROUNDS=10
MAX_SESSIONS_PER_USER=5
SESSION_CLEANUP_INTERVAL=3600000

# Auth Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
```

## API Endpoints

### Public Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "walletAddress": "0x123...abc" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register response

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### Authenticated Endpoints

All authenticated endpoints require an `Authorization` header:

```http
Authorization: Bearer <access_token>
```

#### Get Current User
```http
GET /api/auth/me
```

#### Update Profile
```http
PATCH /api/auth/me
Content-Type: application/json

{
  "username": "newusername",
  "walletAddress": "0x456...def"
}
```

#### Change Password
```http
POST /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout All Devices
```http
POST /api/auth/logout-all
```

#### Verify Token
```http
GET /api/auth/verify
```

#### Get Permissions
```http
GET /api/auth/permissions
```

**Response:**
```json
{
  "success": true,
  "role": "user",
  "permissions": [
    "image:upload",
    "image:read",
    "image:update",
    "user:read",
    "user:update"
  ]
}
```

### Admin Endpoints

#### Get All Users
```http
GET /api/auth/admin/users
Authorization: Bearer <admin_token>
```

#### Update User Role
```http
PATCH /api/auth/admin/users/:userId/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Deactivate User
```http
POST /api/auth/admin/users/:userId/deactivate
Authorization: Bearer <admin_token>
```

#### Activate User
```http
POST /api/auth/admin/users/:userId/activate
Authorization: Bearer <admin_token>
```

#### Delete User
```http
DELETE /api/auth/admin/users/:userId
Authorization: Bearer <admin_token>
```

#### Get Stats
```http
GET /api/auth/admin/stats
Authorization: Bearer <admin_token>
```

## Middleware Usage

### Authentication Middleware

Protect routes that require authentication:

```typescript
import { authMiddleware } from '../middleware/auth.js';

fastify.get('/protected', {
  preHandler: authMiddleware,
}, async (request, reply) => {
  // Access request.user and request.userId
  const userId = request.userId;
  const user = request.user;
});
```

### Role-Based Authorization

Require specific roles:

```typescript
import { requireRole } from '../middleware/auth.js';

fastify.get('/admin-only', {
  preHandler: [authMiddleware, requireRole('admin')],
}, async (request, reply) => {
  // Only admins can access
});
```

### Permission-Based Authorization

Require specific permissions:

```typescript
import { requirePermission } from '../middleware/auth.js';

fastify.delete('/images/:imageId', {
  preHandler: [authMiddleware, requirePermission('image:delete')],
}, async (request, reply) => {
  // Only users with image:delete permission can access
});
```

### Ownership Validation

Ensure users can only access their own resources:

```typescript
import { requireOwnership } from '../middleware/auth.js';

fastify.patch('/users/:userId/profile', {
  preHandler: [authMiddleware, requireOwnership('userId')],
}, async (request, reply) => {
  // Users can only update their own profile (admins can access any)
});
```

### Combined Middleware

Combine authentication and authorization:

```typescript
import { requireAuthWithPermission } from '../middleware/auth.js';

fastify.post('/images', {
  preHandler: requireAuthWithPermission('image:upload'),
}, async (request, reply) => {
  // Authenticated and has permission
});
```

### Optional Authentication

Allow both authenticated and anonymous users:

```typescript
import { optionalAuth } from '../middleware/auth.js';

fastify.get('/public-data', {
  preHandler: optionalAuth,
}, async (request, reply) => {
  if (request.user) {
    // Authenticated user
  } else {
    // Anonymous user
  }
});
```

## Permissions

### User Role Permissions
- `image:upload` - Upload images
- `image:read` - View images
- `image:update` - Update own images
- `user:read` - View own profile
- `user:update` - Update own profile

### Admin Role Permissions
All user permissions plus:
- `image:delete` - Delete any image
- `user:delete` - Delete users
- `admin:all` - All admin operations

## Password Requirements

Default password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: special characters (configurable)

Common passwords are automatically rejected.

## Username Requirements

- 3-20 characters
- Only letters, numbers, and underscores
- Cannot start or end with underscore
- No consecutive underscores
- Reserved usernames are blocked

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute force attacks:
- 5 attempts per 15 minutes per IP address
- After exceeding limit, user must wait for reset

## Session Management

- Maximum 5 concurrent sessions per user
- Oldest session is automatically removed when limit is exceeded
- Sessions expire after 7 days (refresh token expiry)
- Expired sessions are automatically cleaned up

## Token Management

### Access Token
- Short-lived (15 minutes by default)
- Used for API authentication
- Sent in `Authorization: Bearer <token>` header

### Refresh Token
- Long-lived (7 days by default)
- Used to obtain new access tokens
- Stored securely on client-side
- Can be revoked (logout)

### Token Refresh Flow

1. Client sends refresh token to `/api/auth/refresh`
2. Server validates refresh token and session
3. Server returns new access token
4. Client updates stored access token
5. Repeat when access token expires

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT secrets securely** in environment variables
3. **Use strong secrets** (minimum 32 characters)
4. **Implement proper CORS** configuration
5. **Validate and sanitize** all user inputs
6. **Monitor authentication attempts** for suspicious activity
7. **Implement email verification** (placeholder provided)
8. **Use proper error handling** without exposing sensitive data
9. **Set appropriate token expiry times**
10. **Implement account lockout** after multiple failed attempts

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {} // Optional additional information
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Database

Currently uses in-memory storage. To upgrade to a persistent database:

1. Replace `UserDatabase` class in `server/services/authService.ts`
2. Implement database operations (PostgreSQL, MongoDB, etc.)
3. Update session storage to use database
4. Consider Redis for token blacklist in production

## Testing

Example test flow:

```typescript
// 1. Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123'
  })
});

// 2. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123'
  })
});

const { accessToken, refreshToken } = loginResponse.data.tokens;

// 3. Use access token
const protectedResponse = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// 4. Refresh token
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

// 5. Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

## Future Enhancements

- Email verification flow
- Password reset via email
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub, etc.)
- Account recovery
- Audit logging
- Session management UI
- Device management
- IP-based restrictions
- Geo-location tracking
- Biometric authentication

## License

Part of the Dogepump Dogechain Memecoin Launcher project.
