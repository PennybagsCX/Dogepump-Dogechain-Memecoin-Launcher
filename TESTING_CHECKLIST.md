# Quick Testing Checklist

## BEFORE TESTING: Clear Database!

**SECURITY NOTE**: Database reset can only be done from the Admin Dashboard for security reasons.

1. Log into the application as admin
2. Navigate to Admin Dashboard
3. Click the orange "Reset Data" button (with trash icon)
4. Confirm the reset (two confirmation dialogs)
5. Wait for the page to reload

---

## Testing Steps

### 1. Backend Health Check
```bash
curl http://localhost:3001/api/moderation/bans
# Should return: {"statusCode":401,"error":"Unauthorized"...}
# This is GOOD - means endpoint exists and requires auth
```

### 2. Database Verification
```sql
-- Connect to database
psql -h localhost -U postgres -d dogepump_dev

-- Check tables
\dt

-- Should see: admin_actions, banned_users, warned_users

-- Check indexes
\di

-- Should see many indexes on the moderation tables
```

### 3. Frontend Load Test
1. Open: http://localhost:3005
2. Login as admin
3. Open browser console (F12)
4. Look for: `[STORE] Loading moderation data from database...`
5. Should see: `[STORE] ✅ Moderation data loaded successfully`

### 4. Warning System Test

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Admin Dashboard → Warnings tab | List loads (empty initially) |
| 2 | Click "Issue Warning" | Modal opens |
| 3 | Enter address, reason, click "Add Warning" | Warning added, badge shows "1/3" |
| 4 | Issue 2nd warning | Badge shows "2/3" |
| 5 | Issue 3rd warning | Badge shows "3/3" |
| 6 | Issue 4th warning | Message: "User auto-banned after 3 warnings" |

### 5. Ban System Test

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Admin Dashboard → Banned Users | List loads |
| 2 | Click "Ban User" | Modal opens |
| 3 | Enter address, reason, click "Ban User" | User banned |
| 4 | Check banned list | User appears |
| 5 | Click "Unban" | User removed from list |

### 6. Database Verification After Tests

```sql
-- Count warnings
SELECT COUNT(*) FROM warned_users;

-- Count bans
SELECT COUNT(*) FROM banned_users;

-- Count admin actions
SELECT COUNT(*) FROM admin_actions;

-- Recent activity
SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 10;

-- Check 3-strike enforcement
SELECT action_type, metadata->>'warningNumber' as warning_num
FROM admin_actions
WHERE action_type = 'warn_user'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Quick SQL Queries for Testing

### Find Users Near Ban Limit
```sql
SELECT wallet_address, COUNT(*) as warning_count
FROM warned_users
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY wallet_address
HAVING COUNT(*) >= 2
ORDER BY warning_count DESC;
```

### View All Active Bans
```sql
SELECT b.*, u.username as banned_by_username
FROM banned_users b
LEFT JOIN users u ON b.banned_by = u.id
WHERE b.is_active = true
ORDER BY b.banned_at DESC;
```

### View Recent Admin Actions
```sql
SELECT
  a.action_type,
  a.target_type,
  a.reason,
  u.username as admin_username,
  a.created_at
FROM admin_actions a
LEFT JOIN users u ON a.admin_id = u.id
ORDER BY a.created_at DESC
LIMIT 20;
```

---

## Common Issues

### "Moderation data not loading"

**Check:**
1. Is localStorage cleared? (Visit ?reset=true)
2. Is backend running? (http://localhost:3001)
3. Are you logged in? (Check localStorage for accessToken)
4. Check browser console for errors

### "403 Forbidden on warnings/bans"

**Fix:**
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```
Then logout and login again.

### "3-strike not working"

**Check:**
```sql
-- Count active warnings for user
SELECT COUNT(*) FROM warned_users
WHERE wallet_address = '0x...'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());
```

If count is 3+, the 4th warning should trigger auto-ban.

---

## Performance Benchmarks

Expected response times:

- Get warnings: **50-100ms**
- Get bans: **50-100ms**
- Create warning: **100-150ms**
- Ban user: **100-150ms**
- Get admin actions: **50-100ms**

---

## Success Criteria

- [ ] Backend starts without errors
- [ ] Frontend loads without errors
- [ ] Can access admin dashboard
- [ ] Can issue warnings
- [ ] Warnings appear in database
- [ ] 3-strike auto-ban works
- [ ] Can manually ban users
- [ ] Can unban users
- [ ] Admin actions are logged
- [ ] Can see audit trail
- [ ] No localStorage data (after clearing)
- [ ] Data persists across page refresh

---

## When Everything Works

You should see:

1. **Console logs:**
   ```
   [STORE] Loading moderation data from database...
   [STORE] Loaded 0 warnings from database
   [STORE] Loaded 0 bans from database
   [STORE] Loaded 0 admin actions from database
   [STORE] ✅ Moderation data loaded successfully
   ```

2. **Database has records:**
   - Warnings in `warned_users` table
   - Bans in `banned_users` table
   - Actions in `admin_actions` table

3. **UI shows:**
   - Badges update in real-time (1/3, 2/3, 3/3)
   - Auto-ban message on 4th warning
   - Audit log in Admin Actions tab

---

## Need Help?

1. Check `DEPLOYMENT_STATUS.md` for full documentation
2. Check server logs: `npm run server`
3. Check browser console (F12)
4. Review database: `psql -h localhost -U postgres -d dogepump_dev`

---

**Status:** Ready for testing
**Backend:** http://localhost:3001
**Frontend:** http://localhost:3005
**Database:** postgresql://localhost:5432/dogepump_dev

**First step:** Login as admin and use "Reset Data" button in Admin Dashboard
