# Mempool Sniper Feature Preservation - Executive Summary

## Overview

This document provides a high-level summary of the memepool sniper feature preservation plan. For complete technical details, see [`sniper-feature-preservation-plan.md`](./sniper-feature-preservation-plan.md).

---

## Quick Facts

- **Total Files Identified**: 10 files
- **Files to Archive**: 1 file ([`pages/SniperTerminal.tsx`](../pages/SniperTerminal.tsx))
- **Files to Modify**: 4 files ([`App.tsx`](../App.tsx), [`components/Layout.tsx`](../components/Layout.tsx), [`server/routes/sitemap.ts`](../server/routes/sitemap.ts), [`PRODUCTION_DEPLOYMENT_GUIDE.md`](../PRODUCTION_DEPLOYMENT_GUIDE.md))
- **Files to Keep Unchanged**: 5 files (badge system, types, utilities)
- **Estimated Execution Time**: 35 minutes
- **Estimated Restoration Time**: 20-30 minutes

---

## What is the Sniper Feature?

The memepool sniper is a **real-time token monitoring terminal** that allows users to:

- Scan the mempool for newly created tokens
- Filter tokens by timeframe (5m, 15m, 1h, 4h, 24h)
- Sort by age, name, market cap, liquidity, price change, volume
- Set up **auto-buy** ("Auto-Ape") for automatic sniping
- Manually quick-buy tokens with one click
- Receive sound alerts when new tokens appear

**Key Technical Components**:
- React component with real-time state updates
- Integration with global store for token data
- Mock timeframe data augmentation for demonstration
- Sound effects and toast notifications
- Responsive design with dark theme

---

## Files Analysis

### Files to Archive

| File | Purpose | Size |
|------|---------|------|
| [`pages/SniperTerminal.tsx`](../pages/SniperTerminal.tsx) | Main sniper terminal page | 323 lines |

### Files to Modify

| File | Changes Required | Lines Affected |
|------|-----------------|----------------|
| [`App.tsx`](../App.tsx) | Remove lazy import and route | 22, 54 |
| [`components/Layout.tsx`](../components/Layout.tsx) | Remove navbar links (desktop & mobile) | 348-354, 651-662 |
| [`server/routes/sitemap.ts`](../server/routes/sitemap.ts) | Remove sitemap entry and robots.txt rule | 17, 66 |
| [`PRODUCTION_DEPLOYMENT_GUIDE.md`](../PRODUCTION_DEPLOYMENT_GUIDE.md) | Update allowed paths documentation | 1052 |

### Files to Keep (Not Sniper-Specific)

| File | Reason to Keep |
|------|----------------|
| [`contexts/StoreContext.tsx`](../contexts/StoreContext.tsx) | Badge system (sniper badge is separate feature) |
| [`components/Badge.tsx`](../components/Badge.tsx) | Badge display component (independent of terminal) |
| [`types.ts`](../types.ts) | Type definitions (badge type is part of gamification) |
| [`utils.ts`](../utils.ts) | Pseudonym generation utility (not sniper-specific) |
| [`pages/Launch.tsx`](../pages/Launch.tsx) | UI text references only, not functionality |

---

## Preservation Strategy

### Recommended Approach: **Archive with .disabled Folder**

**Why This Approach?**
✅ Cleanest separation - disabled code completely removed from active codebase  
✅ No dead code - production builds don't include unused code  
✅ Easy restoration - simple file move and uncomment operations  
✅ Clear intent - `.disabled` folder makes preservation obvious  
✅ Version control friendly - git history clearly shows what was disabled  
✅ No runtime overhead - no feature flag checks or conditional rendering  

### Archive Structure

```
.disabled/
├── pages/
│   └── SniperTerminal.tsx           # Main sniper terminal component
├── docs/
│   ├── sniper-feature-preservation-plan.md    # Complete technical documentation
│   └── sniper-restoration-guide.md          # Quick restoration steps
└── README.md                        # Archive overview
```

---

## Execution Steps

### Phase 1: Archive Setup (5 min)
1. Create `.disabled` directory structure
2. Create `.disabled/README.md` with archive overview

### Phase 2: File Archival (2 min)
1. Move [`pages/SniperTerminal.tsx`](../pages/SniperTerminal.tsx) to `.disabled/pages/SniperTerminal.tsx`

### Phase 3: Code Removal (10 min)
1. Remove sniper route from [`App.tsx`](../App.tsx)
2. Remove sniper navbar links from [`components/Layout.tsx`](../components/Layout.tsx) (desktop)
3. Remove sniper navbar links from [`components/Layout.tsx`](../components/Layout.tsx) (mobile)

### Phase 4: Server Updates (5 min)
1. Remove sitemap entry from [`server/routes/sitemap.ts`](../server/routes/sitemap.ts)
2. Remove robots.txt disallow rule from [`server/routes/sitemap.ts`](../server/routes/sitemap.ts)

### Phase 5: Documentation Updates (3 min)
1. Update [`PRODUCTION_DEPLOYMENT_GUIDE.md`](../PRODUCTION_DEPLOYMENT_GUIDE.md)
2. Create preservation documentation in `.disabled/docs/`

