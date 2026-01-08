# Trollbox and Comment Reporting System - Complete Implementation Documentation

## Overview

The Reporting System allows users to report inappropriate content across the platform:
- **Trollbox Messages**: Anonymous chat feature reports
- **Token Comments**: Comments on token pages
- **Tokens**: Token reports for scams/inappropriate content

Reports are submitted to the backend database and can be reviewed by admins in the Admin Dashboard.

## Implementation Date

**December 29, 2025** (Updated with comment report fixes on December 29, 2025)

## Problem Statement

The reporting functionality had multiple critical issues:

### Trollbox Reports
1. Report submission button provided no feedback
2. Reports weren't reaching the Admin Dashboard
3. Report details showed "Comment not found" for trollbox messages
4. Demo authentication wasn't working properly
5. Reports were failing with 500 errors (UUID constraint violation)
6. Reports were showing in wrong admin dashboard tabs

### Comment Reports (Additional Issues)
7. Comment reports failed with 500 errors (UUID constraint violation)
8. Comment reports used localStorage-only storage (not persisted to database)
9. Wrong field mapping when loading reports from database
10. Stats didn't count trollbox/comment reports correctly
11. `/auth/me` endpoint path was incorrect (404 errors)

## Root Causes

### 1. Wrong localStorage Key
- **File**: `services/reportsApi.ts`
- **Issue**: Using `accessToken` instead of `dogepump_access_token`
- **Impact**: API calls failed with 401 Unauthorized

### 2. Report Modal Clipping
- **File**: `components/Trollbox.tsx`
- **Issue**: Modal rendered inside trollbox div with `overflow-hidden`
- **Impact**: Report modal was cut off and not fully visible

### 3. Wrong Code Path for Authenticated Users
- **File**: `components/Trollbox.tsx`
- **Issue**: Demo users have auth tokens, so code took wrong path calling `reportsApi.createReport` directly
- **Impact**: Trollbox reports were sent with `type: 'comment'` and `commentId: timestamp` (not UUID)

### 4. Database Foreign Key Constraint
- **Table**: `reports.comment_id`
- **Issue**: Column expects UUID but trollbox uses timestamp IDs (e.g., "1767012691394")
- **Impact**: 500 Internal Server Error when creating reports

### 5. Vite HMR Not Updating StoreContext
- **Issue**: Vite Hot Module Replacement can't update context exports properly
- **Impact**: Code changes weren't being reflected without full server restart

### 6. Reports Not Loaded in Admin Dashboard
- **Issue**: Reports state was never populated from database
- **Impact**: Even successfully created reports didn't appear in admin dashboard

### 7. Wrong Report Object Structure
- **Issue**: Creating report with fields that don't match Report type
- **Impact**: Display issues with "Unknown" type, "Invalid Date", missing reporter

### 8. Wrong Tab Filtering Logic
- **Issue**: Reports table shown for ALL tabs except overview
- **Impact**: Reports appeared in Actions, Banned Users, Delisted Tokens, and Warnings tabs

### 9. Timing Issue with Moderation Data Load
- **Issue**: Moderation data loaded before authentication completed
- **Impact**: Reports weren't loaded on startup

### 10. Comment Reports Used localStorage-Only Storage
- **File**: `contexts/StoreContext.tsx` - `reportComment` function
- **Issue**: Comment reports were created with client-generated IDs and only stored in local state
- **Impact**: When moderation data loaded from database, it replaced ALL reports, causing local-only reports to disappear

### 11. Wrong Field Mapping for Database Reports
- **File**: `contexts/StoreContext.tsx` - moderation data loading
- **Issue**: Database reports mapped with wrong field names (`reporterUsername`, `reportedUsername`, `createdAt` instead of `reporter`, `reportedUser`, `timestamp`)
- **Impact**: AdminDashboard couldn't display reports correctly, showing "Unknown", "Invalid Date", empty fields

### 12. Comment ID Foreign Key Constraint
- **Table**: `reports.comment_id`
- **Issue**: Column expects UUID but comments use timestamp IDs (e.g., "1767019244730")
- **Impact**: 500 Internal Server Error when creating comment reports

### 13. Stats Didn't Count Trollbox/Comment Reports
- **File**: `components/AdminDashboard.tsx` - stats calculation
- **Issue**: `commentReports` stat only counted reports with `commentId`, excluding trollbox and comment reports
- **Impact**: Stats showed incorrect counts

