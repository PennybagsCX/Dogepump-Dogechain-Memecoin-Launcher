# DC Price Oracle & Graduation System Architecture

## Problem Statement

The current bonding curve implementation incorrectly calculates graduation progress by assuming `6,900 DC = $6,900 USD`, which is only true if DC = $1 USD. Since DC price fluctuates based on market dynamics, the platform needs a reliable way to track DC's USD price to calculate when a token reaches `$6,900 USD` market cap for graduation.

## Research Summary

Based on research of similar platforms ([pump.fun](https://pump.fun), [Meteora](https://docs.meteora.ag/developer-guide/guides/dbc/bonding-curve-configs)):

- **pump.fun**: Graduates at ~$69,420 SOL (not fixed SOL amount)
- **TWAP Oracles**: Industry standard for on-chain price discovery ([Uniswap V3 TWAP](https://docs.uniswap.org/sdk/v3/guides/advanced/price-oracle))
- **DEX APIs**: [DEXScreener](https://docs.dexscreener.com/), [GeckoTerminal](https://api.geckoterminal.com/docs/), [DexPaprika](https://docs.dexpaprika.com/) provide free price feeds

## Solution Architecture

### Multi-Source Price Oracle with Fallbacks

```
┌─────────────────────────────────────────────────────────────┐
│                   Price Oracle Service                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Priority 1: On-Chain TWAP (DC/wDOGE Pool)                   │
│  ├─ Calculate from platform's own liquidity pool             │
│  ├─ Time-weighted average price (resistant to manipulation)  │
│  └─ Most reliable, no external dependencies                  │
│                                                               │
│  Priority 2: DEX API (DEXScreener / GeckoTerminal)            │
│  ├─ Free API (60-300 req/min)                                │
│  ├─ Direct blockchain data                                   │
│  └─ Fallback if pool not initialized                         │
│                                                               │
│  Priority 3: Cached Price (localStorage)                      │
│  ├─ Last known good price                                    │
│  ├─ Auto-refresh every 30s                                   │
│  └─ Ultimate fallback                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **TWAP from DC/wDOGE Pool** (Primary)
   - Platform will hold DC/wDOGE liquidity pool
   - Calculate spot price: `price = DC_reserves / wDOGE_reserves`
   - Implement basic TWAP: average over last N blocks
   - **Pros**: On-chain, no external APIs, manipulation-resistant
   - **Cons**: Requires pool to exist (which it will)

2. **DEXScreener API** (Fallback)
   - Free tier: 60-300 requests/minute
   - Endpoint: `https://api.dexscreener.com/latest/dex/tokens/{DC_TOKEN_ADDRESS}`
   - **Pros**: Free, reliable, no API key needed
   - **Cons**: Rate limits, external dependency

3. **GeckoTerminal API** (Fallback)
   - Free tier available (rate limited)
   - Endpoint: `https://api.geckoterminal.com/api/v2/networks/dogechain/tokens/{DC_ADDRESS}/pools`
   - **Pros**: Backup if DEXScreener down
   - **Cons**: Lower rate limits

## Implementation Components

### 1. Price Oracle Service

**File**: `services/priceOracleService.ts`

```typescript
class PriceOracleService {
  // Primary: Calculate from DC/wDOGE pool
  async getPriceFromPool(): Promise<number>

  // Fallback 1: DEXScreener API
  async getPriceFromDexScreener(): Promise<number>

  // Fallback 2: GeckoTerminal API
  async getPriceFromGeckoTerminal(): Promise<number>

  // Fallback 3: Cached price
  getCachedPrice(): number

  // Main method with fallback chain
  async getDCPriceUSD(): Promise<number>
}
```

### 2. TWAP Calculation (On-Chain Pool)

**Formula**:
```
Spot Price = DC_Reserves / wDOGE_Reserves
TWAP Price = Average(Spot_Price over last N seconds)
```

**Implementation**:
- Store price observations every 10 seconds
- Calculate average of last 30 observations (5 minutes)
- Update on every swap/pool interaction

### 3. Configurable Graduation System

**File**: `constants.ts`

```typescript
// Configurable graduation threshold (USD)
export const GRADUATION_MARKETCAP_USD = 6900;

// Can be easily changed:
// - Testnet: 1000 USD
// - Mainnet: 6900 USD
// - Future: adjust based on market conditions
```

### 4. Updated Bonding Curve Calculation

**File**: `contexts/StoreContext.tsx`

```typescript
// WRONG (current):
progress = (marketCap_DC / 6900) * 100

// CORRECT:
dcPriceUSD = await priceOracle.getDCPriceUSD()
marketCapUSD = marketCap_DC * dcPriceUSD
progress = (marketCapUSD / GRADUATION_MARKETCAP_USD) * 100
```

## Data Flow

```
Token Launch → User Buys Tokens
                ↓
        Calculate Trade Impact
                ↓
    ┌──────────────────────────┐
    │  Get Current DC Price    │
    └──────────────────────────┘
                ↓
    Try Priority 1: Pool TWAP
                ↓ (if fail)
    Try Priority 2: DEXScreener API
                ↓ (if fail)
    Try Priority 3: GeckoTerminal API
                ↓ (if fail)
    Use Priority 4: Cached Price
                ↓
    Calculate marketCapUSD
                ↓
    Update Progress %
                ↓
    Check if marketCapUSD >= $6,900
                ↓
         Graduate if True
```

## Security Considerations

1. **TWAP Manipulation Resistance**
   - Use minimum 5-minute TWAP window
   - Ignore prices with low liquidity (< $1,000)
   - Price deviation checks (max 10% change per update)

2. **API Reliability**
   - Implement exponential backoff for failed requests
   - Cache responses for 30 seconds
   - Monitor API health with heartbeat

3. **Price Validation**
   - Sanity checks: price must be within reasonable range ($0.000001 - $1)
   - Compare multiple sources for consistency
   - Alert on significant price deviations

## Configuration

### Environment Variables

```env
# Price Oracle Configuration
PRICE_ORACLE_ENABLED=true
PRICE_ORACLE_POOL_ADDRESS=0x...
TWAP_WINDOW_SECONDS=300
TWAP_MIN_OBSERVATIONS=30

# API Fallbacks
DEXSCREENER_API_ENABLED=true
GECKOTERMINAL_API_ENABLED=true
API_TIMEOUT_MS=5000
API_RETRY_ATTEMPTS=3

# Graduation Configuration
GRADUATION_MARKETCAP_USD=6900
GRADUATION_POLL_INTERVAL_MS=10000
```

### Runtime Configuration

```typescript
// Can be updated without redeployment
const priceOracleConfig = {
  updateInterval: 30000,      // 30 seconds
  cacheTTL: 60000,             // 1 minute
  fallbackEnabled: true,
  twapWindow: 300,            // 5 minutes
  minPoolLiquidity: 1000,     // $1,000 minimum
  maxPriceDeviation: 0.10     // 10% max change
};
```

## Monitoring & Alerts

1. **Health Checks**
   - API uptime monitoring
   - Price freshness checks (updated within 60s)
   - Fallback trigger counts

2. **Metrics to Track**
   - Price source distribution (pool vs API vs cache)
   - API failure rates
   - Price update latency
   - TWAP calculation accuracy

3. **Alert Conditions**
   - All price sources failed
   - Price deviation > 20% between sources
   - API rate limit hit
   - Stale price data (> 5 minutes old)

## Cost Analysis

### Free Tier Usage (Current Platform Scale)

| Service | Cost | Requests/Month | Notes |
|---------|------|----------------|-------|
| DC/wDOGE Pool TWAP | FREE | On-chain | Primary source |
| DEXScreener API | FREE | ~10,000 | 60 req/min × 24/7 |
| GeckoTerminal API | FREE | ~5,000 | Fallback only |
| **Total** | **FREE** | **~15,000** | Sustainable |

### Scaling Considerations

If platform grows beyond free tier limits:
- DEXScreener: Paid tier available (~$100/mo for higher limits)
- Pool TWAP: Still primary (unlimited, on-chain)
- GeckoTerminal: Can be removed if not needed

## Implementation Priority

### Phase 1: Core Functionality (✅ Now)
1. ✅ Create price oracle service
2. ✅ Implement DC/wDOGE pool price calculation
3. ✅ Add DEXScreener API fallback
4. ✅ Update bonding curve calculations
5. ✅ Make graduation configurable

### Phase 2: Enhanced Features (Future)
1. ⏳ Add TWAP calculation (multi-block averaging)
2. ⏳ Implement price cache with TTL
3. ⏳ Add monitoring and alerting
4. ⏳ Create admin dashboard for price source health

### Phase 3: Advanced Optimizations (Optional)
1. ⏳ WebSocket connections for real-time prices
2. ⏳ Multiple pool aggregation
3. ⏳ On-chain oracle smart contract
4. ⏳ Historical price tracking

## Testing Strategy

1. **Unit Tests**
   - Price calculation from pool reserves
   - TWAP averaging logic
   - Fallback chain execution
   - Price validation and sanity checks

2. **Integration Tests**
   - DEXScreener API connectivity
   - GeckoTerminal API connectivity
   - End-to-end price fetch with fallbacks

3. **Manual Testing**
   - Test with different DC prices ($0.01, $0.10, $1.00)
   - Verify graduation triggers correctly
   - Test API failure scenarios
   - Validate price cache expiration

## Example Scenarios

### Scenario 1: Normal Operation (Pool Active)
```
1. Pool has DC/wDOGE liquidity
2. Calculate TWAP from pool: 1 DC = $0.10 USD
3. Token has 50,000 DC market cap
4. marketCapUSD = 50,000 × $0.10 = $5,000 USD
5. Progress = ($5,000 / $6,900) × 100 = 72.46%
```

### Scenario 2: Pool Not Initialized (Use API)
```
1. Pool doesn't exist yet (new deployment)
2. Fetch from DEXScreener: 1 DC = $0.10 USD
3. Use API price for calculations
4. Continue normally
```

### Scenario 3: All APIs Down (Use Cache)
```
1. Pool not initialized
2. DEXScreener timeout
3. GeckoTerminal timeout
4. Use cached price from localStorage ($0.10 USD)
5. Alert admin that all sources failed
6. Continue with degraded mode
```

## References

- [pump.fun Bonding Curve](https://blog.csdn.net/WuLex/article/details/145327321)
- [Uniswap V3 TWAP Oracles](https://blog.uniswap.org/uniswap-v3-oracles)
- [DEXScreener API Docs](https://docs.dexscreener.com/api/reference)
- [GeckoTerminal API](https://api.geckoterminal.com/docs/index.html)
- [TWAP Oracle Explained](https://medium.com/nefture/twap-oracles-the-solution-to-oracle-exploits-272decc77a9f)
- [Meteora Bonding Curves](https://docs.meteora.ag/developer-guide/guides/dbc/bonding-curve-configs)

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Ready for Implementation
