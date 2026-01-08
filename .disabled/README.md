# Disabled Features Archive

This directory contains features that have been disabled for the initial launch but preserved for future development.

## Archived Features

### Mempool Sniper Terminal

**Status**: Disabled for initial launch  
**Date Disabled**: 2025-12-27  
**Reason**: Feature requires additional development and testing before production release

#### What's Archived

- **`pages/SniperTerminal.tsx`** - Main sniper terminal component with real-time token monitoring
- **`docs/sniper-feature-preservation-plan.md`** - Complete technical documentation
- **`docs/sniper-preservation-summary.md`** - Executive summary and quick reference

#### What Was Removed from Active Code

- Route definition in `App.tsx` (`/sniper`)
- Navbar links in `components/Layout.tsx` (desktop and mobile)
- Sitemap entry in `server/routes/sitemap.ts`
- Documentation references in `PRODUCTION_DEPLOYMENT_GUIDE.md`

#### What Remains Functional

The following components are **NOT** part of the sniper terminal and remain fully active:

- **Badge System** - Users can still earn the "Sniper" badge by buying tokens early (first 5% of curve)
- **Store Context** - Badge definitions and unlock logic in `contexts/StoreContext.tsx`
- **Badge Component** - Badge display in `components/Badge.tsx`
- **Type Definitions** - Badge type in `types.ts`
- **Utilities** - Pseudonym generation in `utils.ts`

## Restoration Guide

For detailed restoration instructions, see [`docs/sniper-feature-preservation-plan.md`](./docs/sniper-feature-preservation-plan.md) or [`docs/sniper-preservation-summary.md`](./docs/sniper-preservation-summary.md).

### Quick Restoration Steps

1. **Restore the page file**
   ```bash
   mv .disabled/pages/SniperTerminal.tsx pages/SniperTerminal.tsx
   ```

2. **Restore route in App.tsx**
   - Uncomment the lazy import around line 22
   - Uncomment the route definition around line 54

3. **Restore navbar links in Layout.tsx**
   - Add back desktop navbar link (around lines 348-354)
   - Add back mobile menu link (around lines 651-662)

4. **Update sitemap in server/routes/sitemap.ts**
   - Add back sitemap entry (around line 17)
   - Add back robots.txt disallow rule (around line 66)

5. **Update documentation**
   - Add `/sniper` back to allowed paths in `PRODUCTION_DEPLOYMENT_GUIDE.md` (around line 1052)

6. **Test the feature**
   - Navigate to `/sniper`
   - Verify all functionality works
   - Test auto-buy, filtering, sorting, etc.

**Estimated Restoration Time**: 20-30 minutes

## Important Notes

- All archived files are preserved exactly as they were when disabled
- No modifications were made to the badge system or other independent features
- The archive approach ensures clean separation without dead code in production
- Git history contains the original implementation context

## Contact

For questions about restoring disabled features, refer to the documentation in the `docs/` subdirectory or consult with the development team.

---

**Last Updated**: 2025-12-27  
**Archive Version**: 1.0
