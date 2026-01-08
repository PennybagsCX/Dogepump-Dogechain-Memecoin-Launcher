# DogePump Quick Start Guide

This guide helps you get DogePump up and running from scratch, including deployment configuration and admin setup.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Setup](#2-initial-setup)
3. [Configuration](#3-configuration)
4. [Deployment Steps](#4-deployment-steps)
5. [Post-Deployment](#5-post-deployment)
6. [Admin Setup](#6-admin-setup)
7. [Verification](#7-verification)

---

## 1. Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Git**: For cloning the repository

### Required Accounts

- **DogeChain RPC Access**: Use free public RPCs or set up your own
- **DogeChain Wallet**: For deploying contracts and pools
- **Domain Name**: For hosting (optional but recommended)
- **Hosting Provider**: Vercel, Netlify, AWS, or similar

### Optional but Recommended

- **IPFS Pinning Service**: Pinata, NFT.Storage, or Web3.Storage
- **Analytics**: Google Analytics, Mixpanel, or Plausible
- **Error Tracking**: Sentry, LogRocket, or Bugsnag

---

## 2. Initial Setup

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/dogepump.git
cd dogepump

# Install dependencies
npm install

# or if using yarn
yarn install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=https://your-api.com/api
VITE_WS_URL=wss://your-api.com

# DogeChain Configuration
VITE_DOGECHAIN_RPC_URL=https://rpc.dogechain.dog
VITE_DOGECHAIN_CHAIN_ID=2000

# Contract Addresses (update after deployment)
VITE_DC_TOKEN_ADDRESS=0x7B4328c127B85369D9f82ca0503B000D09CF9180
VITE_WDOGE_TOKEN_ADDRESS=0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101

# Pool Address (update after deployment)
VITE_POOL_ADDRESS=0x0000000000000000000000000000000000000000

# Admin Configuration
VITE_ADMIN_WALLETS=0x22f4194f6706e70abaa14ab352d0baa6c7ced24a

# Feature Flags
VITE_ENABLE_PRICE_ORACLE=true
VITE_ENABLE_WEBSOCKET=false
VITE_ENABLE_ANALYTICS=false
```

---

## 3. Configuration

### 1. Update Constants

Edit `constants.ts` to configure platform parameters:

```typescript
// Graduation threshold (USD)
export const GRADUATION_MARKETCAP_USD = 6900; // Adjust as needed

// Price oracle settings
export const PRICE_UPDATE_INTERVAL = 30000; // 30 seconds
export const PRICE_CACHE_TTL = 60000; // 1 minute
export const TWAP_WINDOW_SECONDS = 300; // 5 minutes
export const MAX_PRICE_DEVIATION = 0.15; // 15%

// Token launch settings
export const MAX_CREATOR_BUY_PERCENTAGE = 0.03; // 3%
export const TOTAL_SUPPLY = 1000000000; // 1 billion
```

### 2. Configure Admin Wallets

Edit `pages/Admin.tsx`:

```typescript
const ADMIN_WALLETS = [
  '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a', // Your admin wallet (lowercase)
  // Add more admin wallets as needed
];

const ADMIN_ACCESS_CODE = 'your-secure-code-here'; // Change from default
```

### 3. Update Pool Address

Edit `services/poolPriceService.ts`:

```typescript
export const POOL_ADDRESS = '0x...'; // Your deployed DC/wDOGE pool address
```

**Note**: Skip this for now if you haven't deployed the pool yet. See step 5.

---

## 4. Deployment Steps

### Step 1: Build the Application

```bash
# Build for production
npm run build

# or with specific configuration
npm run build -- --mode production
```

This creates a `dist/` folder with optimized production files.

### Step 2: Deploy to Hosting

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Option C: AWS S3 + CloudFront

1. Create an S3 bucket
2. Upload `dist/` contents
3. Enable static website hosting
4. Set up CloudFront distribution
5. Configure custom domain (optional)

#### Option D: Custom Server

```bash
# Using serve for simple static hosting
npm i -g serve
serve -s dist -l 3000

# Or use nginx/apache for production
```

### Step 3: Configure Domain

**If using Vercel/Netlify:**
1. Add custom domain in platform dashboard
2. Update DNS records (CNAME or A record)
3. Wait for SSL certificate to provision

**Manual DNS:**
```
Type: CNAME
Name: @
Value: your-hosting-provider.com
TTL: 3600
```

---

## 5. Post-Deployment

### Step 1: Deploy DC/wDOGE Pool

This is critical for the price oracle to work properly.

#### Prerequisites

- DC tokens (you'll need to mint or acquire them)
- wDOGE (Wrapped DOGE) tokens
- DogeChain wallet with gas (DOGE)

#### Deploy the Pool

1. **Go to a DEX on DogeChain**:
   - DogeSwap: https://swap.dogechain.dog
   - Pumpkin: https://pumpkin.dogechain.dog
   - Or any Uniswap V2 fork

2. **Add Liquidity**:
   - Token 1: DC (your token address)
   - Token 2: wDOGE
   - Amount: Minimum recommended:
     - 100,000 DC
     - 10,000 wDOGE
     - (Adjust based on your needs)

3. **Note the Pool Address**:
   - After adding liquidity, the DEX will show the pool address
   - Copy this address

#### Update Pool Address in Code

Edit `services/poolPriceService.ts`:

```typescript
export const POOL_ADDRESS = '0x...'; // Paste your pool address here
```

Redeploy the application:

```bash
npm run build
vercel --prod
```

### Step 2: Verify Price Oracle

1. Navigate to your deployed site
2. Click wallet menu → Admin
3. Enter admin code or connect admin wallet
4. Click "Price Oracle" tab
5. Verify:
   - Pool status shows "Active"
   - Price is updating every 30 seconds
   - TWAP observations are increasing

### Step 3: Test Token Launch

1. Connect wallet
2. Navigate to `/launch`
3. Create a test token
4. Verify:
   - Creator limit is enforced (3%)
   - Graduation calculation uses USD price
   - Progress bar updates correctly

---

## 6. Admin Setup

### Access Admin Panel

1. Go to `https://yourdomain.com/admin`
2. Connect your admin wallet
3. You should be automatically logged in

**Alternative:** Enter the admin access code (if changed from default)

### Configure Admin Settings

#### Add More Admins

Edit `pages/Admin.tsx`:

```typescript
const ADMIN_WALLETS = [
  '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a',
  '0xabcd1234...', // Add second admin (lowercase)
  '0xefgh5678...', // Add third admin (lowercase)
];
```

**Important:** Always convert addresses to lowercase.

#### Change Access Code

Edit `pages/Admin.tsx`:

```typescript
const ADMIN_ACCESS_CODE = 'your-new-secure-code';
```

### Monitor Price Oracle

From the admin panel:

1. Click "Price Oracle" tab
2. Monitor the following:
   - **Price Age**: Should be < 60 seconds
   - **Pool Status**: Should show "Active"
   - **TWAP Observations**: Should be > 5 after 5 minutes
   - **Source Distribution**: Pool should be 60-80%

### Set Up Alerts (Coming Soon)

- Email alerts for stale prices
- Discord notifications for pool failures
- SMS alerts for critical issues

---

## 7. Verification

### Check Price Oracle Health

Navigate to `/admin` → "Price Oracle" tab and verify:

✅ **Pool Status**: "Active" with green checkmark
✅ **Price Age**: < 30 seconds
✅ **TWAP Observations**: Increasing over time
✅ **Current Price**: Reasonable value (not $0 or extremely high)
✅ **Source Distribution**: Pool showing highest percentage

### Check Token Launch Flow

1. Go to `/launch`
2. Fill in token details
3. Set initial buy amount (try exceeding 3% to test limit)
4. Verify error message appears
5. Set valid amount (under 3%)
6. Launch token
7. Verify graduation progress bar updates correctly

### Check Graduation Calculation

Create a token and buy until it approaches graduation:

```bash
# Target marketcap: $6,900 USD
# Example: DC price = $0.10
# Required DC = 69,000 DC
# Required tokens = 69,000 / 0.000005 = 13.8 billion tokens (won't happen)
# More realistic: Graduation based on price increase
```

Verify:
- Progress bar shows percentage
- Percentage is based on USD marketcap
- Graduates when $6,900 USD marketcap reached

### Test Admin Features

1. **Authentication**:
   - ✓ Auto-login with admin wallet
   - ✓ Manual login with access code
   - ✓ Logout works correctly

2. **Price Oracle Dashboard**:
   - ✓ Real-time updates every 10 seconds
   - ✓ All status cards showing data
   - ✓ Price sources list working
   - ✓ Debug console commands work

3. **Reports Tab**:
   - ✓ View all reports
   - ✓ Filter by status/reason
   - ✓ Resolve/dismiss reports

---

## Troubleshooting

### "Pool not deployed yet" Message

**Cause**: Pool address is still placeholder

**Fix**:
1. Deploy DC/wDOGE pool (see Step 5)
2. Update `services/poolPriceService.ts`
3. Rebuild and redeploy

### Price Oracle Shows "All sources failed"

**Cause**: API rate limits or network issues

**Fix**:
1. Wait 1-2 minutes
2. Check browser console for errors
3. Verify internet connection
4. Check DogeChain RPC status

### Admin Wallet Not Recognized

**Cause**: Address case mismatch or not in ADMIN_WALLETS

**Fix**:
1. Ensure address is lowercase in `pages/Admin.tsx`
2. Verify address matches exactly
3. Clear localStorage and reconnect wallet

### Graduation Calculation Wrong

**Cause**: Graduation threshold not updated or DC price incorrect

**Fix**:
1. Check `GRADUATION_MARKETCAP_USD` in `constants.ts`
2. Verify DC price in admin dashboard
3. Check price oracle is working

### Build Errors

**Cause**: Missing dependencies or version conflicts

**Fix**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update

# Try building again
npm run build
```

---

## Next Steps

### Phase 1: Core Platform (Current)

✅ Token launch with bonding curve
✅ Price oracle with multi-source fallback
✅ On-chain pool support
✅ Admin dashboard
✅ Real-time monitoring

### Phase 2: Enhanced Features

- [ ] WebSocket real-time updates
- [ ] Historical price tracking
- [ ] Advanced analytics
- [ ] Mobile app

### Phase 3: Production Hardening

- [ ] Server-side authentication
- [ ] Rate limiting
- [ ] DDoS protection
- [ ] Multi-region deployment

### Phase 4: Advanced Integrations

- [ ] Chainlink price feeds
- [ ] Multi-pool aggregation
- [ ] Predictive analytics
- [ ] Automated market making

---

## Maintenance Tasks

### Daily

- Monitor price oracle health in admin dashboard
- Check for critical errors in logs
- Verify pool liquidity is sufficient

### Weekly

- Review price source distribution
- Check for unusual price patterns
- Update wDOGE price if hardcoded

### Monthly

- Review admin access list
- Update dependencies
- Check security advisories
- Audit smart contracts (if applicable)

### Quarterly

- Performance optimization
- Cost analysis
- Feature planning
- Security audit

---

## Support Resources

### Documentation

- **Admin Guide**: `docs/ADMIN_GUIDE.md`
- **Price Oracle Architecture**: `docs/PRICE_ORACLE_ARCHITECTURE.md`
- **Graduation Config**: `docs/GRADUATION_CONFIG_GUIDE.md`
- **Advanced Features**: `docs/ADVANCED_FEATURES_GUIDE.md`

### Code Comments

All services and components have inline JSDoc comments:

```typescript
/**
 * Get current DC price in USD
 * @returns {Promise<number>} Price in USD
 */
async getDCPriceUSD(): Promise<number>
```

### Browser Console

Debug commands available in admin dashboard (see ADMIN_GUIDE.md section 4.5)

---

## Cost Estimate

### Monthly Operating Costs

- **Hosting**: $0-$20 (Vercel free tier or basic plan)
- **RPC Calls**: $0 (public DogeChain RPCs)
- **API Calls**: $0 (free tiers of DEXScreener/GeckoTerminal)
- **Domain**: $10-$15/year (if purchased)
- **Total**: **$0-$35/month**

### Optional Costs

- **Private RPC**: $50-$200/month
- **IPFS Pinning**: $5-$50/month
- **Analytics**: Free-$100/month
- **Error Tracking**: Free-$25/month

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Production Ready

For additional help, see the documentation in the `docs/` folder.
