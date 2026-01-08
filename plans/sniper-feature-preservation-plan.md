# Mempool Sniper Feature Preservation Plan

## Executive Summary

This document provides a comprehensive plan for preserving the memepool sniper feature for future development while disabling it for the initial launch. All files and functionality will be archived and can be easily restored when needed.

---

## 1. File Inventory & Analysis

### 1.1 Core Sniper Files

#### **pages/SniperTerminal.tsx**
- **Purpose**: Main sniper terminal page component with live token monitoring, filtering, and auto-buy functionality
- **Size**: 323 lines
- **Dependencies**:
  - React hooks (useState, useEffect, useRef, useMemo)
  - react-helmet-async (Helmet)
  - lucide-react icons (Target, Zap, Activity, Clock, Search, Crosshair, etc.)
  - StoreContext (useStore)
  - Toast component (useToast)
  - Audio service (playSound)
  - Web3 service (formatNumber, formatCurrency)
  - Utils (timeAgo)
- **Key Features**:
  - Real-time token scanning from mempool
  - Timeframe-based filtering (5m, 15m, 1h, 4h, 24h)
  - Sorting by age, name, market cap, liquidity, change, volume
  - Auto-buy functionality ("Auto-Ape")
  - Quick buy buttons for manual sniping
  - Sound alerts for new tokens
  - Mock timeframe data augmentation
- **Preservation Action**: Move to `.disabled/pages/` folder

---

### 1.2 Routing & Navigation Files

#### **App.tsx**
- **Lines**: 22, 54
- **Purpose**: Main application routing configuration
- **Sniper References**:
  - Line 22: `const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));`
  - Line 54: `<Route path="/sniper" element={<SniperTerminal />} />`
- **Dependencies**: React Router, lazy loading
- **Preservation Action**: Comment out or remove the lazy import and route definition

#### **components/Layout.tsx**
- **Lines**: 4, 348-354, 651-662
- **Purpose**: Main layout component with navigation bar
- **Sniper References**:
  - Line 4: Import of `Crosshair` icon from lucide-react
  - Lines 348-354: Desktop navbar link to `/sniper`
  - Lines 651-662: Mobile menu link to `/sniper`
- **Dependencies**: React Router, lucide-react icons
- **Preservation Action**: Remove sniper navbar links (both desktop and mobile)

---

### 1.3 Context & State Management Files

#### **contexts/StoreContext.tsx**
- **Lines**: 18, 187, 745
- **Purpose**: Global state management for the application
- **Sniper References**:
  - Line 18: `'0x881...Cc22': 'MoonSniper'` (mock username)
  - Line 187: `sniper: { id: 'sniper', label: 'Sniper', icon: 'Target', description: 'Bought a token early (first 5% of curve)' }` (badge definition)
  - Line 745: `unlockBadge('sniper')` (badge unlock logic in launchToken function)
- **Dependencies**: React Context, localStorage, various services
- **Preservation Action**: Keep as-is (badge system is separate from sniper terminal feature)

#### **components/Badge.tsx**
- **Lines**: 16
- **Purpose**: Badge display component for user achievements
- **Sniper References**:
  - Line 16: `sniper: { icon: Target, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Sniper' }`
- **Dependencies**: React, lucide-react icons
- **Preservation Action**: Keep as-is (badge system is separate from sniper terminal feature)

---

### 1.4 Type Definitions

#### **types.ts**
- **Lines**: 43
- **Purpose**: TypeScript type definitions for the application
- **Sniper References**:
  - Line 43: `export type BadgeType = 'dev' | 'whale' | 'sniper' | 'diamond' | 'degen' | 'early' | 'burner' | 'farmer';`
- **Dependencies**: None (pure type definitions)
- **Preservation Action**: Keep as-is (type definition is part of badge system)

---

### 1.5 Utility Files

#### **utils.ts**
- **Lines**: 210
- **Purpose**: Utility functions for the application
- **Sniper References**:
  - Line 210: `const NOUNS = ['Inu', 'Whale', 'Sniper', 'Hands', 'Ape', 'Elon', 'Dev', 'Hodler', 'Bull', 'Bear', 'Rocket', 'Coin', 'Gem', 'Knight', 'Wizard', 'Viking'];`
- **Dependencies**: None (pure utility functions)
- **Preservation Action**: Keep as-is (used for pseudonym generation, not sniper-specific)

---

### 1.6 Server/SEO Files