### 14. Wrong API Endpoint Paths
- **File**: `services/backendService.ts`
- **Issue**: `/auth/me` called instead of `/api/auth/me`
- **Impact**: 404 Not Found errors when fetching user profile

## Solutions Implemented

### 1. Fixed Demo Authentication

**File**: `server/routes/auth.ts`

Added demo authentication endpoint that creates real users in the database with proper UUIDs:

```typescript
fastify.post('/demo', async (request, reply) => {
  const { walletAddress } = request.body as { walletAddress: string };

  // Check if user exists
  let user = await query(
    'SELECT * FROM users WHERE wallet_address = $1',
    [walletAddress]
  );

  // Create or update user with demo role
  if (user.rows.length === 0) {
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, wallet_address, username, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (wallet_address) DO UPDATE SET role = $4`,
      [userId, walletAddress, `demo_${walletAddress.slice(0, 8)}`, 'user']
    );
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId, walletAddress, role: 'user' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return { token, user };
});
```

**File**: `services/authService.ts`

Created authentication service to handle demo mode:

```typescript
export async function initializeDemoAuth() {
  const walletAddress = (window as any).ethereum?.selectedAddress;

  if (!walletAddress) {
    console.warn('[AuthService] No wallet address available');
    return false;
  }

  const response = await fetch(`${API_BASE}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });

  const { token, user } = await response.json();
  localStorage.setItem('dogepump_access_token', token);

  return true;
}
```

### 2. Fixed Trollbox Report Submission

**File**: `components/Trollbox.tsx`

Removed conditional logic and always use `addReport` from StoreContext:

```typescript
// Before (WRONG):
if (backendService.isAuthenticated()) {
  await reportsApi.createReport({
    type: 'comment',
    commentId: messageToReport.id,  // timestamp - causes 500 error!
    reason: reportReason,
    description: fullDescription
  });
}

// After (CORRECT):
await addReport(
  'trollbox',
  messageToReport.id,
  actualReportedUser,
  reportReason,
  fullDescription
);
```

### 3. Fixed Report Type Mapping

**File**: `contexts/StoreContext.tsx`

Added proper type mapping and field handling for trollbox reports:

```typescript
const addReport = async (
  type: 'comment' | 'token' | 'trollbox',
  targetId: string,
  reportedUser: string,
  reason: Report['reason'],
  description: string
) => {
  // Map trollbox type to user for API
  const apiType: 'comment' | 'token' | 'user' = type === 'trollbox' ? 'user' : type;

  // For trollbox reports, don't set reportedUserId or commentId since:
  // 1. Trollbox users may not exist in the database
  // 2. Trollbox messages aren't in the comments table (foreign key constraint)
  const reportedUserId = type === 'trollbox' ? undefined : reportedUser;
  const commentId = type === 'trollbox' ? undefined : (type === 'comment' ? targetId : undefined);

  // Create report via API
  const result = await createReport({
    type: apiType,
    commentId,
    tokenId: type === 'token' ? targetId : undefined,
    reportedUserId,
    reason,
    description,
  });

  // Add to local state with correct field names
  const newReport: Report = {
    id: result.report.id,
    commentId,
    tokenId: type === 'token' ? targetId : undefined,
    reporter: userProfile.username || userAddress || 'Anonymous',
    reportedUser: reportedUser || 'Unknown',
    reason,
    description,
    timestamp: Date.now(),
    status: 'pending'
  };

  setReports(prev => [newReport, ...prev]);
  return result.report.id;
};
```

### 4. Fixed Moderation Data Loading Timing

**File**: `contexts/StoreContext.tsx`

Changed moderation data loading to depend on `isAuthenticated` state:

```typescript
// Before:
useEffect(() => {
  const hasToken = getAccessToken();
  if (!hasToken) {
    console.log('[STORE] No auth token, skipping moderation data load');
    return;
  }
  // Load moderation data...
}, []); // Run once on mount

// After:
useEffect(() => {
  if (!isAuthenticated) {
    console.log('[STORE] Not authenticated, skipping moderation data load');
    return;
  }
  // Load moderation data...
}, [isAuthenticated]); // Run when auth status changes
```

Added reports loading to moderation data fetch:

```typescript
const [warningsData, bansData, actionsData, reportsData] = await Promise.allSettled([
  moderationApi.getAllWarnings().catch(() => ({ warnings: [] })),
  moderationApi.getAllBans().catch(() => ({ bans: [] })),
  moderationApi.getAdminActions().catch(() => ({ actions: [] })),
  import('../services/reportsApi').then(m => m.getAllReports()).catch(() => ({ reports: [] }))
]);

// Process reports data with CORRECT field names
if (reportsData.status === 'fulfilled' && reportsData.value.reports) {
  const formattedReports = reportsData.value.reports.map((r: any) => ({
    id: r.id,
    commentId: r.comment_id,
    tokenId: r.token_id,
    reporter: r.reporter_username || 'Unknown',
    reportedUser: r.reported_username || 'Unknown',
    reason: r.reason,
    description: r.description,
    timestamp: new Date(r.created_at).getTime(),
    status: r.status,
    reviewedBy: r.reviewer_username,
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).getTime() : undefined,
    resolution: r.resolution,
    adminNotes: r.admin_notes,
    actionTaken: r.action_taken
  }));
  setReports(formattedReports);
}
```

### 5. Fixed Report Display Logic

**File**: `components/AdminDashboard.tsx`

Fixed trollbox report detection:

```typescript
const getReportDetails = (report: ReportType) => {
  if (report.tokenId) {
    // Token report
    return {
      type: 'Token',
      name: token?.name || 'Unknown Token',
      ticker: token?.ticker || '',
      link: `/token/${report.tokenId}`
    };
  } else if (report.commentId) {
    // Comment report (check if trollbox)
    const comment = comments.find(c => c.id === report.commentId);
    const isTrollbox = !comment && report.description.includes('Message from');

    if (isTrollbox) {
      const userMatch = report.description.match(/Message from (.+?) at /);
      const userName = userMatch ? userMatch[1] : report.reportedUser;
      return {
        type: 'Trollbox Message',
        name: `Trollbox: ${userName}`,
        ticker: '',
        link: '#'
      };
    }
    // Regular comment...
  } else if (report.description.includes('Message from') && report.description.match(/Message from .+? at .+?:\n/)) {
    // Trollbox report without commentId (new format)
    const userMatch = report.description.match(/Message from (.+?) at /);
    const userName = userMatch ? userMatch[1] : report.reportedUser;
    return {
      type: 'Trollbox Message',
      name: `Trollbox: ${userName}`,
      ticker: '',
      link: '#'
    };
  }
  return { type: 'Unknown', name: 'Unknown', link: '#' };
};
```

Fixed tab filtering logic:

```typescript
// Before (WRONG):
if (activeTab === 'comment-reports') {
  filtered = filtered.filter(r => r.commentId);
}
// Reports table shown for all tabs except overview
) : (
  // reports table
)

// After (CORRECT):
if (activeTab === 'comment-reports') {
  // Include comment reports, trollbox reports (detected by description format)
  filtered = filtered.filter(r =>
    r.commentId ||
    (r.description.includes('Comment by') && r.description.match(/Comment by .+? at .+?:\n/)) ||
    (r.description.includes('Message from') && r.description.match(/Message from .+? at .+?:\n/))
  );
}
// Reports table ONLY shown for token-reports and comment-reports
) : activeTab === 'token-reports' || activeTab === 'comment-reports' ? (
  // reports table
) : null}
```

### 6. Fixed Report Modal Position

**File**: `components/Trollbox.tsx`

Moved report modal outside trollbox div to avoid clipping:

```typescript
// Before: Modal inside trollbox div with overflow-hidden
<div className="flex-1 overflow-y-auto">
  {/* Messages */}
  {/* Report Modal */}  // Clipped!
</div>

// After: Modal outside trollbox div
<div>
  {/* Trollbox messages container */}
  <div className="flex-1 overflow-y-auto">
    {/* Messages */}
  </div>

  {/* Report modal outside */}
  {showReportModal && (
    <ReportModal />
  )}
</div>
```

### 7. Fixed Comment Report Submission

**File**: `contexts/StoreContext.tsx`

Changed `reportComment` to use API instead of localStorage-only:

```typescript
// BEFORE (WRONG):
const reportComment = (commentId: string, tokenId: string, reason: string, description: string) => {
  const newReport: Report = {
    id: `report-${Date.now()}-${Math.random()...}`,  // Client-generated ID
    commentId,
    tokenId,
    reporter: userAddress || 'Anonymous',
    reportedUser: comment.user,
    reason: reason as any,
    description,
    timestamp: Date.now(),
    status: 'pending'
  };
  setReports(prev => [newReport, ...prev]);  // Local state only!
};

// AFTER (CORRECT):
const reportComment = async (commentId: string, tokenId: string, reason: string, description: string) => {
  const comment = comments.find(c => c.id === commentId);
  if (!comment) return;

  try {
    // Format description to include comment content
    const commentTimestamp = new Date(comment.timestamp).toLocaleString();
    const fullDescription = description
      ? `Comment by ${comment.user} at ${commentTimestamp}:\n${comment.text}\n\nReason: ${description}`
      : `Comment by ${comment.user} at ${commentTimestamp}:\n${comment.text}`;

    // Use the API-based addReport function
    await addReport('comment', commentId, comment.user, reason as any, fullDescription);

    // Update comment report status
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, reports: (c.reports || 0) + 1, isReported: true }
        : c
    ));

    addNotification('success', 'Report Submitted', 'Thank you for helping keep our community safe', `/admin#comment-reports`);
  } catch (error) {
    console.error('[STORE] Failed to report comment:', error);
  }
};
```

**File**: `contexts/StoreContext.tsx` - `addReport` function

Updated to handle comment reports like trollbox reports (no commentId, use description):

```typescript
const addReport = async (
  type: 'comment' | 'token' | 'trollbox',
  targetId: string,
  reportedUser: string,
  reason: Report['reason'],
  description: string
) => {
  // Map trollbox type to user for API
  const apiType: 'comment' | 'token' | 'user' = type === 'trollbox' ? 'user' : type;

  // For trollbox and comment reports, don't set reportedUserId or commentId since:
  // 1. Trollbox/comment users may not exist in the database
  // 2. Comments/trollbox use timestamp IDs, not UUIDs (foreign key constraint)
  // The description field contains all the relevant information
  const reportedUserId = (type === 'trollbox' || type === 'comment') ? undefined : reportedUser;
  const commentId = undefined; // Never set commentId since comments use timestamp IDs, not UUIDs

  // Create report via API
  const result = await createReport({
    type: apiType,
    commentId,
    tokenId: type === 'token' ? targetId : undefined,
    reportedUserId,
    reason,
    description,
  });

  // Add to local state with CORRECT field names
  const newReport: Report = {
    id: result.report.id,
    commentId,
    tokenId: type === 'token' ? targetId : undefined,
    reporter: userProfile.username || userAddress || 'Anonymous',
    reportedUser: reportedUser || 'Unknown',
    reason,
    description,
    timestamp: Date.now(),
    status: 'pending'
  };

  setReports(prev => [newReport, ...prev]);
  return result.report.id;
};
```

**File**: `server/routes/reports.ts`

Removed commentId validation requirement:

```typescript
// BEFORE:
if (type === 'comment' && !commentId) {
  return reply.status(400).send({
    success: false,
    error: 'Comment ID is required for comment reports'
  });
}

