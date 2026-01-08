# Sniper Terminal Feature Restoration Guide

**Date Disabled:** 2025-12-27  
**Reason:** Feature disabled for initial launch, preserved for future development  
**Estimated Restoration Time:** 20-30 minutes

---

## Overview

This guide provides step-by-step instructions for restoring the memepool sniper terminal feature to the DogePump application. The feature has been completely archived and can be restored when ready for production use.

---

## What Was Disabled

### Archived Files
- **`.disabled/pages/SniperTerminal.tsx`** - Main sniper terminal component (323 lines)

### Removed from Active Code
- Route definition in `App.tsx` (`/sniper`)
- Desktop navbar link in `components/Layout.tsx`
- Mobile menu link in `components/Layout.tsx`
- Documentation reference in `PRODUCTION_DEPLOYMENT_GUIDE.md`

### What Remains Functional (Do NOT Modify)
The following components are **NOT** part of the sniper terminal and must remain unchanged:
- Badge system in `contexts/StoreContext.tsx` (sniper badge is separate feature)
- Badge component in `components/Badge.tsx`
- Badge type definition in `types.ts`
- Pseudonym generation in `utils.ts`
- UI text references in `pages/Launch.tsx`

---

## Restoration Steps

### Step 1: Restore the Page File (1 minute)

```bash
# Move the archived file back to pages/
mv .disabled/pages/SniperTerminal.tsx pages/SniperTerminal.tsx

# Verify the file is restored
ls -la pages/SniperTerminal.tsx
```

**Expected Result:** `pages/SniperTerminal.tsx` should exist with 323 lines of code.

---

### Step 2: Restore Route in App.tsx (3 minutes)

Open `App.tsx` and add back the sniper route:

**Around line 22, add the lazy import:**
```typescript
const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal'));
```

**Around line 54, add the route definition:**
```typescript
<Route path="/sniper" element={<SniperTerminal />} />
```

**Complete context for reference:**
```typescript
// Lazy Load Pages (around line 15-25)
const Home = React.lazy(() => import('./pages/Home'));
const Launch = React.lazy(() => import('./pages/Launch'));
const TokenDetail = React.lazy(() => import('./pages/TokenDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const DogeTV = React.lazy(() => import('./pages/DogeTV'));
const SniperTerminal = React.lazy(() => import('./pages/SniperTerminal')); // ADD THIS
const Earn = React.lazy(() => import('./pages/Earn'));
const Admin = React.lazy(() => import('./pages/Admin'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Routes section (around line 45-56)
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/launch" element={<Launch />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/earn" element={<Earn />} />
  <Route path="/token/:id" element={<TokenDetail />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/profile/:address" element={<Profile />} />
  <Route path="/tv" element={<DogeTV />} />
  <Route path="/sniper" element={<SniperTerminal />} /> // ADD THIS
  <Route path="/admin" element={<Admin />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

### Step 3: Restore Desktop Navbar Link in Layout.tsx (2 minutes)

Open `components/Layout.tsx` and add back the desktop sniper link:

**Around line 348, after the TV link, add:**
```typescript
<Link 
  to="/sniper"
  onClick={() => playSound('click')}
  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${location.pathname === '/sniper' ? 'bg-[#00E054] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-[#00E054] hover:text-black hover:bg-[#00E054]'}`}
>
   <Crosshair size={16} />
</Link>
```

**Complete context for reference:**
```typescript
{/* Desktop Nav - around line 322-354 */}
<div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-full border border-white/[0.05] backdrop-blur-md shadow-inner">
  {navLinks.map((link) => (
    <Link
      key={link.path}
      to={link.path}
      onClick={() => playSound('click')}
      onMouseEnter={() => playSound('hover')}
      className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden group ${
        location.pathname === link.path 
          ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {location.pathname === link.path && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
      <link.icon size={16} className={`relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5 ${location.pathname === link.path ? "animate-bounce-subtle" : ""}`} />
      <span className="relative z-10">{link.name}</span>
    </Link>
  ))}
  <Link 
    to="/tv"
    onClick={() => playSound('click')}
    className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300"
  >
     <Tv size={16} /> TV
  </Link>
  <Link 
    to="/sniper"
    onClick={() => playSound('click')}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${location.pathname === '/sniper' ? 'bg-[#00E054] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-[#00E054] hover:text-black hover:bg-[#00E054]'}`}
  >
     <Crosshair size={16} />
  </Link>