#### **server/routes/sitemap.ts**
- **Lines**: 17, 66
- **Purpose**: Sitemap and robots.txt generation for SEO
- **Sniper References**:
  - Line 17: `{ url: '/sniper-terminal', lastmod: currentDate, changefreq: 'weekly', priority: '0.6' }` (sitemap entry)
  - Line 66: `Disallow: /sniper-terminal/` (robots.txt disallow)
- **Dependencies**: Fastify
- **Preservation Action**: Remove sitemap entry and robots.txt disallow rule

---

### 1.7 Documentation Files

#### **PRODUCTION_DEPLOYMENT_GUIDE.md**
- **Lines**: 1052
- **Purpose**: Production deployment documentation
- **Sniper References**:
  - Line 1052: `- Allow: `/`, `/launch`, `/leaderboard`, `/earn`, `/tv`, `/sniper``
- **Dependencies**: None (documentation)
- **Preservation Action**: Update to remove `/sniper` from allowed paths

---

### 1.8 Minor References

#### **pages/Launch.tsx**
- **Lines**: 367, 385
- **Purpose**: Token launch page
- **Sniper References**:
  - Line 367: UI text "Beat the snipers"
  - Line 385: UI text "Buying in the same block as deployment ensures you get the best price before snipers."
- **Dependencies**: React, various components
- **Preservation Action**: Keep as-is (these are UI text references, not code functionality)

---

## 2. Preservation Strategy

### 2.1 Recommended Approach: Feature Flag with Archive

**Rationale**: Using a feature flag provides the cleanest approach for preservation while maintaining the ability to quickly enable/disable the feature without code changes.

### 2.2 Archive Structure

```
.disabled/
├── pages/
│   └── SniperTerminal.tsx           # Main sniper terminal component
├── docs/
│   └── sniper-restoration-guide.md   # This document
└── README.md                        # Archive overview
```

### 2.3 Code Changes Required

#### **Step 1: Archive the Sniper Terminal Page**
- Move `pages/SniperTerminal.tsx` to `.disabled/pages/SniperTerminal.tsx`
- This preserves the complete component for future use

#### **Step 2: Remove Route from App.tsx**
```typescript
// BEFORE:
const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));
// ...
<Route path="/sniper" element={<SniperTerminal />} />

// AFTER:
// const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));
// ...
// <Route path="/sniper" element={<SniperTerminal />} />
```

#### **Step 3: Remove Navbar Links from Layout.tsx**
```typescript
// Remove desktop navbar link (lines 348-354):
// <Link to="/sniper" ...>

// Remove mobile menu link (lines 651-662):
// <Link to="/sniper" ...>

// Note: Crosshair icon import can remain as it may be used elsewhere
```

#### **Step 4: Update Sitemap (server/routes/sitemap.ts)**
```typescript
// Remove line 17:
// { url: '/sniper-terminal', lastmod: currentDate, changefreq: 'weekly', priority: '0.6' },

// Remove line 66:
// Disallow: /sniper-terminal/
```

#### **Step 5: Update Documentation (PRODUCTION_DEPLOYMENT_GUIDE.md)**
```markdown
# BEFORE:
- Allow: `/`, `/launch`, `/leaderboard`, `/earn`, `/tv`, `/sniper`

# AFTER:
- Allow: `/`, `/launch`, `/leaderboard`, `/earn`, `/tv`
```

---

## 3. What to Keep (Not Part of Sniper Feature)

The following references should **NOT** be removed as they are part of the badge system or general utilities:

### 3.1 Badge System (Keep)
- `types.ts` - BadgeType includes 'sniper'
- `contexts/StoreContext.tsx` - Badge definition and unlock logic
- `components/Badge.tsx` - Badge component configuration

**Rationale**: The "Sniper" badge is awarded to users who buy tokens early (first 5% of curve), which is a legitimate gamification feature independent of the sniper terminal.

### 3.2 Utilities (Keep)
- `utils.ts` - 'Sniper' in NOUNS array for pseudonym generation

**Rationale**: This is used for generating random usernames and is not specific to the sniper terminal feature.

### 3.3 UI Text (Keep)
- `pages/Launch.tsx` - References to "snipers" in descriptive text

**Rationale**: These are user-facing explanations about fair launches and are not code functionality.

---

## 4. Restoration Process

### 4.1 Quick Restoration Steps

When ready to restore the sniper feature:

1. **Restore the page file**
   ```bash
   mv .disabled/pages/SniperTerminal.tsx pages/SniperTerminal.tsx
   ```

