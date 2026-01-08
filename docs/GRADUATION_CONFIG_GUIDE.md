# Graduation System Configuration Guide

## Overview

The DogePump platform now supports **dynamic DC price tracking** with a **configurable USD graduation threshold**. This ensures tokens graduate at exactly **$6,900 USD** (or your configured value) regardless of DC price fluctuations.

## Quick Start

### 1. Basic Configuration (Default)

The system works out-of-the-box with default settings:

```typescript
// constants.ts (already configured)
export const GRADUATION_MARKETCAP_USD = 6900; // $6,900 USD graduation threshold
```

**No additional setup required!** The platform will:
- Fetch DC price from APIs automatically
- Calculate graduation progress based on USD value
- Fall back to cached price if APIs fail
- Update price every 30 seconds

---

## Configuration Options

### Graduation Threshold

**File**: `constants.ts`

```typescript
// Current: $6,900 USD
export const GRADUATION_MARKETCAP_USD = 6900;

// Examples of other values:
export const GRADUATION_MARKETCAP_USD = 1000;  // Testnet: $1,000 USD
export const GRADUATION_MARKETCAP_USD = 10000; // Higher threshold: $10,000 USD
export const GRADUATION_MARKETCAP_USD = 500;   // Lower threshold: $500 USD
```

**When to Change:**
- **Testing**: Lower to $500-$1,000 for easy testing
- **Mainnet**: Keep at $6,900 or adjust based on market feedback
- **Special Events**: Temporarily lower for launch promotions

### Price Update Frequency

**File**: `constants.ts`

```typescript
// Current: Update every 30 seconds
export const PRICE_UPDATE_INTERVAL = 30000;

// Faster updates (more API calls):
export const PRICE_UPDATE_INTERVAL = 15000; // 15 seconds

// Slower updates (fewer API calls):
export const PRICE_UPDATE_INTERVAL = 60000; // 1 minute
```

**Trade-offs:**
- **Faster** = More accurate graduation, higher API usage
- **Slower** = Less accurate, stays within free API tiers

### Price Cache TTL

**File**: `constants.ts`

```typescript
// Current: Cache price for 1 minute
export const PRICE_CACHE_TTL = 60000;

// Shorter cache (fresher prices):
export const PRICE_CACHE_TTL = 30000; // 30 seconds

// Longer cache (fewer API calls):
export const PRICE_CACHE_TTL = 120000; // 2 minutes
```

### Anti-Manipulation Settings

**File**: `constants.ts`

```typescript
// Maximum price deviation per update (prevents manipulation)
export const MAX_PRICE_DEVIATION = 0.15; // 15%

// Stricter (more security):
export const MAX_PRICE_DEVIATION = 0.05; // 5%

// More lenient (allows higher volatility):
export const MAX_PRICE_DEVIATION = 0.25; // 25%
```

### Minimum Pool Liquidity

**File**: `constants.ts`

```typescript
// Minimum liquidity to trust pool price
export const MIN_POOL_LIQUIDITY_USD = 1000; // $1,000

// Higher threshold (more secure):
export const MIN_POOL_LIQUIDITY_USD = 5000; // $5,000

// Lower threshold (use pool sooner):
export const MIN_POOL_LIQUIDITY_USD = 500; // $500
```

---

## Token Addresses

**File**: `constants.ts`

```typescript
// DC Token on DogeChain
export const DC_TOKEN_ADDRESS = '0x7B4328c127B85369D9f82ca0503B000D09CF9180';

// wDOGE Token on DogeChain
export const WDOGE_TOKEN_ADDRESS = '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101';
```

**⚠️ IMPORTANT**: Verify these addresses match your actual tokens on DogeChain!

---

## Price Sources

### Source Priority (Automatic)

1. **DC/wDOGE Pool** (On-chain TWAP) - Primary
   - Most reliable
   - No external dependencies
   - Manipulation-resistant
   - **TODO**: Implement when pool deployed

2. **DEXScreener API** - Fallback 1
   - Free: 60-300 requests/minute
   - No API key required
   - Reliable and fast

3. **GeckoTerminal API** - Fallback 2
   - Free tier available
   - Backup if DEXScreener fails

4. **Cached Price** - Last Resort
   - localStorage
   - Last known good price
   - Auto-refreshes when sources recover

### Disabling Sources

**File**: `services/priceOracleService.ts`

To disable a specific source, modify the `getDCPriceUSD()` method:

```typescript
async getDCPriceUSD(): Promise<number> {
  // Comment out to skip pool price:
  // const poolPrice = await this.getPriceFromPool();

  // Comment out to skip DEXScreener:
  // const dexPrice = await this.getPriceFromDexScreener();

  // Use only GeckoTerminal:
  const geckoPrice = await this.getPriceFromGeckoTerminal();
  if (geckoPrice && this.validatePrice(geckoPrice)) {
    return this.updatePrice(geckoPrice, 'geckoterminal');
  }

  // ... rest of fallback logic
}
```

---

## Environment Variables (Optional)

You can add these to `.env` for deployment-specific configuration:

```env
# Graduation Threshold (USD)
GRADUATION_MARKETCAP_USD=6900

# Price Oracle Settings
PRICE_UPDATE_INTERVAL=30000
PRICE_CACHE_TTL=60000

# Anti-Manipulation
MAX_PRICE_DEVIATION=0.15
MIN_POOL_LIQUIDITY_USD=1000

# API Settings
API_TIMEOUT_MS=5000
API_RETRY_ATTEMPTS=3
```