// AFTER:
// Note: commentId is optional for comment reports since they may be from local storage
if (type === 'token' && !tokenId) {
  return reply.status(400).send({
    success: false,
    error: 'Token ID is required for token reports'
  });
}
```

### 8. Fixed Comment Report Detection in Admin Dashboard

**File**: `components/AdminDashboard.tsx`

Added comment report detection by description format:

```typescript
const getReportDetails = (report: ReportType) => {
  if (report.tokenId) {
    // Token report...
  } else if (report.commentId) {
    // Comment report (check if trollbox)...
  } else if (report.description.includes('Comment by') && report.description.match(/Comment by .+? at .+?:\n/)) {
    // Comment report without commentId (new format - comments use timestamp IDs)
    const userMatch = report.description.match(/Comment by (.+?) at /);
    const userName = userMatch ? userMatch[1] : report.reportedUser;
    return {
      type: 'Comment',
      name: `Comment: ${userName}`,
      ticker: '',
      link: '#' // Can't link to specific comment since it uses timestamp ID
    };
  } else if (report.description.includes('Message from') && report.description.match(/Message from .+? at .+?:\n/)) {
    // Trollbox report without commentId (new format)
    const userMatch = report.description.match(/Message from (.+?) at /);
    const userName = userMatch ? userMatch[1] : report.reportedUser;
    return {
      type: 'Trollbox Message',
      name: `Trollbox: ${userName}`,
      ticker: '',
      link: '#'
    };
  }
  return { type: 'Unknown', name: 'Unknown', link: '#' };
};
```

### 9. Fixed Stats Calculation

**File**: `components/AdminDashboard.tsx`

Updated stats to include trollbox and comment reports:

```typescript
// Comment reports include actual comment reports AND trollbox reports (detected by description format)
const commentReports = reports.filter(r =>
  r.commentId ||
  (r.description.includes('Comment by') && r.description.match(/Comment by .+? at .+?:\n/)) ||
  (r.description.includes('Message from') && r.description.match(/Message from .+? at .+?:\n/))
).length;
```

### 10. Fixed API Endpoint Paths

**File**: `services/backendService.ts`

Fixed `/auth/me` endpoint paths:

```typescript
// BEFORE:
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await request<{ success: boolean; user: UserProfile }>('/auth/me');
  // ...
}

