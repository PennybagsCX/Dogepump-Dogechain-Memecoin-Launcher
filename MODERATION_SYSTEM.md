# Moderation System Documentation

## Overview

The DogePump platform includes a comprehensive moderation and administration system designed to maintain community standards and protect users. This system includes:

- ⚠️ **3-Strike Warning System** - Progressive disciplinary system for users
- 🚫 **Ban System** - Account restrictions with automatic enforcement
- 💬 **Trollbox Restrictions** - Chat moderation for banned users
- 🛡️ **Admin Dashboard** - Centralized moderation management
- 📢 **User Notifications** - Clear communication of moderation actions

---

## Table of Contents

1. [3-Strike Warning System](#3-strike-warning-system)
2. [Ban System](#ban-system)
3. [Trollbox Restrictions](#trollbox-restrictions)
4. [Admin Dashboard](#admin-dashboard)
5. [User Experience](#user-experience)
6. [Technical Implementation](#technical-implementation)
7. [Data Persistence](#data-persistence)

---

## 3-Strike Warning System

### Overview

The 3-strike warning system is a progressive disciplinary system that tracks user violations and automatically applies penalties after 3 warnings.

### Features

#### Warning Types

1. **User Warnings** - Applied to a user's account
   - Affect the user across all their tokens
   - Count toward account-level penalties
   - Can lead to account ban

2. **Token Warnings** - Applied to a specific token
   - Only affect the specific token
   - Count toward token-level penalties
   - Can lead to token delisting

#### Warning Progression

```
Warning 1 → Yellow Badge (1/3 Warnings)
     ↓
Warning 2 → Orange Badge (2/3 Warnings)
     ↓
Warning 3 → Red Badge (3/3 Warnings) + Auto Penalty
```

### Automatic Penalties

#### At 3 Warnings (User Level)

- **Automatic Account Ban** - User account is banned
- **Token Delisting** - All tokens created by the user are delisted
- **Access Revoked** - User cannot:
  - Create new tokens
  - Post in trollbox
  - Comment on tokens
  - Trade tokens

#### At 3 Warnings (Token Level)

- **Automatic Token Delisting** - Specific token is delisted
- **Trading Halted** - Token cannot be traded
- **Access Revoked** - Token page shows delisting notice

### Warning Details

Each warning includes:

- **Reason** - Why the warning was issued
- **Notes** - Additional context from admin
- **Timestamp** - When the warning was created
- **Issued By** - Which admin issued the warning
- **Active Status** - Whether warning is currently active
- **Acknowledgment** - Whether user has acknowledged the warning

### Warning Expiration

- **Duration**: 30 days
- **Auto-expire**: Warnings automatically deactivate after 30 days
- **Manual Clear**: Admins can clear warnings early

---

## Ban System

### Overview

Users can be banned from the platform for severe or repeated violations. The ban system provides both automatic (3-strike) and manual banning capabilities.

### Ban Types

1. **Automatic Bans** - Triggered by 3-strike system
2. **Manual Bans** - Issued by admins directly

### Ban Effects

When a user is banned:

#### Immediate Effects

✅ Account is marked as banned
✅ All active tokens are delisted
✅ Token pages show "Creator Banned" notice to visitors
✅ Ban notice modal shown to banned user

#### Restricted Actions

❌ Cannot create new tokens
❌ Cannot post in trollbox (shows detailed ban notice)
❌ Cannot comment on tokens
❌ Cannot trade tokens
❌ Cannot access creator tools

#### Access Control

- **Visitors**: See "Creator Banned" page when visiting banned user's tokens
- **Banned Creator**: Sees ban notice modal + restricted access
- **Token Pages**: Display ban reason and notes

### Ban Details

Each ban includes:

- **Reason** - Why the ban was issued
- **Notes** - Additional context from admin
- **Timestamp** - When the ban was created
- **Banned By** - Which admin issued the ban
- **Auto/Manual** - Whether ban was automatic (3-strike) or manual

---

## Trollbox Restrictions

### Overview

The trollbox (platform chat) is moderated to prevent banned users from posting and maintain community standards.

### Restrictions

#### Banned Users

When a banned user attempts to post in the trollbox:

1. **Message Blocked** - Post does not go through
2. **System Message Displayed** - Detailed ban notice appears in chat:
   ```
   🔒 ACCOUNT BANNED: [Reason] | [Notes] | Appeal: @dogepump (X) or t.me/dogepump
   ```
3. **Special Styling** - Red background with ban icon for visibility
4. **Appeal Information** - Direct links to appeal channels

#### Features

- **Text Messages** - Blocked with ban notice
- **Stickers** - Blocked with ban notice
- **Emojis** - Can be typed but message won't send
- **View Only** - Banned users can still read chat

### Ban Notice Message Format

```
ACCOUNT BANNED: {reason} | {notes} | Appeal: @dogepump (X) or t.me/dogepump
```

Example:
```
ACCOUNT BANNED: Spamming chat | Multiple warnings ignored | Appeal: @dogepump (X) or t.me/dogepump
```

---

## Admin Dashboard

### Overview

The admin dashboard provides a centralized interface for managing all moderation actions.

### Features

#### Warnings Section

- **View All Warnings** - List of all active warnings
- **Warning Badges** - Real-time warning count (1/3, 2/3, 3/3)
- **Filter by Type** - User warnings vs Token warnings
- **Active/Inactive** - View warning status

##### Warning Actions

1. **Add Warning**
   - Click "Issue Warning" button
   - Select user or token
   - Enter reason and notes
   - System automatically tracks count
   - At 3 warnings: Auto-ban/delist

2. **Acknowledge Warning** (User Action)
   - User clicks "I Acknowledge This Warning"
   - Warning marked as acknowledged
   - Modal closes

3. **Clear Warning**
   - Admin can clear individual warnings
   - Reduces warning count
   - Logged in admin actions

#### Bans Section

- **View All Bans** - List of all banned users
- **Ban Details** - Reason, notes, timestamp
- **Auto/Manual Tags** - Shows how ban was issued

##### Ban Actions

1. **Ban User**
   - Click "Ban User" button
   - Enter reason and notes
   - All tokens auto-delisted
   - User immediately restricted

2. **Unban User**
   - Click "Unban User" button
   - User account restored
   - Tokens remain delisted (manual relist required)

#### Token Management

- **Delist Token** - Remove token from platform
- **Relist Token** - Restore delisted token
- **View Token Warnings** - See token-specific warnings

#### Admin Actions Log

All moderation actions are logged:

- **Action Type** - Warn, ban, delist, etc.
- **Target** - User or token affected
- **Admin** - Who performed the action
- **Reason** - Why action was taken
- **Timestamp** - When action occurred

### Real-Time Updates

- **Version Tracking** - Warning badges update automatically
- **Component Remounting** - React components refresh on state changes
- **Optimized Rendering** - Efficient state management prevents performance issues

---

## User Experience

### Warning Modal

When a user has active warnings, they see a modal notification:

#### Display

- **Automatic Trigger** - Modal opens when user visits affected pages
- **Smart Updates** - Only re-opens if warning content changes
- **Warning Count Badge** - Shows current strike count (1/3, 2/3, 3/3)

#### Content

```
⚠️ WARNING 2 of 3

You Have Received a Warning

Your account has received a warning from the DogePump moderation team.

Warning Reason: [Reason]
Additional Notes: [Notes]

3-Strike Policy
You currently have 2 active warnings out of 3.
After 3 warnings, your account may be banned or your tokens may be delisted.

1 warning remaining before penalties are applied.

Please Follow Community Guidelines
Continued violations may result in account restrictions or temporary bans.

[I Acknowledge This Warning]
```

#### Final Warning (3/3)

```
⚠️ FINAL WARNING

This is your final warning. Any further violations will result in
immediate account suspension or token delisting.
```

### Ban Notice Modal

When a banned user visits the platform:

#### Display

- **Automatic Trigger** - Opens when banned user visits their token page
- **Persistent** - Shows until acknowledged

#### Content

```
🚫 Account Restricted

Action Blocked
Your account has been restricted from performing this action on the DogePump platform.

Reason: Account Banned: [Reason] | [Notes]

Appeal This Decision
If you believe this restriction is an error or would like to appeal this decision,
please contact our support team.

[@dogepump] [Telegram]

[I Understand]
```

### Creator Banned Page

When visitors access a token created by a banned user:

```
🚫 Creator Banned

The creator of this token ([TOKEN NAME] / $TICKER) has been banned from DogePump
for violating our community guidelines.

Reason: [Ban Reason]
Notes: [Ban Notes]

All tokens created by banned users are inaccessible to protect our community.

[← Return to Home]
```

---

## Technical Implementation

### Architecture

#### State Management

**StoreContext** (`contexts/StoreContext.tsx`)

Core state management for moderation features:

```typescript
// State
bannedUsers: BannedUser[]
warnedUsers: WarnedUser[]
adminActions: AdminAction[]
banNoticeModal: { isOpen: boolean, reason: string }
warningNoticeModal: { isOpen: boolean, reason: string, notes: string, warningCount: number, maxWarnings: number }

// Key Functions
warnUser(targetAddress, reason, notes, tokenId?)
banUser(targetAddress, reason, notes, autoBan?)
unbanUser(targetAddress)
delistToken(tokenId, reason, notes)
relistToken(tokenId)
showWarningModal(reason, notes, warningCount, maxWarnings, targetAddress, tokenId)
showBanNoticeModal(reason)
```

#### Components

1. **AdminDashboard** (`components/AdminDashboard.tsx`)
   - Warning management interface
   - Ban management interface
   - Admin actions log
   - Real-time badge updates

2. **WarningModal** (`components/WarningModal.tsx`)
   - Displays warning details to users
   - Shows 3-strike progression
   - Acknowledgment button

3. **BanNoticeModal** (`components/BanNoticeModal.tsx`)
   - Displays ban details to banned users
   - Appeal information
   - Link to support channels

4. **Trollbox** (`components/Trollbox.tsx`)
   - Chat interface
   - Ban enforcement
   - System message display

### Key Algorithms

#### 3-Strike Check

```typescript
const warnUser = (targetAddress: string, reason: string, notes: string, tokenId?: string) => {
  // Count active warnings
  const activeWarnings = warnedUsers.filter(u =>
    u.address.toLowerCase() === targetAddress.toLowerCase() &&
    u.isActive &&
    (tokenId ? u.tokenId === tokenId : !u.tokenId)
  );

  const warningCount = activeWarnings.length;

  // 3-Strike Rule: Apply penalty instead of adding 4th warning
  if (warningCount >= 3) {
    if (tokenId) {
      delistToken(tokenId, `Automatic delist after 3 warnings`, notes);
    } else {
      banUser(targetAddress, `Automatic ban after 3 warnings`, notes, true);
      // Delist all tokens created by banned user
      const userTokens = tokens.filter(t =>
        t.creator.toLowerCase() === targetAddress.toLowerCase() && !t.delisted
      );
      userTokens.forEach(token => delistToken(token.id, `Creator banned`, `All tokens delisted due to creator ban`));
    }
    return; // Don't add 4th warning
  }

  // Add warning if less than 3
  const warnedUser: WarnedUser = {
    address: targetAddress,
    tokenId,
    warnedAt: Date.now(),
    warnedBy: userAddress || 'Admin',
    reason,
    notes,
    isActive: true,
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  };
  setWarnedUsers(prev => [warnedUser, ...prev]);
};
```

#### Trollbox Ban Check

```typescript
const handleSend = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  if (!inputValue.trim()) return;

  // Check if user is banned
  const currentUserAddress = userAddress || userProfile.username || 'Me';
  const bannedUserRecord = bannedUsers.find(b =>
    b.address.toLowerCase() === currentUserAddress.toLowerCase() ||
    b.address.toLowerCase() === (userProfile.username || '').toLowerCase()
  );

  if (bannedUserRecord) {
    // Create detailed ban notice message in chat
    const banNoticeMessage: Message = {
      id: Date.now().toString(),
      user: 'System',
      text: `ACCOUNT BANNED: ${bannedUserRecord.reason}${bannedUserRecord.notes ? ` | ${bannedUserRecord.notes}` : ''} | Appeal: @dogepump (X) or t.me/dogepump`,
      timestamp: Date.now(),
      isSystem: true
    };

    setMessages(prev => [...prev, banNoticeMessage]);
    setInputValue('');
    return;
  }

  // Normal message sending...
};
```

#### Real-Time Badge Updates

```typescript
// AdminDashboard.tsx

const [warningsVersion, setWarningsVersion] = useState(0);

const WarningBadge: React.FC<WarningBadgeProps> = ({ address, tokenId, warnedUsers, isActive, warningsVersion }) => {
  const warningCount = warnedUsers.filter(w =>
    w.address.toLowerCase() === address.toLowerCase() &&
    w.isActive &&
    (tokenId ? w.tokenId === tokenId : !w.tokenId)
  ).length;

  // Render badge with warning count
  return <span className={/* styles based on count */}>{warningCount}/3 Warnings</span>;
};

// Usage with dynamic key for forced remount
<WarningBadge
  key={`${warning.address}-${warning.tokenId || 'user'}-${warningsVersion}`}
  address={warning.address}
  tokenId={warning.tokenId}
  warnedUsers={warnedUsers}
  isActive={warning.isActive}
  warningsVersion={warningsVersion}
/>
```

---

## Data Persistence

### LocalStorage Structure

All moderation data is persisted in localStorage:

```typescript
// Banned Users
localStorage.setItem('bannedUsers', JSON.stringify([
  {
    id: string,
    address: string,
    bannedAt: number,
    bannedBy: string,
    reason: string,
    notes: string,
    isActive: boolean
  }
]));

// Warnings
localStorage.setItem('warnedUsers', JSON.stringify([
  {
    address: string,
    tokenId?: string,
    warnedAt: number,
    warnedBy: string,
    reason: string,
    notes: string,
    isActive: boolean,
    expiresAt: number,
    acknowledgedAt?: number
  }
]));

// Admin Actions
localStorage.setItem('adminActions', JSON.stringify([
  {
    id: string,
    type: 'warn_user' | 'ban_user' | 'delist_token' | 'relist_token',
    targetType: 'user' | 'token',
    targetId: string,
    adminAddress: string,
    reason: string,
    notes: string,
    timestamp: number
  }
]));

// Token Updates
localStorage.setItem('tokens', JSON.stringify([
  {
    ...token,
    delisted: boolean,
    delistedReason?: string,
    delistedAt?: number
  }
]));
```

### Data Loading

```typescript
// Initialize from localStorage on app load
useEffect(() => {
  const storedBannedUsers = localStorage.getItem('bannedUsers');
  if (storedBannedUsers) {
    setBannedUsers(JSON.parse(storedBannedUsers));
  }

  const storedWarnedUsers = localStorage.getItem('warnedUsers');
  if (storedWarnedUsers) {
    setWarnedUsers(JSON.parse(storedWarnedUsers));
  }

  const storedAdminActions = localStorage.getItem('adminActions');
  if (storedAdminActions) {
    setAdminActions(JSON.parse(storedAdminActions));
  }
}, []);
```

---

## Best Practices

### For Admins

1. **Document Everything**
   - Always provide clear reasons
   - Include detailed notes
   - Reference specific violations

2. **Progressive Discipline**
   - Start with warnings
   - Escalate to bans for repeat offenses
   - Give users chance to correct behavior

3. **Consistency**
   - Apply rules fairly
   - Don't show favoritism
   - Follow 3-strike policy

4. **Communication**
   - Be clear and professional
   - Provide actionable feedback
   - Include appeal information

### For Users

1. **Read Warnings Carefully**
   - Understand why you were warned
   - Take corrective action
   - Don't ignore warnings

2. **Acknowledge Warnings**
   - Click acknowledgment button
   - Shows you understand the issue
   - Prevents repeated warnings

3. **Follow Guidelines**
   - Be respectful in chat
   - Don't spam or scam
   - Report issues, don't retaliate

4. **Appeal Process**
   - Contact @dogepump on X
   - Or use Telegram channel
   - Provide context and evidence

---

## Security Considerations

### Input Validation

- All warning reasons and notes are sanitized
- Admin actions are logged and attributable
- No HTML/script injection possible

### Access Control

- Only admins can issue warnings/bans
- Admin actions are logged
- No way for users to bypass restrictions

### Data Integrity

- State updates are atomic
- No race conditions in warning counting
- localStorage updates are synchronized

---

## Future Enhancements

Potential improvements for the moderation system:

1. **Warning Appeals**
   - Formal appeal process
   - Appeal review queue
   - Appeal outcomes tracking

2. **Temporary Bans**
   - Time-limited bans
   - Automatic reinstatement
   - Warning on temp ban

3. **Probation System**
   - Post-ban probation
   - Monitoring period
   - Gradual privilege restoration

4. **Warning Categories**
   - Different warning types
   - Category-specific penalties
   - Category expiration rules

5. **Automated Detection**
   - Spam detection
   - Toxic language filtering
   - Automatic warning suggestions

---

## Support

For questions or issues with the moderation system:

- 📧 Email: support@dogepump.com
- 𝕏 X: @dogepump
- 💬 Telegram: t.me/dogepump
- 📖 Documentation: See other docs in repository

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: DogePump Development Team