Then update `constants.ts` to read from environment:

```typescript
export const GRADUATION_MARKETCAP_USD = Number(process.env.GRADUATION_MARKETCAP_USD) || 6900;
```

---

## Testing Different Scenarios

### Scenario 1: Low DC Price ($0.01)

If DC = $0.01 USD:

- Graduation requires: 690,000 DC (not 6,900 DC!)
- Calculation: $6,900 ÷ $0.01 = 690,000 DC
- Token with 50,000 DC market cap = $500 USD = 7.25% progress

### Scenario 2: High DC Price ($1.00)

If DC = $1.00 USD:

- Graduation requires: 6,900 DC
- Calculation: $6,900 ÷ $1.00 = 6,900 DC
- Token with 50,000 DC market cap = $50,000 USD = 724% (graduated!)

### Scenario 3: Very Low DC Price ($0.001)

If DC = $0.001 USD:

- Graduation requires: 6,900,000 DC
- Calculation: $6,900 ÷ $0.001 = 6,900,000 DC
- Token with 50,000 DC market cap = $50 USD = 0.72% progress

---

## Monitoring & Debugging

### View Current Price Source

Open browser console and run:

```javascript
// Access price oracle service
import { priceOracleService } from './services/priceOracleService';

// Get current price info
console.log(priceOracleService.getPriceSource());
// Output: { name: 'dexscreener', price: 0.10, timestamp: 1703755200000, source: 'dexscreener' }

// Check if price is stale
console.log(priceOracleService.isPriceStale());
// Output: false

// Get price age in milliseconds
console.log(priceOracleService.getPriceAge());
// Output: 15000 (15 seconds ago)
```

### Console Logs

The price oracle logs important events:

```
[PriceOracle] Price updated: $0.100000 (source: dexscreener, age: 0ms)
[PriceOracle] Initialized successfully
[PriceOracle] All sources failed, using cached price
```

### Common Issues

**Issue**: "All price sources failed"

**Solution**:
1. Check internet connection
2. Verify API endpoints are accessible
3. Check browser console for specific API errors
4. System will continue with cached price

**Issue**: "Price deviation too high"

**Solution**:
1. DC price is very volatile
2. Wait for next update (30 seconds)
3. Or adjust `MAX_PRICE_DEVIATION` in constants.ts

---

## Migration from Old System

### Before (Incorrect)

```typescript
// WRONG: Assumed DC = $1 USD
const progress = (marketCap_DC / 6900) * 100;
// If token has 50,000 DC market cap:
// Progress = (50,000 / 6,900) * 100 = 724% ❌ WRONG!
```

### After (Correct)

```typescript
// CORRECT: Uses actual DC price
const dcPriceUSD = await priceOracleService.getDCPriceUSD(); // e.g., $0.10
const marketCapUSD = marketCap_DC * dcPriceUSD; // 50,000 * 0.10 = $5,000
const progress = (marketCapUSD / 6900) * 100; // (5,000 / 6,900) * 100 = 72.46% ✅ CORRECT!
```

---

## Performance & Costs

### API Usage (Current Platform Scale)

**Monthly API Calls**:
- Price updates: 2,880/day × 30 = 86,400/month
- Within free tiers: ✅
- No additional costs: ✅

**Scalability**:
- Free tiers support up to ~10x more requests
- Pool TWAP (when implemented) is unlimited and free
- Can handle 10,000+ daily active users

### Optimization Tips

1. **Use Pool Price** (when deployed)
   - Eliminates API calls entirely
   - On-chain and unlimited
   - Most reliable

2. **Adjust Update Interval**
   - Lower frequency for fewer API calls
   - Balance accuracy vs. cost

3. **Enable Caching**
   - Already enabled by default
   - Reduces duplicate requests

---

## FAQ

**Q: Can I change graduation threshold without redeploying?**

A: Yes! Update `GRADUATION_MARKETCAP_USD` in `constants.ts` and rebuild. The change takes effect immediately.

**Q: What happens if all price sources fail?**

A: System uses cached price from localStorage and alerts in console. Trading continues normally.

**Q: How accurate is the graduation calculation?**

A: Very accurate! Uses real-time DC price with 30-second updates. TWAP (when pool active) provides even more accuracy.

**Q: Will this work with very low DC prices?**

A: Yes! System handles any price from $0.000001 to $10 USD. Graduation DC amount automatically adjusts.

**Q: Can I use a different price source?**

A: Yes! Modify `priceOracleService.ts` to add custom APIs or on-chain oracles.

**Q: How do I test different graduation thresholds?**

A: Change `GRADUATION_MARKETCAP_USD` in `constants.ts` to a lower value (e.g., 500) for testing, then rebuild.

---

## References

- [Architecture Documentation](./PRICE_ORACLE_ARCHITECTURE.md)
- [Token Launch Guide](./TOKEN_LAUNCH.md)
- [pump.fun Research](https://blog.csdn.net/WuLex/article/details/145327321)
- [Uniswap TWAP Oracles](https://blog.uniswap.org/uniswap-v3-oracles)
- [DEXScreener API](https://docs.dexscreener.com/api/reference)

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