// AFTER:
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await request<{ success: boolean; user: UserProfile }>('/api/auth/me');
  // ...
}
```

## Database Schema

### Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL,                 -- 'comment', 'token', 'user'
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  comment_id UUID,                            -- NULL for trollbox reports
  token_id UUID,
  reason VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  resolution TEXT,
  action_taken VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (comment_id) REFERENCES comments(id)  -- Only for actual comments
);
```

**Important Notes**:
- `comment_id` is nullable for trollbox and comment reports (they use description field instead)
- Trollbox reports have `type: 'user'` with `comment_id: NULL`
- Comment reports also have `comment_id: NULL` since comments use timestamp IDs, not UUIDs
- Trollbox message content stored in `description` field with format:
  ```
  Message from {username} at {timestamp}:
  {message content}
  ```
- Comment content stored in `description` field with format:
  ```
  Comment by {username} at {timestamp}:
  {comment text}
  ```

## API Endpoints

### POST /api/reports
Create a new report (authenticated users)

**Request Body - Trollbox Report**:
```json
{
  "type": "user",
  "commentId": null,
  "tokenId": null,
  "reportedUserId": null,
  "reason": "spam",
  "description": "Message from Anonymous Doge at 12/29/2025, 8:27:25 AM:\ntest message"
}
```

