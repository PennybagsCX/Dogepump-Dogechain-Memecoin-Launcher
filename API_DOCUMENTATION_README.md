# DogePump API Documentation

**Date**: January 15, 2026
**Feature**: Swagger/OpenAPI API Documentation
**Status**: ✅ Implemented

---

## Overview

The DogePump API is now fully documented with interactive Swagger/OpenAPI documentation available at `/docs`. This documentation provides comprehensive information about all API endpoints, request/response schemas, authentication requirements, and allows you to test endpoints directly from the browser.

---

## Accessing Documentation

### Development Environment

```
http://localhost:3001/docs
```

### Production Environment

```
https://api.dogepump.com/docs
```

---

## Authentication

### JWT Bearer Token

Most endpoints require JWT authentication. Include your access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

**How to get an access token:**

1. **Register a new account**:
   ```http
   POST /api/auth/register
   Content-Type: application/json

   {
     "username": "dogeuser",
     "email": "user@example.com",
     "password": "securepassword123"
   }
   ```

2. **Login**:
   ```http
   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "securepassword123"
   }
   ```

   Response:
   ```json
   {
     "success": true,
     "user": {
       "id": "uuid-here",
       "email": "user@example.com",
       "username": "dogeuser",
       "role": "user"
     },
     "tokens": {
       "accessToken": "eyJhbGciOiJIUzI1NiIs...",
       "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
       "expiresIn": 900
     }
   }
   ```

3. **Use the access token**:
   - Click "Authorize" button in Swagger UI (🔓 lock icon)
   - Enter: `Bearer <your_access_token>`
   - Click "Authorize"
   - All subsequent requests will include the token

### CSRF Token

State-changing endpoints (POST, PUT, DELETE, PATCH) require a CSRF token:

```
x-csrf-token: <your_csrf_token>
```

**How to get a CSRF token:**

```http
GET /api/auth/csrf-token
Authorization: Bearer <your_access_token>
```

Response:
```json
{
  "success": true,
  "message": "CSRF token generated successfully",
  "token": "base64_encoded_token"
}
```

The CSRF token is also returned in the `x-csrf-token` response header.

---

## API Endpoints by Category

### 🔐 Authentication Endpoints

#### Public Endpoints

**Register new user**
```http
POST /api/auth/register
```

**Login**
```http
POST /api/auth/login
```

**Refresh access token**
```http
POST /api/auth/refresh
```

**Request password reset**
```http
POST /api/auth/reset-password
```

**Demo authentication (development only)**
```http
POST /api/auth/demo
```

#### Protected Endpoints (Require Auth)

**Get current user profile**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Update user profile**
```http
PATCH /api/auth/me
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Change password**
```http
POST /api/auth/change-password
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Logout**
```http
POST /api/auth/logout
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Logout from all devices**
```http
POST /api/auth/logout-all
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Verify access token**
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Get user permissions**
```http
GET /api/auth/permissions
Authorization: Bearer <token>
```

**Get CSRF token**
```http
GET /api/auth/csrf-token
Authorization: Bearer <token>
```

**Refresh CSRF token**
```http
POST /api/auth/csrf-token/refresh
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

#### Admin Endpoints (Require Admin Role)

**Get all users**
```http
GET /api/auth/admin/users
Authorization: Bearer <admin_token>
```

**Update user role**
```http
PATCH /api/auth/admin/users/:userId/role
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

**Deactivate user**
```http
POST /api/auth/admin/users/:userId/deactivate
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

**Activate user**
```http
POST /api/auth/admin/users/:userId/activate
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

**Delete user**
```http
DELETE /api/auth/admin/users/:userId
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

**Get authentication stats**
```http
GET /api/auth/admin/stats
Authorization: Bearer <admin_token>
```

### 📸 Image Endpoints

#### Protected Endpoints

**Upload image**
```http
POST /api/images/upload
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
Content-Type: multipart/form-data
```

**Get image by ID**
```http
GET /api/images/:imageId
Authorization: Bearer <token>
```

**Get image variant**
```http
GET /api/images/:imageId/variant/:variantName
Authorization: Bearer <token>
```

**Delete image**
```http
DELETE /api/images/:imageId
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**List user images**
```http
GET /api/images/user/:userId
Authorization: Bearer <token>
```

**Get storage stats**
```http
GET /api/images/stats
Authorization: Bearer <token>
```

