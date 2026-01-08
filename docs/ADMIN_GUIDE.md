# Admin Panel Guide

This guide covers everything administrators need to know about managing the DogePump platform through the admin dashboard.

---

## Table of Contents

1. [Accessing the Admin Panel](#1-accessing-the-admin-panel)
2. [Authentication Methods](#2-authentication-methods)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Price Oracle Monitoring](#4-price-oracle-monitoring)
5. [Managing Reports](#5-managing-reports)
6. [User Banning System](#6-user-banning-system)
7. [Configuration](#7-configuration)
8. [Security Best Practices](#8-security-best-practices)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Accessing the Admin Panel

### URL Access

Navigate to: `https://yourdomain.com/admin`

### From Wallet Menu

1. Click on your wallet address in the top-right corner
2. Click "Admin" in the dropdown menu
3. You'll be redirected to `/admin`

---

## 2. Authentication Methods

### Method 1: Admin Wallet (Automatic)

**Recommended for production use**

Admin wallets can automatically access the dashboard without entering a code.

**How it works:**
1. Connect your wallet to the site
2. Navigate to `/admin`
3. If your wallet address is in the `ADMIN_WALLETS` list, you're automatically logged in

**Configuration:**

Edit `pages/Admin.tsx`:

```typescript
// Add admin wallet addresses (lowercase)
const ADMIN_WALLETS = [
  '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a', // Primary admin
  '0x1234567890abcdef1234567890abcdef12345678', // Add more admins here
];
```

**Important:** Always store wallet addresses in lowercase for case-insensitive comparison.

### Method 2: Access Code

**For quick access or development**

Enter the admin access code to authenticate.

**Default code:** `admin123`

**To change the code:**

Edit `pages/Admin.tsx`:

```typescript
const ADMIN_ACCESS_CODE = 'your-secure-code-here';
```

**Security Note:** In production, implement proper server-side authentication with session management and role-based access control.

---

## 3. Dashboard Overview

The admin panel has two main tabs:

### Overview Tab

Shows moderation statistics:
- **Total Reports**: All reports submitted
- **Pending**: Reports awaiting review
- **Resolved**: Reports that have been addressed
- **Token Reports**: Reports about specific tokens
- **Comment Reports**: Reports about user comments

### Price Oracle Tab

Comprehensive price monitoring dashboard (see section 4 below).

---

## 4. Price Oracle Monitoring

The Price Oracle Dashboard provides real-time monitoring of the DC/USD price oracle system.

### Accessing the Price Oracle Dashboard

1. Log in to the admin panel
2. Click the "Price Oracle" tab (dollar sign icon)

### Dashboard Sections

#### 1. Current Status Cards

```
┌─────────────────┬─────────────────┬─────────────────┐
│  DC Price       │  Price Age      │  TWAP Obs       │
│  $0.100000      │  2.5s           │  30             │
│  Source: pool   │  ✓ Fresh        │  5-min window   │
└─────────────────┴─────────────────┴─────────────────┘
```

**What they tell you:**
- **DC Price**: Current price in USD
- **Price Age**: How long since last update (should be < 60s)
- **TWAP Obs**: Number of price observations in the 5-minute window

#### 2. Pool Status Banner

```
✓ DC/wDOGE Pool Active
  Liquidity: $5,000.00
  Using on-chain TWAP (Primary)
```

**Indicators:**
- ✓ **Active**: Pool is deployed and working
- ✗ **Inactive**: Pool not deployed or insufficient liquidity
- ⚠ **Fallback**: Using API sources instead

#### 3. Price Sources List

Shows all available price sources and their status:

```
DC/wDOGE Pool (TWAP)
  ✓ $0.100000
  150ms

DEXScreener API
  ✓ $0.099500
  450ms

GeckoTerminal API
  - Inactive
```

**Status meanings:**
- ✓ **Active**: Source returned valid price
- ✗ **Failed**: Source returned error or invalid data
- `- Inactive`: Source not available/not configured

#### 4. Source Distribution

Pie chart showing which sources are being used most over the last 24 hours.

#### 5. Debug Console

Quick tests and debugging commands:

```javascript
// Get current price
priceOracleService.getCurrentPrice()

// Get price source info
priceOracleService.getPriceSource()

// Check if price is stale
priceOracleService.isPriceStale()

// Get price age
priceOracleService.getPriceAge()

// Force refresh price
await priceOracleService.refreshPrice()

// Check pool availability
await poolPriceService.isPoolAvailable()

// Get pool info
await poolPriceService.getPoolInfo()

// Get TWAP observation count
poolPriceService.getObservationCount()
```

### Understanding the Data

#### Price Age

- **< 30 seconds**: Excellent (real-time)
- **30-60 seconds**: Good (acceptable)
- **60-120 seconds**: Warning (may need attention)
- **> 120 seconds**: Critical (price is stale)

#### TWAP Observations

- **0-5 observations**: Too few (TWAP not reliable yet)
- **5-15 observations**: Good (building up)
- **15-30 observations**: Excellent (reliable TWAP)

#### Source Distribution

A healthy system should have:
- **Pool**: 60-80% (primary source)
- **DEXScreener**: 10-30% (fallback)
- **GeckoTerminal**: 0-10% (secondary fallback)
- **Cache**: 0-5% (only when all sources fail)

### Common Issues & Solutions

#### Issue: "Pool not deployed yet"

**Symptom:** Pool status shows "Inactive" with message about pool address.

**Solution:**
1. Deploy DC/wDOGE liquidity pool on DogeChain
2. Update `services/poolPriceService.ts`:
   ```typescript
   export const POOL_ADDRESS = '0x...'; // Your deployed pool address
   ```
3. Refresh the dashboard

#### Issue: "All sources failed, using cached price"

**Symptom:** All price sources showing ✗ and price source is "cache".

**Possible Causes:**
1. **Internet connectivity**: Check your connection
2. **API rate limits**: DEXScreener/GeckoTerminal have rate limits
3. **RPC endpoints**: DogeChain RPC nodes may be down

**Solutions:**
1. Check browser console for specific errors
2. Wait 1-2 minutes for rate limits to reset
3. If persistent, check service status pages

#### Issue: "Price deviation too high"

**Symptom:** Warning in console about price deviation, sources being rejected.

**Cause:** A price source returned a value very different from current price (anti-manipulation protection).

**This is normal behavior** - the system protects against:
- Flash loan attacks
- Price manipulation
- Bad data from APIs

**No action needed** - the system will fall back to other sources.

#### Issue: High price age (> 120 seconds)

**Symptom:** Price age showing stale data.

**Solutions:**
1. **Manual Refresh**: Click the refresh button in the debug console
2. **Check Pool Status**: Ensure pool is active
3. **Verify RPC Endpoints**: Check if DogeChain RPCs are accessible

---

## 5. Managing Reports

### View Reports

The Overview tab shows all submitted reports with filtering options:

**Filter Options:**
- **Status**: All, Pending, Reviewing, Resolved, Dismissed
- **Reason**: Scam, Spam, Harassment, Inappropriate, Other
- **Search**: Search by reporter, user, reason, or description
- **Sort**: By time or status

### Taking Action on Reports

1. **Click on a report** to view details
2. **Review the evidence**:
   - **For Token Reports**: Token information, market data, reporter description (including optional additional details)
   - **For Comment Reports**: Full comment content, author, timestamp, reporter description (including optional additional details)
3. **Choose an action:**
   - ✓ **Resolve**: Mark as resolved (report is valid)
   - ✗ **Dismiss**: Mark as dismissed (report is invalid)
   - **View**: Navigate to the token/comment
   - **Ban User**: Ban the reported user (with reason)

**Note**: Both token and comment reports include an "Additional Details (Optional)" field that allows users to provide extra context when submitting reports. This information is displayed in the report details modal for administrator review.

### Report Notifications

When users submit reports (token or comment), they receive a notification that:
- **Automatically navigates to the Admin Dashboard** when clicked
- Links directly to the appropriate section:
  - Token reports → `/admin#token-reports`
  - Comment reports → `/admin#comment-reports`
- Closes all dropdowns and menus for a clean transition
- Marks the notification as read

This ensures users can easily track their reports and admins can quickly access new reports from notifications.

### Bulk Actions

Coming soon:
- Bulk resolve
- Bulk dismiss
- Export to CSV

---

## 6. Configuration

### Admin Wallets

**File:** `pages/Admin.tsx`

```typescript
const ADMIN_WALLETS = [
  '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a', // Primary admin
  // Add more admin wallets (lowercase)
];
```

### Admin Access Code

**File:** `pages/Admin.tsx`

```typescript
const ADMIN_ACCESS_CODE = 'admin123'; // Change this!
```

### Price Oracle Configuration

**File:** `constants.ts`

```typescript
// Graduation threshold
export const GRADUATION_MARKETCAP_USD = 6900;

// Update interval
export const PRICE_UPDATE_INTERVAL = 30000; // 30 seconds

// Cache TTL
export const PRICE_CACHE_TTL = 60000; // 1 minute

// TWAP window
export const TWAP_WINDOW_SECONDS = 300; // 5 minutes

// Maximum deviation
export const MAX_PRICE_DEVIATION = 0.15; // 15%
```

### Pool Configuration

**File:** `services/poolPriceService.ts`

```typescript
// Pool address
export const POOL_ADDRESS = '0x...'; // Deployed pool address

// Minimum liquidity
export const MIN_POOL_LIQUIDITY_USD = 1000; // $1,000
```

---

## 7. Security Best Practices

### Production Deployment

1. **Use Server-Side Authentication**
   - Never rely solely on client-side authentication
   - Implement JWT tokens or session-based auth
   - Verify admin status on every API call

2. **Environment Variables**
   - Store sensitive values in environment variables
   - Never commit secrets to git
   ```typescript
   const ADMIN_WALLETS = process.env.REACT_APP_ADMIN_WALLETS?.split(',') || [];
   ```

3. **Rate Limiting**
   - Implement rate limiting on admin endpoints
   - Prevent brute force attacks on access code

4. **Audit Logging**
   - Log all admin actions
   - Include timestamp, admin address, action, and target
   - Store logs securely (not in client-side code)

5. **Multi-Factor Authentication (MFA)**
   - Consider implementing 2FA for admin access
   - Use services like Auth0, Firebase Auth, or custom solution

### Wallet Security

1. **Hardware Wallets**
   - Use hardware wallets (Ledger, Trezor) for admin actions
   - Never store private keys on the server

2. **Multi-Sig**
   - Consider multi-signature wallets for critical actions
   - Require 2-of-3 or 3-of-5 approvals

3. **Access Control**
   - Limit admin wallet addresses to essential personnel only
   - Regularly review and update admin list
   - Remove access for former admins immediately

---

## 6. User Banning System

The platform includes a comprehensive user banning system that prevents restricted users from performing actions on the platform.

### Ban Features

#### Enhanced Ban Detection

The ban system uses **dual-checking** to ensure users cannot bypass restrictions:

1. **Wallet Address Check**: Validates against user's wallet address
2. **Username Check**: Validates against username (including default "You")

This ensures bans work correctly even when:
- Users are not logged in with a custom username
- Users have changed their username
- Users attempt actions from different contexts

#### Actions Blocked for Banned Users

Banned users are prevented from:
- **Posting Comments**: Cannot add new comments on any token
- **Launching Tokens**: Cannot create new memecoins
- **Buying Tokens**: Cannot purchase tokens
- **Selling Tokens**: Cannot sell holdings

### Ban Notice Modal

When a banned user attempts a restricted action, they see a professional modal notification:

**Modal Features:**
- Red-themed design with warning icons
- Clear "Account Restricted" message
- Displays the ban reason (if provided)
- Appeal instructions with contact links:
  - X (Twitter): @dogepump
  - Telegram: Community support
- Cannot be dismissed without acknowledgment

### Banning Users

#### Via User Profile

1. Navigate to a user's profile page
2. Click the "Ban User" button
3. Enter a reason for the ban (required)
4. Confirm the ban

#### Via Admin Dashboard

1. Go to the "Reports" tab
2. Find a report related to the user
3. Click "View Details" on the report
4. In the report details modal, click "Ban User"
5. Enter the ban reason and confirm

### Unbanning Users

1. Go to the admin dashboard
2. Navigate to the "Banned Users" section (coming soon)
3. Find the user in the list
4. Click "Unban User"
5. Confirm the unban

**Note**: Currently, you can unban users by:
- Accessing the admin actions log
- Finding the ban action
- Clicking "Unban" next to the user entry

### Ban Persistence

Banned users are stored in:
- **localStorage**: `bannedUsers` array
- **Store Context**: Global state management

Each ban record includes:
- User address (wallet address)
- Username (at time of ban)
- Ban reason
- Timestamp

### Comment Reporting with Full Context

When users report comments, administrators can now see:

**Report Details Include:**
- **Reporter Information**: Who submitted the report
- **Report Reason**: Why the comment was reported
- **Comment Content**: Full text of the reported comment
- **Comment Author**: Username of the person who posted the comment
- **Timestamp**: When the comment was posted
- **Description**: Additional details from the reporter

This ensures administrators have complete context when reviewing reports and taking action.

### Best Practices for Banning

#### When to Ban

Consider banning users for:
- **Spam**: Repeated unsolicited promotions
- **Harassment**: Targeted abuse towards other users
- **Scam Attempts**: Fraudulent token launches or phishing
- **Inappropriate Content**: NSFW or prohibited content
- **Manipulation**: Market manipulation or bot activity

#### Ban Reasons

Always provide clear, specific ban reasons:
- ✅ "Repeated spam comments after 3 warnings"
- ✅ "Scam token launch impersonating legitimate project"
- ❌ "Bad user"
- ❌ "Banned"

Clear reasons help with:
- Appeal decisions
- Audit trails
- User understanding

#### Appeal Process

Users can appeal bans by:
1. Contacting via X: @dogepump
2. Joining Telegram community
3. Explaining the situation
4. Providing evidence of innocence

**Review Process:**
- Check ban history
- Review reported content
- Consider user's overall behavior
- Make impartial decision

### Monitoring Banned Users

#### Admin Actions Log

The system tracks all ban-related actions:
- When a user was banned
- Who performed the ban (admin wallet)
- The reason provided
- When a user was unbanned

Access via the admin dashboard's "Admin Actions" section.

#### Statistics

The Overview tab shows:
- Total number of active bans
- Recent ban activity
- Ban reason distribution

---

## 7. Configuration

### Admin Wallets

**File:** `pages/Admin.tsx`

```typescript
const ADMIN_WALLETS = [
  '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a', // Primary admin
  // Add more admin wallets (lowercase)
];
```

### Admin Access Code

**File:** `pages/Admin.tsx`

```typescript
const ADMIN_ACCESS_CODE = 'admin123'; // Change this!
```

### Price Oracle Configuration

**File:** `constants.ts`

```typescript
// Graduation threshold
export const GRADUATION_MARKETCAP_USD = 6900;

// Update interval
export const PRICE_UPDATE_INTERVAL = 30000; // 30 seconds

// Cache TTL
export const PRICE_CACHE_TTL = 60000; // 1 minute

// TWAP window
export const TWAP_WINDOW_SECONDS = 300; // 5 minutes

// Maximum deviation
export const MAX_PRICE_DEVIATION = 0.15; // 15%
```

### Pool Configuration

**File:** `services/poolPriceService.ts`

```typescript
// Pool address
export const POOL_ADDRESS = '0x...'; // Deployed pool address

// Minimum liquidity
export const MIN_POOL_LIQUIDITY_USD = 1000; // $1,000
```

---

## 8. Security Best Practices

### Production Deployment

1. **Use Server-Side Authentication**
   - Never rely solely on client-side authentication
   - Implement JWT tokens or session-based auth
   - Verify admin status on every API call

2. **Environment Variables**
   - Store sensitive values in environment variables
   - Never commit secrets to git
   ```typescript
   const ADMIN_WALLETS = process.env.REACT_APP_ADMIN_WALLETS?.split(',') || [];
   ```

3. **Rate Limiting**
   - Implement rate limiting on admin endpoints
   - Prevent brute force attacks on access code

4. **Audit Logging**
   - Log all admin actions
   - Include timestamp, admin address, action, and target
   - Store logs securely (not in client-side code)

5. **Multi-Factor Authentication (MFA)**
   - Consider implementing 2FA for admin access
   - Use services like Auth0, Firebase Auth, or custom solution

### Wallet Security

1. **Hardware Wallets**
   - Use hardware wallets (Ledger, Trezor) for admin actions
   - Never store private keys on the server

2. **Multi-Sig**
   - Consider multi-signature wallets for critical actions
   - Require 2-of-3 or 3-of-5 approvals

3. **Access Control**
   - Limit admin wallet addresses to essential personnel only
   - Regularly review and update admin list
   - Remove access for former admins immediately

---

## 9. Troubleshooting

### Can't Access Admin Panel

**Problem:** Stuck on login screen even with correct wallet connected.

**Solutions:**
1. **Check wallet address**: Verify it matches `ADMIN_WALLETS` (case-insensitive)
2. **Clear localStorage**: Open browser console and run:
   ```javascript
   localStorage.clear()
   location.reload()
   ```
3. **Reconnect wallet**: Disconnect and reconnect your wallet
4. **Check for typos**: Ensure address is correct in `pages/Admin.tsx`

### Price Oracle Not Working

**Problem:** Price oracle showing errors or no data.

**Solutions:**
1. **Check browser console** for specific error messages
2. **Verify pool address** in `services/poolPriceService.ts`
3. **Check RPC endpoints**: Try accessing DogeChain RPC directly
4. **Wait 1-2 minutes**: API rate limits may be active
5. **Refresh page**: Force reload with Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Dashboard Not Updating

**Problem:** Data is stale or not refreshing.

**Solutions:**
1. **Manual refresh**: Click refresh button in debug console
2. **Check price age**: If > 60s, try manual refresh
3. **Clear browser cache**: Hard refresh the page
4. **Check WebSocket**: If using WebSocket, verify server is running

### Reports Not Showing

**Problem:** Report counts show 0 but reports exist.

**Solutions:**
1. **Check filter settings**: Ensure filters aren't hiding reports
2. **Refresh page**: Force reload
3. **Check browser console**: Look for JavaScript errors
4. **Verify store context**: Ensure reports are loading properly

### Ban System Not Working

**Problem:** Banned users can still perform actions.

**Solutions:**
1. **Check localStorage**: Verify banned user is in the list
   ```javascript
   JSON.parse(localStorage.getItem('bannedUsers') || '[]')
   ```
2. **Clear browser cache**: Hard refresh the page
3. **Verify dual-check logic**: Ensure both address and username are checked
4. **Check store context**: Verify ban state is properly initialized

### Ban Notice Not Showing

**Problem:** Banned users don't see the ban notice modal.

**Solutions:**
1. **Check console for errors**: Look for React errors
2. **Verify modal state**: Ensure `banNoticeModal.isOpen` is set to true
3. **Check component mounting**: Ensure BanNoticeModal is rendered in App.tsx
4. **Test with different user**: Verify ban is applied correctly

---

## Advanced Features

### Real-Time Updates

The dashboard auto-refreshes every 10 seconds. To change this:

**File:** `components/PriceOracleDashboard.tsx`

```typescript
const REFRESH_INTERVAL = 10000; // 10 seconds (in milliseconds)
```

### Export Data

Coming soon:
- Export price history to CSV
- Export report data to CSV
- Download analytics charts

### Custom Alerts

Coming soon:
- Email alerts for stale prices
- SMS alerts for source failures
- Discord/Slack integration

---

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check `docs/` folder for additional documentation
4. Review code comments in source files
5. Check GitHub issues for known problems

---

**Last Updated**: December 2025
**Version**: 1.3
**Status**: Production Ready
**Changelog**:
- v1.3 (Dec 2025): Fixed notification routing to always navigate to admin dashboard; added auto-close for wallet menus
- v1.2 (Dec 2025): Added Additional Details field to token reports (matching comment reports)
- v1.1 (Dec 2025): Added comprehensive user banning system documentation
- v1.0 (Jan 2025): Initial release