**Request Body - Comment Report**:
```json
{
  "type": "comment",
  "commentId": null,
  "tokenId": "uuid",
  "reportedUserId": null,
  "reason": "spam",
  "description": "Comment by johndoe at 12/29/2025, 8:30:15 AM:\nThis is spam\n\nReason: Inappropriate content"
}
```

**Request Body - Token Report**:
```json
{
  "type": "token",
  "commentId": null,
  "tokenId": "uuid",
  "reportedUserId": "user-uuid",
  "reason": "scam",
  "description": "Token appears to be a scam"
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "type": "user",
    "status": "pending",
    ...
  }
}
```

### GET /api/reports
Get all reports (admin only)

**Query Parameters**:
- `status`: Filter by status (optional)
- `type`: Filter by type (optional)
- `limit`: Max results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "type": "user",
      "reporter_id": "uuid",
      "reporter_username": "username",
      "reported_user_id": null,
      "comment_id": null,
      "reason": "spam",
      "description": "...",
      "status": "pending",
      "created_at": "2025-12-29T..."
    }
  ]
}
```

## Admin Dashboard Usage

### Viewing Reports

1. Navigate to **Admin Dashboard** (`/admin`)
2. Click on **Comment Reports** tab to view:
   - **Trollbox Reports**: Type "Trollbox Message", Name "Trollbox: {username}"
   - **Comment Reports**: Type "Comment", Name "Comment: {username}"
3. Click on **Token Reports** tab to view token reports

Each report shows:
- **Type**: Trollbox Message, Comment, or Token
- **Name**: Reporter username or report type
- **Reporter**: Reporting user's username/address
- **Reason**: spam, harassment, inappropriate, scam, or other
- **Status**: pending, reviewing, resolved, or dismissed
- **Date**: Timestamp of report

### Taking Action on Reports

1. Click on a report to view details
2. View the full content (trollbox message, comment text, or token info) in the description
3. Choose an action:
   - **Resolve**: Mark report as resolved with optional notes
   - **Dismiss**: Dismiss report as invalid
   - **Warn User**: Issue warning to reported user
   - **Ban User**: Ban reported user (if appropriate)
   - **Delist Token**: Remove token from platform (for token reports)

### Report Details Modal

The report details modal shows:
- **Report Type**: Trollbox Message, Comment, or Token
- **Reported User**: Username from report
- **Reporter**: Who submitted the report
- **Reason**: Category of violation
- **Content**: Full trollbox message, comment text, or token details
- **Timestamp**: When content was created
- **Status**: Current report status

## Testing Checklist

### Trollbox Report Submission

- [x] Report button is visible on each trollbox message
- [x] Clicking report button opens report modal
- [x] Modal is fully visible (not clipped)
- [x] All report reasons are available (spam, harassment, inappropriate, scam, other)
- [x] Description can be added optionally
- [x] Submit button creates report in database
- [x] Success notification appears after submission
- [x] Modal closes after successful submission

### Comment Report Submission

- [x] Report button is visible on each comment
- [x] Clicking report button opens report modal
- [x] All report reasons are available
- [x] Description can be added optionally
- [x] Submit button creates report in database
- [x] Success notification appears after submission
- [x] Comment text is included in report description

### Token Report Submission

- [x] Report button is visible on token page
- [x] Submit button creates report in database
- [x] Reports persist after page refresh

### Admin Dashboard

- [x] Reports appear in Overview tab (Recent Reports section)
- [x] Trollbox reports appear in Comment Reports tab
- [x] Comment reports appear in Comment Reports tab
- [x] Token reports appear in Token Reports tab
- [x] Reports do NOT appear in wrong tabs (Actions, Banned Users, etc.)
- [x] Report type shows correctly ("Trollbox Message", "Comment", "Token")
- [x] Reporter column shows reporter username
- [x] Date column shows valid date (not "Invalid Date")
- [x] Clicking report opens details modal
- [x] Content visible in description
- [x] Stats count includes trollbox and comment reports

### Demo Authentication

- [x] Demo users are automatically authenticated
- [x] JWT token is stored in localStorage
- [x] Token is sent with API requests
- [x] Reports can be submitted by demo users
- [x] Admins can view all reports

## Known Limitations

1. **No Direct Link to Trollbox Messages**: Trollbox reports don't have direct links to the original message since trollbox is ephemeral
2. **No Direct Link to Comments**: Comment reports can't link directly to specific comments since comments use timestamp IDs
3. **Anonymous Reporting**: Trollbox/comment users may not exist in the database, so `reportedUserId` is null
4. **Admin-Only Viewing**: Regular users cannot view reports, only admins
5. **No Real-Time Updates**: Admin dashboard must be refreshed to see new reports (though they're added to local state immediately)

## Future Enhancements

1. **Real-Time Updates**: Implement WebSocket for real-time report updates
2. **Report Search**: Add full-text search across report descriptions
3. **Bulk Actions**: Allow resolving/dismissing multiple reports at once
4. **Report Statistics**: Add charts showing report trends over time
5. **Auto-Moderation**: Implement automatic spam detection for trollbox
6. **User Reputation**: Track reporter reputation to prevent false reports

## Troubleshooting

### Reports Not Appearing

**Issue**: Reports not showing in admin dashboard

**Solutions**:
1. Check browser console for errors
2. Verify backend server is running on port 3001
3. Ensure demo authentication succeeded: `[STORE] Demo authentication successful`
4. Check reports loaded: `[STORE] Loaded X reports from database`
5. Verify filtering: Trollbox/comment reports show in Overview and Comment Reports tabs
6. Check field mapping: Reports should have `reporter`, `reportedUser`, `timestamp` fields

### 500 Error on Report Submission

**Issue**: `POST http://localhost:3001/api/reports 500 (Internal Server Error)`