**Cleanup old images**
```http
POST /api/images/cleanup
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

### 💬 Comment Endpoints

**Create comment**
```http
POST /api/comments
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Get comments for token**
```http
GET /api/comments/token/:tokenId
```

**Update comment**
```http
PATCH /api/comments/:commentId
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Delete comment**
```http
DELETE /api/comments/:commentId
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Get recent comments**
```http
GET /api/comments/recent
```

### ⛓️ Blockchain Endpoints

**Get token info**
```http
GET /api/blockchain/token/:address
```

**Get transaction info**
```http
GET /api/blockchain/transaction/:hash
```

**Get block info**
```http
GET /api/blockchain/block/:number
```

**Get gas price**
```http
GET /api/blockchain/gas-price
```

### 🛡️ Moderation Endpoints (Admin Only)

**Get flagged content**
```http
GET /api/moderation/flagged
Authorization: Bearer <admin_token>
```

**Approve content**
```http
POST /api/moderation/approve/:contentId
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

**Reject content**
```http
POST /api/moderation/reject/:contentId
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

### 🚨 Report Endpoints

**Create report**
```http
POST /api/reports
Authorization: Bearer <token>
x-csrf-token: <csrf_token>
```

**Get user reports**
```http
GET /api/reports/user/:userId
Authorization: Bearer <token>
```

**Get report by ID**
```http
GET /api/reports/:reportId
Authorization: Bearer <token>
```

**Get all reports (Admin)**
```http
GET /api/reports/admin/all
Authorization: Bearer <admin_token>
```

**Update report status (Admin)**
```http
PATCH /api/reports/:reportId/status
Authorization: Bearer <admin_token>
x-csrf-token: <csrf_token>
```

### ❤️ Health Endpoints

**Health check**
```http
GET /health
```

**Liveness probe**
```http
GET /health/live
```

**Readiness probe**
```http
GET /health/ready
```

---

## Using Swagger UI

### 1. Browse Documentation

Navigate to `/docs` to see all available endpoints organized by category:

- **Authentication**: User auth, token management
- **Images**: Image upload and management
- **Comments**: Token comments
- **Blockchain**: On-chain data
- **Moderation**: Content moderation (admin)
- **Reports**: User reports
- **Health**: System health checks

### 2. View Endpoint Details

Click on any endpoint to see:

- **Description**: What the endpoint does
- **Parameters**: Required and optional parameters
- **Request Body**: JSON schema for POST/PUT requests
- **Responses**: Expected response codes and schemas
- **Security**: Required authentication (Bearer token, CSRF)

### 3. Test Endpoints Interactively

1. **Authorize**: Click the 🔓 lock icon and enter your JWT token
2. **Try it out**: Click "Try it out" button
3. **Fill parameters**: Enter required parameters
4. **Execute**: Click "Execute"
5. **View response**: See the actual API response

### 4. Download OpenAPI Specification

Click the JSON/YAML links at the bottom of the docs page to download:

- `openapi.json`: Full OpenAPI 3.0 specification
- `openapi.yaml`: YAML format for import into other tools

---

## Common Request Patterns

### Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dogeuser",
    "email": "user@example.com",
    "password": "securepass123"
  }'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'

# Response includes accessToken

# 3. Get CSRF token
curl -X GET http://localhost:3001/api/auth/csrf-token \
  -H "Authorization: Bearer <accessToken>"

# 4. Make authenticated request
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# 5. State-changing request (with CSRF)
curl -X PATCH http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-csrf-token: <csrfToken>" \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername"}'
```

### Image Upload Flow

```bash
# 1. Get CSRF token
CSRF_TOKEN=$(curl -s -X GET http://localhost:3001/api/auth/csrf-token \
  -H "Authorization: Bearer <accessToken>" \
  | jq -r '.token')

# 2. Upload image
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "tokenId=optional-token-id"

# Response includes image ID and variants

# 3. Get image
curl -X GET http://localhost:3001/api/images/<imageId> \
  -H "Authorization: Bearer <accessToken>"

# 4. Get specific variant
curl -X GET http://localhost:3001/api/images/<imageId>/variant/thumbnail \
  -H "Authorization: Bearer <accessToken>"
```

---

## Error Handling

All errors follow this format:

```json
{
  "statusCode": 400,
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "Optional additional details"
  }
}
```

### Common Status Codes

| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions or invalid CSRF token |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Examples

**Authentication Error (401)**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**CSRF Error (403)**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Invalid CSRF token"
}
```

**Validation Error (400)**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