</div>
```

---

### Step 4: Restore Mobile Menu Link in Layout.tsx (2 minutes)

Open `components/Layout.tsx` and add back the mobile sniper link:

**Around line 651, after the DogeTV link, add:**
```typescript
<Link
  to="/sniper"
  onClick={() => { setActiveMobileMenu('none'); playSound('click'); }}
  className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
    location.pathname === '/sniper'
      ? 'bg-[#00E054] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
      : 'text-[#00E054] hover:text-black hover:bg-[#00E054]'
  }`}
>
   <Crosshair size={18} />
   <span>Sniper</span>
</Link>
```

**Complete context for reference:**
```typescript
{/* Mobile Menu Dropdown - around line 618-656 */}
{activeMobileMenu === 'hamburger' && (
  <div className="md:hidden bg-doge-bg/95 backdrop-blur-xl border-b border-white/10">
    <div className="px-4 py-6 space-y-1">
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={() => { setActiveMobileMenu('none'); playSound('click'); }}
          className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            location.pathname === link.path
              ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
           <link.icon size={18} />
           <span>{link.name}</span>
        </Link>
      ))}
      <Link
        to="/tv"
        onClick={() => { setActiveMobileMenu('none'); playSound('click'); }}
        className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all duration-300"
      >
         <Tv size={18} />
         <span>DogeTV</span>
      </Link>
      <Link
        to="/sniper"
        onClick={() => { setActiveMobileMenu('none'); playSound('click'); }}
        className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          location.pathname === '/sniper'
            ? 'bg-[#00E054] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
            : 'text-[#00E054] hover:text-black hover:bg-[#00E054]'
        }`}
      >
         <Crosshair size={18} />
         <span>Sniper</span>
      </Link>
    </div>
  </div>
)}
```

---

### Step 5: Update Documentation (2 minutes)

Open `PRODUCTION_DEPLOYMENT_GUIDE.md` and add `/sniper` back to the allowed paths:

**Around line 1052, update:**
```markdown
- Allow: `/`, `/launch`, `/leaderboard`, `/earn`, `/tv`, `/sniper`
```

---

### Step 6: Test the Feature (10-15 minutes)

#### 6.1 Build the Application

```bash
# Clean build
rm -rf dist/
rm -rf node_modules/.vite/

# Production build
npm run build

# Verify build completes without errors
```

#### 6.2 Start Development Server

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:5173
```

#### 6.3 Test Functionality

**Desktop Navigation:**
- [ ] Sniper icon appears in desktop navbar (green crosshair)
- [ ] Clicking sniper icon navigates to `/sniper`
- [ ] Active state shows green background when on sniper page

**Mobile Navigation:**
- [ ] Opening hamburger menu shows Sniper link
- [ ] Clicking Sniper link navigates to `/sniper`
- [ ] Active state shows green background when on sniper page

**Sniper Terminal Page:**
- [ ] Page loads without errors
- [ ] Token list displays (mock or real data)
- [ ] Timeframe filters work (5m, 15m, 1h, 4h, 24h)
- [ ] Sorting works (age, name, market cap, liquidity, change, volume)
- [ ] Search/filter functionality works
- [ ] Auto-buy ("Auto-Ape") buttons work
- [ ] Quick buy buttons work
- [ ] Sound alerts play for new tokens
- [ ] Responsive design works on mobile

**Badge System:**
- [ ] Sniper badge still works independently (awarded for early token purchases)
- [ ] Badge display in profiles works correctly
- [ ] No conflicts between sniper terminal and sniper badge

#### 6.4 Check Console for Errors

```javascript
// Open browser DevTools
// Check Console tab for errors
// Check Network tab for failed requests
```

**Expected:** No console errors, no failed network requests.

---

## Verification Checklist

After completing restoration, verify:

- [ ] `pages/SniperTerminal.tsx` restored from `.disabled/pages/`
- [ ] Lazy import added to `App.tsx` (line 22)
- [ ] Route definition added to `App.tsx` (line 54)
- [ ] Desktop navbar link added to `components/Layout.tsx` (line 348)
- [ ] Mobile menu link added to `components/Layout.tsx` (line 651)
- [ ] Documentation updated in `PRODUCTION_DEPLOYMENT_GUIDE.md` (line 1052)
- [ ] Application builds successfully
- [ ] `/sniper` route loads correctly
- [ ] Desktop navigation shows sniper icon
- [ ] Mobile navigation shows sniper link
- [ ] All sniper functionality works (scanning, filtering, sorting, auto-buy)
- [ ] Badge system still works
- [ ] No console errors
- [ ] No TypeScript errors

---

## Troubleshooting

### Issue: Build fails with "Module not found" error

**Solution:** Verify `pages/SniperTerminal.tsx` was restored correctly:
```bash
ls -la pages/SniperTerminal.tsx
```