**Cause**: Comment/trollbox ID is timestamp instead of UUID (foreign key constraint)

**Solution**:
- Trollbox reports: Ensure `commentId: undefined` and `type: 'user'`
- Comment reports: Ensure `commentId: undefined` (comments use timestamp IDs)
- Token reports: `tokenId` should be UUID (this works correctly)

### Comment Reports Disappearing

**Issue**: Comment reports show initially but disappear after refresh

**Cause**: `reportComment` was using localStorage-only storage

**Solution**: Ensure `reportComment` calls `addReport()` which saves to database

### Invalid Date Display

**Issue**: Date column shows "Invalid Date"

**Cause**: Using `createdAt` instead of `timestamp` field when loading from database

**Solution**: Map database `created_at` to `timestamp` in StoreContext moderation data loading

### "Unknown" Type Display

**Issue**: Report type shows "Unknown" instead of "Trollbox Message" or "Comment"

**Cause**: `getReportDetails` function not detecting reports by description format

**Solution**:
- Trollbox: Check for `r.description.includes('Message from') && r.description.match(/Message from .+? at .+?:\n/)`
- Comment: Check for `r.description.includes('Comment by') && r.description.match(/Comment by .+? at .+?:\n/)`

### 404 Not Found for /auth/me

**Issue**: `GET http://localhost:3001/auth/me 404 (Not Found)`

