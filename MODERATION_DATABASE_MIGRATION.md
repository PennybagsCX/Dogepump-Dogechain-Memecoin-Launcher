# Moderation System Database Migration Guide

## Overview

The moderation system has been migrated from localStorage to a PostgreSQL database for proper persistence, audit trails, and multi-user support.

## Changes Made

### 1. Database Schema

**File:** `server/migrations/002_moderation_system.sql`

New tables created:
- `banned_users` - Stores ban records with automatic/manual tracking
- `warned_users` - Stores warnings with 3-strike tracking and expiration
- `admin_actions` - Audit log of all administrative actions

Features:
- Automatic timestamp tracking
- User relationships (who banned/warned whom)
- Token-level warnings (can warn specific tokens)
- Warning expiration (30 days)
- Acknowledgment tracking
- Active/inactive status for soft deletes

### 2. API Routes

**File:** `server/routes/moderation.ts`

New endpoints created:

#### Warnings
- `GET /api/moderation/warnings` - Get all warnings (admin)
- `GET /api/moderation/warnings/user/:walletAddress` - Get user warnings
- `POST /api/moderation/warnings` - Issue warning (admin)
- `PUT /api/moderation/warnings/:id/acknowledge` - Acknowledge warning
- `DELETE /api/moderation/warnings/:id` - Clear warning (admin)

#### Bans
- `GET /api/moderation/bans` - Get all bans (admin)
- `POST /api/moderation/bans` - Ban user (admin)
- `DELETE /api/moderation/bans/:walletAddress` - Unban user (admin)

#### Tokens
- `POST /api/moderation/tokens/:tokenId/delist` - Delist token (admin)
- `POST /api/moderation/tokens/:tokenId/relist` - Relist token (admin)

#### Admin Actions
- `GET /api/moderation/actions` - Get admin action log (admin)

All endpoints:
- Require JWT authentication
- Verify admin role for write operations
- Log all actions to admin_actions table
- Return proper HTTP status codes
- Include detailed error messages

### 3. API Service

**File:** `services/moderationApi.ts`

Frontend API service with TypeScript interfaces:
- `getAllWarnings()` - Fetch all warnings
- `getUserWarnings(address)` - Fetch user's warnings
- `createWarning(data)` - Issue new warning
- `acknowledgeWarning(id)` - Acknowledge warning
- `clearWarning(id)` - Clear warning
- `getAllBans()` - Fetch all bans
- `banUser(data)` - Ban user
- `unbanUser(address)` - Unban user
- `delistToken(id, data)` - Delist token
- `relistToken(id)` - Relist token
- `getAdminActions()` - Fetch action log

### 4. StoreContext Updates

**File:** `contexts/StoreContext.tsx`

#### Changes:

**1. State Initialization (Lines 257-261)**
```typescript
// OLD: localStorage
const [warnedUsers, setWarnedUsers] = useState<WarnedUser[]>(() => {
  const saved = localStorage.getItem('dogepump_warned_users');
  return saved ? JSON.parse(saved) : [];
});

// NEW: Empty state, loaded from API
const [warnedUsers, setWarnedUsers] = useState<WarnedUser[]>([]);
const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
const [moderationDataLoaded, setModerationDataLoaded] = useState(false);
```

**2. Removed localStorage Sync (Lines 528-530)**
```typescript
// REMOVED:
// useEffect(() => { localStorage.setItem('dogepump_admin_actions', ...); }, [adminActions]);
// useEffect(() => { localStorage.setItem('dogepump_banned_users', ...); }, [bannedUsers]);
// useEffect(() => { localStorage.setItem('dogepump_warned_users', ...); }, [warnedUsers]);

// NEW: Comment indicating database persistence
// Moderation data is now persisted in database, not localStorage
```

**3. Added Import (Line 11)**
```typescript
import * as moderationApi from '../services/moderationApi';
```

**4. Added Data Loading Effect (Lines 532-610)**
```typescript
useEffect(() => {
  const loadModerationData = async () => {
    // Check for auth token
    const hasToken = localStorage.getItem('accessToken');
    if (!hasToken) {
      setModerationDataLoaded(true);
      return;
    }

    // Load warnings, bans, actions in parallel
    const [warningsData, bansData, actionsData] = await Promise.allSettled([
      moderationApi.getAllWarnings().catch(() => ({ warnings: [] })),
      moderationApi.getAllBans().catch(() => ({ bans: [] })),
      moderationApi.getAdminActions().catch(() => ({ actions: [] }))
    ]);

    // Format and set state
    setWarnedUsers(formattedWarnings);
    setBannedUsers(formattedBans);
    setAdminActions(formattedActions);

    setModerationDataLoaded(true);
  };

  loadModerationData();
}, []); // Run once on mount
```

### 5. Reset Utility

**File:** `utils/resetModerationData.ts`

Utility function to clear localStorage moderation data:
- Removes `dogepump_warned_users`
- Removes `dogepump_banned_users`
- Removes `dogepump_admin_actions`
- Clears delisted flags from tokens

Usage:
```typescript
import { resetModerationData } from './utils/resetModerationData';
resetModerationData();
```

Or visit: `http://localhost:5173?reset=true`

### 6. Server Registration

**File:** `server/index.ts`