2. **Restore route in App.tsx**
   ```typescript
   // Uncomment these lines:
   const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));
   <Route path="/sniper" element={<SniperTerminal />} />
   ```

3. **Restore navbar links in Layout.tsx**
   - Add back desktop navbar link (around line 348)
   - Add back mobile menu link (around line 651)

4. **Update sitemap in server/routes/sitemap.ts**
   - Add back sitemap entry
   - Add back robots.txt disallow rule (if needed)

5. **Update documentation**
   - Add `/sniper` back to allowed paths in PRODUCTION_DEPLOYMENT_GUIDE.md

6. **Test the feature**
   - Navigate to `/sniper`
   - Verify all functionality works
   - Test auto-buy, filtering, sorting, etc.

### 4.2 Estimated Restoration Time
- **File restoration**: 1 minute
- **Code changes**: 5-10 minutes
- **Testing**: 10-15 minutes
- **Total**: ~20-30 minutes

---

## 5. Verification Checklist

### 5.1 After Disabling (Pre-Launch)

- [ ] SniperTerminal.tsx moved to `.disabled/pages/`
- [ ] Route removed from App.tsx
- [ ] Desktop navbar link removed from Layout.tsx
- [ ] Mobile menu link removed from Layout.tsx
- [ ] Sitemap entry removed from server/routes/sitemap.ts
- [ ] Robots.txt disallow rule removed from server/routes/sitemap.ts
- [ ] Documentation updated in PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Application builds successfully
- [ ] No broken links or 404 errors
- [ ] Badge system still works (sniper badge can still be earned)
- [ ] All other features function normally

### 5.2 After Restoration (Future Development)

- [ ] SniperTerminal.tsx restored to pages/
- [ ] Route restored in App.tsx
- [ ] Desktop navbar link restored in Layout.tsx
- [ ] Mobile menu link restored in Layout.tsx
- [ ] Sitemap entry restored in server/routes/sitemap.ts
- [ ] Robots.txt disallow rule restored in server/routes/sitemap.ts
- [ ] Documentation updated in PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Application builds successfully
- [ ] `/sniper` route loads correctly
- [ ] All sniper functionality works (scanning, filtering, auto-buy, etc.)
- [ ] Badge system still works
- [ ] No console errors

---

## 6. Alternative Preservation Approaches

### 6.1 Feature Flag Approach (Alternative)

Instead of removing code, use a feature flag:

```typescript
// constants.ts
export const FEATURE_FLAGS = {
  SNIPER_TERMINAL: false, // Set to true to enable
};

// App.tsx
import { FEATURE_FLAGS } from './constants';

// In Routes:
{FEATURE_FLAGS.SNIPER_TERMINAL && (
  <Route path="/sniper" element={<SniperTerminal />} />
)}

// Layout.tsx
{FEATURE_FLAGS.SNIPER_TERMINAL && (
  <Link to="/sniper">Sniper</Link>
)}
```

**Pros**:
- No file movement needed
- Easy to toggle on/off
- Code remains in version control

**Cons**:
- Feature flag management overhead
- Dead code in production builds
- Less clean separation

### 6.2 Branch Approach (Alternative)

Create a separate branch for the sniper feature:

```bash
git checkout -b feature/sniper-terminal
# Move all sniper-related files to this branch
git checkout main
# Continue development on main branch
```

**Pros**:
- Clean separation in version control
- No dead code in main branch

**Cons**:
- Branch management overhead
- Merge conflicts when restoring
- Harder to maintain parallel development

### 6.3 Comment-Out Approach (Alternative)

Simply comment out all sniper-related code:

```typescript
// const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));
// <Route path="/sniper" element={<SniperTerminal />} />
```

**Pros**:
- Fastest to implement
- Easy to uncomment later

**Cons**:
- Dead code in production
- Less clean than archiving
- TypeScript may still reference disabled code

---

## 7. Recommended Approach Summary

**Primary Recommendation**: **Archive Approach** (Section 2.3)

**Why**:
1. **Cleanest separation**: Disabled code is completely removed from active codebase
2. **No dead code**: Production builds don't include unused code
3. **Easy restoration**: Simple file move and uncomment operations
4. **Clear intent**: `.disabled` folder makes it obvious what's preserved
5. **Version control friendly**: Git history clearly shows what was disabled
6. **No runtime overhead**: No feature flag checks or conditional rendering

---

## 8. Risk Assessment

### 8.1 Risks of Disabling