**Cause**: Wrong endpoint path - should be `/api/auth/me`

**Solution**: Update `services/backendService.ts` to use `/api/auth/me` instead of `/auth/me`

## Related Files

### Frontend
- `components/Trollbox.tsx` - Trollbox component with report modal
- `components/ReportModal.tsx` - Reusable report modal for comments and tokens
- `contexts/StoreContext.tsx` - Global state with `addReport`, `reportComment`, `reportToken` functions
- `components/AdminDashboard.tsx` - Admin dashboard with report management
- `services/reportsApi.ts` - API calls for reports
- `services/authService.ts` - Demo authentication service
- `services/backendService.ts` - Backend API service with fixed `/api/auth/me` endpoint

### Backend
- `server/routes/reports.ts` - Reports API endpoints
- `server/routes/auth.ts` - Authentication endpoints including demo auth

### Types
- `types.ts` - Report interface definition

## Migration Notes

No database migration required. The reports table already exists and supports trollbox reports with nullable `comment_id` field.

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify backend server logs for database errors
3. Ensure all dependencies are installed: `npm install`
4. Clear browser cache if experiencing old code issues
5. Restart both frontend (port 3005) and backend (port 3001) servers

## Version History

- **v1.5** (December 29, 2025) - Fixed AuthService server crash
  - Fixed `cleanupExpiredSessions` function using invalid SQL `RETURNING COUNT(*)`
  - Split into two queries: first SELECT COUNT, then DELETE
  - Server no longer crashes when session cleanup runs
  - Updated BUGFIXES.md to version v1.7 with complete documentation

- **v1.4** (December 29, 2025) - Fixed "Reset All Data" button to clear reports
  - Fixed `/api/moderation/reset` endpoint not deleting from `reports` table
  - Added `DELETE FROM reports` to reset endpoint in `server/routes/moderation.ts`
  - Reset button now clears all moderation data including reports, warnings, bans, and admin actions
  - Updated BUGFIXES.md to version v1.6 with complete documentation

- **v1.3** (December 29, 2025) - Fixed moderation API warnings endpoint
  - Fixed `/api/moderation/warnings` returning 500 Internal Server Error
  - Removed invalid SQL JOIN referencing non-existent `unbanned_by` column
  - Updated `services/moderationApi.ts` to use in-memory authentication
  - Admin dashboard now loads warnings, bans, and actions without errors

- **v1.2** (December 29, 2025) - Fixed token reporting and authentication storage
  - Fixed token report submission failing with UUID constraint violation
  - Fixed `reportedUserId` being set to display name "You" instead of `undefined`
  - Added `type` field to Report interface for proper report categorization
  - Fixed AdminDashboard filter logic to use `type` field instead of heuristics
  - Fixed ImageService server crash (invalid SQL with `RETURNING COUNT(*)`)
  - Migrated authentication from localStorage to in-memory only storage
  - Updated demo user role to admin in database

- **v1.1** (December 29, 2025) - Added comment report support and fixed critical issues
  - Fixed comment report submission to use API instead of localStorage-only
  - Fixed database field mapping (`reporter`, `reportedUser`, `timestamp`)
  - Fixed stats calculation to include trollbox and comment reports
  - Fixed `/auth/me` endpoint path (404 errors)
  - Updated AdminDashboard to detect and display comment reports
  - Added comment report detection by description format
  - Updated documentation for comprehensive reporting system

- **v1.0** (December 29, 2025) - Initial implementation of trollbox reporting system
  - Fixed report submission flow
  - Fixed admin dashboard display
  - Fixed demo authentication
  - Fixed report filtering and tab display
  - Fixed timing issues with data loading