Registered moderation routes:
```typescript
import { moderationRoutes } from './routes/moderation/routes';
fastify.register(moderationRoutes, { prefix: '/api/moderation' });
```

## Next Steps (To Complete)

### 1. Update Moderation Functions in StoreContext

The following functions still need to be updated to use the API:

**warnUser()** - Line 1395
```typescript
// CURRENT: Updates local state directly
const warnUser = (targetAddress, reason, notes, tokenId) => {
  setWarnedUsers(prev => [warnedUser, ...prev]);
  // ...
};

// NEEDED: Call API then update state
const warnUser = async (targetAddress, reason, notes, tokenId) => {
  try {
    const result = await moderationApi.createWarning({
      targetAddress,
      reason,
      notes,
      tokenId
    });

    if (result.penaltyApplied) {
      // Handle auto-ban/delist
      return;
    }

    // Update local state
    setWarnedUsers(prev => [result.warning, ...prev]);
  } catch (error) {
    addNotification('error', 'Failed to issue warning', error.message);
  }
};
```

**banUser()** - Line 1329
**unbanUser()** - Line 1375
**delistToken()** - Line 1284
**relistToken()** - Line 1298
**clearWarning()** - (needs to be added)

### 2. Run Database Migration

```bash
# Connect to your PostgreSQL database
psql -U your_user -d dogepump

# Run the migration
\i server/migrations/002_moderation_system.sql
```

Or use a migration tool like:
```bash
# If using node-pg-migrate
npm run db:migrate

# Or manual
psql $DATABASE_URL -f server/migrations/002_moderation_system.sql
```

### 3. Reset LocalStorage Data

Before using the new system, reset all localStorage data:

**Option A: Automatic**
Visit: `http://localhost:5173?reset=true`

**Option B: Manual**
```javascript
// In browser console
localStorage.removeItem('dogepump_warned_users');
localStorage.removeItem('dogepump_banned_users');
localStorage.removeItem('dogepump_admin_actions');
location.reload();
```

**Option C: From Code**
```typescript
import { resetModerationData } from './utils/resetModerationData';
resetModerationData();
```

### 4. Test the Integration

1. **Start the server**
```bash
npm run server
```

2. **Start the frontend**
```bash
npm run dev
```

3. **Login as admin**

4. **Test operations:**
   - Issue a warning to a user
   - Verify warning appears in admin dashboard
   - Check database: `SELECT * FROM warned_users;`
   - Ban a user
   - Verify ban appears in admin dashboard
   - Check database: `SELECT * FROM banned_users;`
   - Check admin actions log: `SELECT * FROM admin_actions;`

## Database Queries for Testing

```sql
-- View all warnings
SELECT * FROM warned_users ORDER BY created_at DESC;

-- View active warnings for a user
SELECT * FROM warned_users
WHERE wallet_address = '0x...'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

-- View all bans
SELECT * FROM banned_users ORDER BY banned_at DESC;

-- View active bans
SELECT * FROM banned_users WHERE is_active = true;

-- View recent admin actions
SELECT
  a.*,
  admin.username as admin_username
FROM admin_actions a
LEFT JOIN users admin ON a.admin_id = admin.id
ORDER BY a.created_at DESC
LIMIT 20;

-- Count warnings per user
SELECT
  wallet_address,
  COUNT(*) as warning_count
FROM warned_users
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY wallet_address
ORDER BY warning_count DESC;

-- View 3-strike violations
SELECT
  wallet_address,
  COUNT(*) as warning_count,
  MAX(created_at) as latest_warning
FROM warned_users
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY wallet_address
HAVING COUNT(*) >= 3;
```

## Benefits of Database Integration

### 1. **Persistence**
- Data survives browser clear
- Works across devices
- Survives app updates

### 2. **Audit Trail**
- Complete history of all actions
- Who did what and when
- Cannot be tampered with

### 3. **Multi-User**
- All admins see same data
- Real-time synchronization
- Concurrent access handled

### 4. **Querying**
- Complex searches
- Reporting and analytics
- Data export

### 5. **Scalability**
- Thousands of records
- Efficient indexing
- Backup and recovery

### 6. **Integrity**
- Foreign key constraints
- Transaction support
- Data validation

## Migration Checklist

- [x] Database schema created
- [x] API routes implemented
- [x] API service created
- [x] StoreContext partially updated
- [ ] Update moderation functions to use API
- [ ] Run database migration
- [ ] Reset localStorage data
- [ ] Test warning system
- [ ] Test ban system
- [ ] Test admin actions log
- [ ] Test 3-strike auto penalties
- [ ] Verify trollbox restrictions
- [ ] Verify token page restrictions

## Rollback Plan

If issues occur:

1. **Revert StoreContext changes**
   - Restore localStorage initialization
   - Restore localStorage sync effects
   - Remove API loading effect

2. **Stop using API**
   - Comment out API calls
   - Use local state only

3. **Database remains intact**
   - Data persists for future use
   - Can retry migration later

## Support

For issues or questions:
- Check database logs
- Check API response in browser DevTools
- Review server logs
- Test API endpoints directly with curl/Postman

---

**Last Updated:** December 2024
**Status:** Partially Complete - API and database ready, StoreContext functions need updating
**Version:** 2.0.0