### Phase 6: Verification (10 min)
1. Build application
2. Check for TypeScript errors
3. Verify no broken links
4. Test badge system still works
5. Test all other features

**Total Time**: ~35 minutes

---

## Restoration Process

When ready to restore the sniper feature:

1. **Restore page file** (1 min)
   ```bash
   mv .disabled/pages/SniperTerminal.tsx pages/SniperTerminal.tsx
   ```

2. **Restore route in App.tsx** (3 min)
   - Uncomment lazy import
   - Uncomment route definition

3. **Restore navbar links in Layout.tsx** (5 min)
   - Add back desktop navbar link
   - Add back mobile menu link

4. **Update sitemap in server/routes/sitemap.ts** (2 min)
   - Add back sitemap entry
   - Add back robots.txt disallow rule

5. **Update documentation** (2 min)
   - Add `/sniper` back to allowed paths

6. **Test feature** (10-15 min)
   - Navigate to `/sniper`
   - Verify all functionality works

**Total Restoration Time**: ~20-30 minutes

---

## What Stays Working

After disabling the sniper terminal, these features **remain fully functional**:

✅ **Badge System** - Users can still earn the "Sniper" badge by buying tokens early (first 5% of curve)  
✅ **User Profiles** - All user data and achievements preserved  
✅ **Token Trading** - Buy/sell functionality on other pages unaffected  
✅ **Launch Page** - Token creation and fair launch mechanism works normally  
✅ **Navigation** - All other routes and features work as expected  

**Note**: The "Sniper" badge is a **gamification feature** independent of the sniper terminal. It rewards early adopters and should remain in the system.

---

## Risk Assessment

### Low Risk
- ✅ Badge system is completely separate
- ✅ No dependencies on sniper terminal in other features
- ✅ Clean removal without side effects
- ✅ Easy to restore if needed

### Medium Risk
- ⚠️ Users with bookmarked `/sniper` URLs will get 404 (handled gracefully)
- ⚠️ Documentation needs to be kept in sync

### Mitigation
- Keep comprehensive documentation in `.disabled/docs/`
- Update all references in deployment guides
- Monitor for any user feedback about missing feature

---

## Verification Checklist

### After Disabling (Pre-Launch)
- [ ] SniperTerminal.tsx moved to `.disabled/pages/`
- [ ] Route removed from App.tsx
- [ ] Desktop navbar link removed from Layout.tsx
- [ ] Mobile menu link removed from Layout.tsx
- [ ] Sitemap entry removed from server/routes/sitemap.ts
- [ ] Robots.txt disallow rule removed from server/routes/sitemap.ts
- [ ] Documentation updated in PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Application builds successfully
- [ ] No broken links or 404 errors
- [ ] Badge system still works
- [ ] All other features function normally

### After Restoration (Future Development)
- [ ] SniperTerminal.tsx restored to pages/
- [ ] Route restored in App.tsx
- [ ] Desktop navbar link restored in Layout.tsx
- [ ] Mobile menu link restored in Layout.tsx
- [ ] Sitemap entry restored in server/routes/sitemap.ts
- [ ] Robots.txt disallow rule restored in server/routes/sitemap.ts
- [ ] Documentation updated in PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Application builds successfully
- [ ] `/sniper` route loads correctly
- [ ] All sniper functionality works
- [ ] Badge system still works
- [ ] No console errors

---

## Next Steps

1. **Review this plan** with the development team
2. **Approve the preservation strategy**
3. **Switch to Code mode** to execute the plan
4. **Complete the 6-phase execution**
5. **Verify all changes** with the checklist
6. **Deploy to production** for initial launch

---

## Alternative Approaches Considered

### Feature Flag Approach
- **Pros**: No file movement, easy to toggle
- **Cons**: Dead code in production, feature flag management overhead
- **Verdict**: Not recommended for initial launch

### Branch Approach
- **Pros**: Clean separation in version control
- **Cons**: Branch management overhead, merge conflicts
- **Verdict**: Not recommended for this use case

### Comment-Out Approach
- **Pros**: Fastest to implement
- **Cons**: Dead code, less clean, TypeScript issues
- **Verdict**: Not recommended for production

**Recommended**: Archive approach (as detailed in this plan)

---

## Documentation

For complete technical details, including:
- Full file analysis with line-by-line references
- Detailed code change examples
- Risk mitigation strategies
- Post-disable monitoring guidelines
- Future development notes

See: [`sniper-feature-preservation-plan.md`](./sniper-feature-preservation-plan.md)

---

## Summary

The memepool sniper feature can be safely preserved for future development while being completely removed from the initial launch. The archive approach provides:

- ✅ **Clean separation** of disabled code
- ✅ **Easy restoration** when needed
- ✅ **No technical debt** in production builds
- ✅ **Complete documentation** for future developers
- ✅ **Minimal risk** to existing functionality

**Total effort**: 35 minutes to disable, 20-30 minutes to restore

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-27  
**Status**: Ready for Execution  
**Next Action**: Switch to Code mode to implement preservation plan