| Risk | Likelihood | Impact | Mitigation |
|-------|-----------|--------|------------|
| Broken links if users bookmark `/sniper` | Medium | Low | 404 page handles gracefully |
| Badge system affected | Low | High | Badge system is separate, keep intact |
| Missing dependencies when restoring | Low | Medium | Archive complete file with imports |
| Documentation becomes outdated | Medium | Low | Update all documentation references |

### 8.2 Risks of Not Preserving

| Risk | Likelihood | Impact | Mitigation |
|-------|-----------|--------|------------|
| Lost code if accidentally deleted | Medium | High | Archive to `.disabled` folder |
| Difficult to recreate feature | High | High | Complete preservation with documentation |
| Lost context/intent | Medium | Medium | Comprehensive documentation |

---

## 9. Execution Plan for Code Mode

### Phase 1: Archive Setup (5 minutes)
1. Create `.disabled` directory structure
2. Create `.disabled/README.md` with archive overview
3. Create `.disabled/docs/` directory for preservation documentation

### Phase 2: File Archival (2 minutes)
1. Move `pages/SniperTerminal.tsx` to `.disabled/pages/SniperTerminal.tsx`

### Phase 3: Code Removal (10 minutes)
1. Remove sniper route from `App.tsx`
2. Remove sniper navbar links from `components/Layout.tsx` (desktop)
3. Remove sniper navbar links from `components/Layout.tsx` (mobile)

### Phase 4: Server Updates (5 minutes)
1. Remove sitemap entry from `server/routes/sitemap.ts`
2. Remove robots.txt disallow rule from `server/routes/sitemap.ts`

### Phase 5: Documentation Updates (3 minutes)
1. Update `PRODUCTION_DEPLOYMENT_GUIDE.md`
2. Create this preservation document in `.disabled/docs/`

### Phase 6: Verification (10 minutes)
1. Build the application
2. Check for TypeScript errors
3. Verify no broken links
4. Test badge system still works
5. Test all other features

**Total Estimated Time**: 35 minutes

---

## 10. Post-Disable Monitoring

After disabling the sniper feature, monitor for:

1. **Error logs**: Check for any 404 errors on `/sniper` route
2. **User feedback**: Watch for users asking about missing sniper feature
3. **Performance**: Verify no performance degradation
4. **Badge system**: Ensure sniper badge still works correctly
5. **Analytics**: Monitor for any unexpected traffic patterns

---

## 11. Future Development Notes

When developing the sniper feature for future release:

1. **Review archived code**: Understand the original implementation
2. **Enhance functionality**: Consider improvements based on learnings
3. **Test thoroughly**: The feature was disabled for a reason
4. **Document changes**: Update this preservation document
5. **Consider feature flag**: May want to use feature flag for gradual rollout
6. **Security review**: Ensure auto-buy functionality is secure
7. **Performance testing**: Verify real-time scanning doesn't impact performance

---

## 12. Contact & Support

If questions arise during preservation or restoration:

- Review this document thoroughly
- Check git history for original implementation
- Consult with original developers if available
- Test in development environment before production changes

---

## Appendix A: File Summary Table

| File | Type | Action | Reason |
|------|------|--------|---------|
| `pages/SniperTerminal.tsx` | Component | Archive | Main sniper terminal page |
| `App.tsx` | Routing | Remove route | Remove `/sniper` route definition |
| `components/Layout.tsx` | Navigation | Remove links | Remove navbar links to `/sniper` |
| `server/routes/sitemap.ts` | SEO | Remove entries | Remove sitemap and robots.txt entries |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Documentation | Update | Remove `/sniper` from allowed paths |
| `contexts/StoreContext.tsx` | State | Keep | Badge system is separate |
| `components/Badge.tsx` | Component | Keep | Badge system is separate |
| `types.ts` | Types | Keep | Badge type definition is separate |
| `utils.ts` | Utilities | Keep | Used for pseudonym generation |
| `pages/Launch.tsx` | UI | Keep | Text references only |

---

## Appendix B: Quick Reference Commands

### Archive
```bash
mkdir -p .disabled/pages .disabled/docs
mv pages/SniperTerminal.tsx .disabled/pages/
```

### Restore
```bash
mv .disabled/pages/SniperTerminal.tsx pages/
```

### Verify Archive
```bash
ls -la .disabled/pages/
cat .disabled/README.md
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-27  
**Status**: Ready for Execution  
**Next Step**: Switch to Code mode to implement preservation plan