**Rate Limit Error (429)**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Too many authentication attempts. Please try again later.",
  "details": {
    "retryAfter": 45
  }
}
```

---

## Rate Limiting

### Global Rate Limit
- **Limit**: 100 requests per minute
- **Headers**: Included in all responses

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

### Authentication Rate Limit
- **Limit**: 5 attempts per 15 minutes
- **Applies to**: `/api/auth/login`, `/api/auth/register`

### WebSocket Rate Limit
- **Limit**: 10 concurrent connections per user

---

## Security Features

### JWT Token Security
- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days**
- Tokens are bound to client IP addresses
- Token blacklisting on logout

### CSRF Protection
- Required for all state-changing requests
- Tokens expire in **1 hour**
- Stored in Redis with automatic cleanup

### IP Binding
- JWT tokens include client IP address
- Tokens stolen via XSS cannot be used from different IPs
- Supports proxy/load balancer scenarios

---

## Testing with cURL

### Setup Environment Variables

```bash
export API_BASE="http://localhost:3001"
export ACCESS_TOKEN="your_access_token_here"
export REFRESH_TOKEN="your_refresh_token_here"
export CSRF_TOKEN="your_csrf_token_here"
```

### Example Requests

**Get user profile**
```bash
curl -X GET $API_BASE/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Update username**
```bash
curl -X PATCH $API_BASE/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername"}'
```

**Upload image**
```bash
curl -X POST $API_BASE/api/images/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

---

## Integration with Other Tools

### Import into Postman

1. Download OpenAPI spec from `/docs`
2. Import into Postman: File → Import → Select `openapi.json`
3. Set environment variables:
   - `baseUrl`: http://localhost:3001
   - `accessToken`: Your JWT token
   - `csrfToken`: Your CSRF token

### Generate Client SDKs

Use OpenAPI Generator to generate client libraries:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3001/docs/json \
  -g typescript-axios \
  -o ./client-sdk

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3001/docs/json \
  -g python \
  -o ./python-client
```

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: http://localhost:3001
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - flow:
      - post:
          url: /api/auth/login
          json:
            email: test@example.com
            password: testpass123
      - get:
          url: /api/auth/me
          headers:
            Authorization: Bearer ${{TOKEN}}
```

---

## Best Practices

### 1. Token Management

- Store access token in memory (not localStorage)
- Store refresh token in httpOnly cookie or secure storage
- Implement automatic token refresh before expiry
- Clear tokens on logout

### 2. CSRF Protection

- Fetch new CSRF token on page load
- Include CSRF token in all state-changing requests
- Refresh token periodically (recommended: every 30 minutes)

### 3. Error Handling

- Always check response status code
- Parse error messages and display to users
- Implement retry logic for 429 rate limit errors
- Handle 401 errors by refreshing access token

### 4. Rate Limiting

- Implement exponential backoff for retries
- Display rate limit warnings to users
- Cache responses when appropriate

### 5. Security

- Never expose tokens in URLs
- Use HTTPS in production
- Validate tokens server-side
- Implement Content Security Policy

---

## Troubleshooting

### Issue: "Unauthorized" error

**Solution**: Ensure your access token is valid and not expired

```bash
# Check token expiry (decoded JWT payload)
echo $ACCESS_TOKEN | jq -R 'split(".") | .[1]' | base64 -d | jq
```

### Issue: "Forbidden - Invalid CSRF token"

**Solution**: Fetch a fresh CSRF token

```bash
curl -X GET $API_BASE/api/auth/csrf-token \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Issue: "Too Many Requests"

**Solution**: Wait for rate limit to reset (check `retryAfter` value)

```bash
# Check remaining requests
curl -I $API_BASE/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Issue: Swagger UI won't load

**Solution**: Ensure server is running on correct port

```bash
# Check server status
curl http://localhost:3001/health

# Expected response: {"status":"ok"}
```

---

## Additional Resources

- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI Documentation**: https://swagger.io/tools/swagger-ui/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **OWASP CSRF Prevention**: https://owasp.org/www-community/attacks/csrf

---

## Changelog

### January 15, 2026
- ✅ Implemented Swagger/OpenAPI documentation
- ✅ Added interactive API explorer at `/docs`
- ✅ Documented all authentication endpoints
- ✅ Added request/response schemas
- ✅ Integrated security schemes (Bearer auth, CSRF)
- ✅ Added comprehensive examples and error responses

---

**Implementation Date**: January 15, 2026
**Last Updated**: January 15, 2026
**Version**: 1.0.0
