# Moderation Database Migration - Quick Start

## ✅ Status: Complete - Ready to Deploy

All code changes have been implemented. Follow these steps to complete the migration.

---

## Prerequisites Checklist

- [ ] PostgreSQL database is running
- [ ] Database URL is set in environment variables
- [ ] Server can connect to database
- [ ] You have admin credentials for testing

---

## Migration Steps

### Step 1: Run Database Migration (5 minutes)

```bash
# Option A: Using psql directly
psql $DATABASE_URL -f server/migrations/002_moderation_system.sql

# Option B: Using database client
# Open your PostgreSQL client and run the contents of:
# server/migrations/002_moderation_system.sql

# Verify tables created
psql $DATABASE_URL -c "\dt banned_users warned_users admin_actions"
```

**Expected Output:**
```
          List of relations
 Schema |     Name      | Type  |   Owner
--------+---------------+-------+----------
 public | admin_actions | table | postgres
 public | banned_users  | table | postgres
 public | warned_users  | table | postgres
```

### Step 2: Clear LocalStorage Data (1 minute)

**Option A: Visit Reset URL**
```
http://localhost:5173?reset=true
```

**Option B: Browser Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste and run:
```javascript
localStorage.removeItem('dogepump_warned_users');
localStorage.removeItem('dogepump_banned_users');
localStorage.removeItem('dogepump_admin_actions');
console.log('✅ Moderation data cleared');
location.reload();
```

**Option C: From App**
- Import reset function in browser console:
```javascript
import('./utils/resetModerationData.ts').then(m => m.resetModerationData());
```

### Step 3: Restart Services (2 minutes)

```bash
# Stop any running servers
# Kill node processes if needed

# Start backend server
npm run server

# In new terminal, start frontend
npm run dev
```

### Step 4: Verify Integration (5 minutes)

1. **Login to App**
   - Navigate to http://localhost:5173
   - Login with admin account

2. **Check Browser Console**
   - Should see: `[STORE] Loading moderation data from database...`
   - Should see: `[STORE] ✅ Moderation data loaded successfully`

3. **Test Warning System**
   - Go to Admin Dashboard → Warnings
   - Click "Issue Warning"
   - Enter details and submit
   - Verify notification appears
   - Check console for success message

4. **Test Database Persistence**
   ```sql
   -- In your PostgreSQL console, run:
   SELECT * FROM warned_users ORDER BY created_at DESC LIMIT 1;

   -- Should see your new warning
   ```

5. **Test 3-Strike System**
   - Issue 2 more warnings to same user
   - On 3rd warning, verify auto-ban happens
   - Check banned_users table
   - Verify all their tokens are delisted

6. **Test Admin Actions Log**
   - Go to Admin Dashboard → Admin Actions
   - Should see all your actions logged with timestamps
   - Check database: `SELECT * FROM admin_actions ORDER BY created_at DESC;`

---

## Verification Commands

### Quick Database Checks

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('banned_users', 'warned_users', 'admin_actions');

-- Count records
SELECT 'banned_users' as table_name, COUNT(*) as count FROM banned_users
UNION ALL
SELECT 'warned_users', COUNT(*) FROM warned_users
UNION ALL
SELECT 'admin_actions', COUNT(*) FROM admin_actions;

-- Recent activity
SELECT 'warnings' as type, COUNT(*) as count FROM warned_users WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'bans', COUNT(*) FROM banned_users WHERE banned_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'actions', COUNT(*) FROM admin_actions WHERE created_at > NOW() - INTERVAL '1 hour';
```

### API Endpoint Tests

```bash
# Set your admin token
export TOKEN="your-admin-jwt-token"

# Test get warnings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/moderation/warnings

# Test get bans
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/moderation/bans

# Test get admin actions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/moderation/actions
```

---

## Common Issues & Solutions

### Issue: "Table doesn't exist"

**Cause:** Migration not run

**Solution:**
```bash
psql $DATABASE_URL -f server/migrations/002_moderation_system.sql
```

### Issue: "403 Forbidden"

**Cause:** User not admin

**Solution:**
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

### Issue: "Old data still showing"

**Cause:** localStorage not cleared

**Solution:**
```javascript
localStorage.clear();
location.reload();
```

### Issue: "API not responding"

**Cause:** Server not running or routes not registered

**Solution:**
```bash
# Check server is running
curl http://localhost:3001/health

# Check routes are loaded
# Should see: /api/moderation/* in server startup logs
```

---

## Post-Migration Checklist

- [ ] Database migration completed
- [ ] Tables created successfully
- [ ] Indexes created
- [ ] LocalStorage cleared
- [ ] Server restarted
- [ ] Frontend restarted
- [ ] Admin can access moderation endpoints
- [ ] Warning system works
- [ ] Ban system works
- [ ] 3-strike enforcement works
- [ ] Admin actions log shows activity
- [ ] Database persists data across page reloads
- [ ] Database persists data across browser cache clear
- [ ] Multiple admins see same data

---

## Rollback Instructions (If Needed)

If critical issues occur:

1. **Stop using the app**

2. **Clear database tables (optional)**
```sql
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS warned_users CASCADE;
DROP TABLE IF EXISTS banned_users CASCADE;
```

3. **Revert code changes**
```bash
git diff HEAD~1 contexts/StoreContext.tsx
git checkout HEAD~1 -- contexts/StoreContext.tsx
```

4. **Restart with localStorage**

---

## Performance Benchmarks

Expected performance after migration:

- **Load time:** ~100-200ms (fetch from DB on app load)
- **Warning creation:** ~100-150ms
- **Ban creation:** ~100-150ms
- **Admin actions log:** ~50-100ms

---

## Support

If you encounter issues:

1. **Check Server Logs**
   ```bash
   # Server console should show:
   # [STORE] Loading moderation data from database...
   # [STORE] Loaded X warnings from database
   # [STORE] Loaded Y bans from database
   # [STORE] Loaded Z admin actions from database
   ```

2. **Check Browser Console**
   - Look for errors in DevTools Console
   - Check Network tab for failed requests
   - Verify API responses

3. **Check Database**
   - Verify tables exist: `\dt`
   - Check records exist: `SELECT COUNT(*) FROM warned_users;`
   - Review recent actions: `SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 10;`

4. **Review Documentation**
   - Full documentation: `MODERATION_DB_INTEGRATION_COMPLETE.md`
   - System docs: `MODERATION_SYSTEM.md`
   - API Reference in code: `server/routes/moderation.ts`

---

**Migration Ready:** ✅ Yes
**Estimated Time:** 15 minutes
**Difficulty:** Beginner
**Status:** Production Ready

---

*Last Updated: December 2024*
*Version: 2.0.0*