### Issue: Route not found (404 error)

**Solution:** Check that the route was added to `App.tsx`:
```typescript
<Route path="/sniper" element={<SniperTerminal />} />
```

### Issue: Navbar link doesn't appear

**Solution:** Verify the link was added to both desktop and mobile sections in `Layout.tsx`

### Issue: TypeScript errors about missing imports

**Solution:** Ensure all required imports are present in `SniperTerminal.tsx`:
- React hooks
- react-helmet-async (Helmet)
- lucide-react icons
- StoreContext
- Toast component
- Audio service
- Web3 service
- Utils

### Issue: Badge system not working

**Solution:** Do NOT modify badge-related files. The badge system is separate from the sniper terminal:
- Keep `contexts/StoreContext.tsx` unchanged
- Keep `components/Badge.tsx` unchanged
- Keep `types.ts` unchanged

---

## Important Notes

### What NOT to Restore

The following are **NOT** part of the sniper terminal feature and must remain unchanged:

1. **Badge System** (`contexts/StoreContext.tsx`)
   - The "Sniper" badge is a gamification feature
   - Awarded to users who buy tokens early (first 5% of curve)
   - Completely independent of the sniper terminal

2. **Badge Component** (`components/Badge.tsx`)
   - Badge display logic
   - Badge styling
   - Badge animations

3. **Type Definitions** (`types.ts`)
   - BadgeType includes 'sniper'
   - This is part of the type system, not the terminal

4. **Utilities** (`utils.ts`)
   - 'Sniper' in NOUNS array
   - Used for pseudonym generation
   - Not specific to sniper terminal

5. **UI Text** (`pages/Launch.tsx`)
   - References to "snipers" in descriptive text
   - User-facing explanations about fair launches
   - Not code functionality

### Crosshair Icon Import

The `Crosshair` icon is imported from lucide-react in `components/Layout.tsx` (line 4). This import should remain even when the sniper feature is disabled, as it may be used elsewhere in the application.

---

## Post-Restoration Testing

### Performance Testing

```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:5173/sniper --output html --output-path sniper-lighthouse.html
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 100

### Load Testing

Test with multiple users accessing the sniper page simultaneously:
- Monitor server resources
- Check for memory leaks
- Verify WebSocket connections (if using real-time data)

### Security Testing

- Verify auto-buy functionality is secure
- Check for XSS vulnerabilities
- Test rate limiting on API calls
- Verify user permissions

---

## Future Development Notes

When developing the sniper feature for future release:

1. **Review Archived Code**
   - Understand the original implementation
   - Note any TODO comments or incomplete features
   - Identify areas for improvement

2. **Enhance Functionality**
   - Consider improvements based on learnings
   - Add missing features if needed
   - Optimize performance

3. **Test Thoroughly**
   - The feature was disabled for a reason
   - Test all edge cases
   - Verify security measures

4. **Document Changes**
   - Update this restoration guide
   - Add new features to documentation
   - Record any breaking changes

5. **Consider Feature Flag**
   - May want to use feature flag for gradual rollout
   - Test with subset of users first
   - Monitor for issues

6. **Security Review**
   - Ensure auto-buy functionality is secure
   - Verify no vulnerabilities in real-time scanning
   - Test with malicious inputs

7. **Performance Testing**
   - Verify real-time scanning doesn't impact performance
   - Test with high token volumes
   - Monitor memory usage

---

## Rollback Procedure

If restoration causes issues, rollback immediately:

```bash
# 1. Remove the page file
rm pages/SniperTerminal.tsx

# 2. Remove route from App.tsx
# Delete the lazy import and route definition

# 3. Remove navbar links from Layout.tsx
# Delete desktop and mobile sniper links

# 4. Update documentation
# Remove /sniper from PRODUCTION_DEPLOYMENT_GUIDE.md

# 5. Rebuild
npm run build

# 6. Verify
npm run dev
```

---

## Contact & Support

If questions arise during restoration:

1. Review this guide thoroughly
2. Check git history for original implementation
3. Consult with original developers if available
4. Test in development environment before production changes
5. Refer to `.disabled/docs/sniper-feature-preservation-plan.md` for technical details

---

## Summary

The memepool sniper feature can be safely restored by following this guide. The archive approach ensures:

- ✅ Complete preservation of original code
- ✅ Clean separation from active codebase
- ✅ Easy restoration when needed
- ✅ No technical debt in production builds
- ✅ Comprehensive documentation for future developers

**Total Restoration Time:** 20-30 minutes  
**Difficulty:** Low  
**Risk:** Minimal (can be easily rolled back)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-27  
**Status:** Ready for Use
