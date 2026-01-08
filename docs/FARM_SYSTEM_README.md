# Token Owner Farm System

## Overview

The Token Owner Farm System is a comprehensive staking and reward distribution platform built for the Dogepump ecosystem. It allows token owners to create reward pools where users can stake tokens to earn rewards based on configurable reward rates.

## Features

- **Farm Creation**: Token owners can create custom farms with configurable parameters
- **Staking Operations**: Users can stake tokens to earn rewards
- **Reward Distribution**: Time-based reward calculation with automatic distribution
- **Farm Management**: Pause, resume, and close farms with proper validation
- **Statistics Tracking**: Real-time farm analytics including TVL, APY, and participant counts
- **Audit Logging**: Complete audit trail of all farm operations
- **Security**: Token ownership verification, rate limits, and configuration validation
- **LocalStorage Persistence**: Automatic data persistence across sessions

## Architecture

### Service Layer (`services/farmService.ts`)

The farm service provides the core business logic for all farm operations:

- **Farm CRUD Operations**
  - `createFarm()` - Create new farms with validation
  - `getFarmById()` - Retrieve farm by ID
  - `getAllFarms()` - Get all farms
  - `getMyFarms()` - Get farms owned by current user
  - `getActiveFarms()` - Get active farms
  - `updateFarmConfig()` - Update farm configuration
  - `pauseFarm()` - Pause reward distribution
  - `resumeFarm()` - Resume reward distribution
  - `closeFarm()` - Permanently close farm and refund rewards
  - `depositRewards()` - Add rewards to farm pool

- **Staking Operations**
  - `stakeInFarm()` - Stake tokens in a farm
  - `unstakeFromFarm()` - Unstake tokens and claim rewards
  - `harvestFarmRewards()` - Harvest accumulated rewards without unstaking

- **Query Operations**
  - `getUserFarmPositions()` - Get user's staking positions
  - `getFarmStats()` - Get farm statistics

- **Calculation Functions**
  - `calculateAPY()` - Calculate Annual Percentage Yield
  - `calculateCurrentAPY()` - Calculate effective APY based on TVL

- **Audit Operations**
  - `getFarmAuditLogs()` - Retrieve audit trail for a farm

### State Management (`contexts/StoreContext.tsx`)

The StoreContext integrates farm service with React state management:

- **Farm State**
  - `tokenOwnerFarms` - Array of all farms
  - `tokenOwnerFarmPositions` - Array of user's staking positions

- **Farm Actions**
  - `createFarm()` - Create a new farm
  - `depositRewards()` - Add rewards to farm
  - `updateFarmConfig()` - Update farm settings
  - `pauseFarm()` - Pause a farm
  - `resumeFarm()` - Resume a farm
  - `closeFarm()` - Close a farm
  - `stakeInFarm()` - Stake tokens
  - `unstakeFromFarm()` - Unstake tokens
  - `harvestFarmRewards()` - Harvest rewards
  - `getFarm()` - Get farm by ID
  - `getMyFarms()` - Get user's farms
  - `getFarmPositions()` - Get staking positions
  - `getFarmStats()` - Get farm statistics

### UI Components

- **`CreateFarmModal`** - Modal for creating new farms
- **`FarmCard`** - Display farm information and actions
- **`FarmBadge`** - Badge showing farm count and APY
- **`FarmDiscovery`** - Browse and discover farms
- **`FarmStakingModal`** - Modal for staking/unstaking/harvesting
- **`FarmManagementTab`** - Farm owner management interface
- **`FarmAnalytics`** - Farm statistics and analytics dashboard

## Error Handling

The farm system uses custom error types for better error handling:

### Error Classes

- **`FarmError`** - Base class for all farm-related errors
  - Properties: `message`, `code`, `details`
  
- **`FarmValidationError`** - Thrown when farm configuration is invalid
  - Code: `FARM_VALIDATION_ERROR`
  - Used for: Invalid reward rates, durations, stake limits
  
- **`FarmAccessError`** - Thrown when user lacks permission
  - Code: `FARM_ACCESS_ERROR`
  - Used for: Non-owners trying to manage farms
  
- **`FarmStateError`** - Thrown when farm state prevents operation
  - Code: `FARM_STATE_ERROR`
  - Used for: Inactive farms, paused farms, expired farms, locked positions
  
- **`FarmStorageError`** - Thrown when localStorage operations fail
  - Code: `FARM_STORAGE_ERROR`
  - Used for: Quota exceeded, data corruption

### Error Recovery

The system implements automatic error recovery strategies:

1. **localStorage Quota Exceeded**
   - Automatically clears audit logs to free space
   - Retries save operation after clearing
   - Logs error details for debugging

2. **Corrupted Data**
   - Falls back to default values if JSON parsing fails
   - Logs error details without crashing

3. **Missing Data**
   - Returns `undefined` for missing farms/positions
   - Allows graceful degradation

## Constants and Limits

### Reward Limits

```typescript
MAX_REWARD_RATE: 0.001      // tokens per second per staked unit
MAX_APY: 50000              // 50,000% maximum APY
MAX_TOTAL_REWARDS: 1000000000  // 1M tokens max per farm
```

### Duration Limits

```typescript
MIN_FARM_DURATION: 86400      // 24 hours (minimum)
MAX_FARM_DURATION: 31536000    // 1 year (maximum)
```

### Stake Limits

```typescript
MIN_STAKE_AMOUNT: 1           // Minimum tokens to stake
MAX_STAKE_PER_USER: 10000000  // Maximum tokens per user
```

### Calculation Intervals

```typescript
REWARD_CALCULATION_INTERVAL: 10000  // 10 seconds (reward updates)
STATS_UPDATE_INTERVAL: 60000      // 1 minute (statistics)
```

### Cache Durations

```typescript
FARM_CACHE_TTL: 300      // 5 minutes (farm data)
POSITION_CACHE_TTL: 60     // 1 minute (position data)
```

### Security Limits

```typescript
MAX_CONFIG_CHANGES_PER_HOUR: 5     // Configuration changes per hour
PAUSE_RESUME_CYCLE_THRESHOLD: 3   // Max pause/resume cycles
AUDIT_LOG_RETENTION_DAYS: 90       // 90 days log retention
```

## Data Models

### Farm Configuration

```typescript
interface FarmConfiguration {
  rewardRate: number;        // Tokens per second per staked unit
  duration: number;          // Farm duration in seconds (0 = infinite)
  lockPeriod: number;         // Lock period in seconds (0 = no lock)
  maxStakeAmount: number;     // Maximum stake per user (0 = unlimited)
  minStakeAmount: number;     // Minimum stake amount
  isPaused: boolean;          // Whether farm is paused
  createdAt: number;           // Creation timestamp
  updatedAt: number;           // Last update timestamp
  expiresAt?: number;         // Expiration timestamp (optional)
}
```

### Farm Status

```typescript
type FarmStatus = 'active' | 'paused' | 'closed';
```

### Reward Pool

```typescript
interface RewardPool {
  id: string;                  // Unique pool identifier
  farmId: string;             // Associated farm ID
  rewardTokenId: string;       // Token used for rewards
  totalDeposited: number;       // Total rewards deposited
  availableRewards: number;     // Rewards available for distribution
  totalDistributed: number;      // Rewards already distributed
  lastCalculatedAt: number;     // Last reward calculation timestamp
}
```

### Farm Statistics

```typescript
interface FarmStats {
  totalStaked: number;          // Total tokens staked
  uniqueStakers: number;        // Number of unique stakers
  currentAPY: number;           // Current Annual Percentage Yield
  totalRewardsDistributed: number; // Total rewards distributed
  avgStakeDuration: number;      // Average stake duration in seconds
  lastUpdated: number;           // Last statistics update timestamp
}
```

### Staking Position

```typescript
interface TokenOwnerFarmPosition {
  id: string;                  // Unique position identifier
  farmId: string;             // Associated farm ID
  userAddress: string;          // User wallet address
  stakedAmount: number;         // Amount of tokens staked
  stakedAt: number;             // Staking timestamp
  lastHarvestTime: number;      // Last harvest timestamp
  accumulatedRewards: number;    // Unharvested rewards
  isLocked: boolean;            // Whether position is locked
  lockExpiresAt?: number;       // Lock expiration timestamp
}
```

## Reward Calculation

### APY Calculation

The Annual Percentage Yield (APY) is calculated as:

```
APY = (rewardRate * 86400 * 365) * 100
```

Where:
- `rewardRate` = tokens per second per staked unit
- `86400` = seconds per day
- `365` = days per year
- `100` = converts to percentage

The APY is capped at `MAX_APY` (50,000%).

### Current APY with TVL

When considering the Total Value Locked (TVL), the effective APY is:

```
Current APY = min(
  ((rewardRate * totalStaked * 86400 * 365) / totalStaked) * 100,
  MAX_APY
)
```

### Accumulated Rewards

Rewards accumulate based on time elapsed since last harvest:

```
Accumulated Rewards = Previous Accumulated + 
  (Time Since Last Harvest / 1000) * Reward Rate * Staked Amount
```

## Security Measures

### Token Ownership Verification

All farm management operations require token ownership verification:
- Only the token creator can create farms
- Only the token creator can update farm configuration
- Only the token creator can pause/resume/close farms
- Only the token creator can deposit rewards

### Configuration Validation

Farm configurations are validated against:
- Reward rate limits (must be positive and ≤ MAX_REWARD_RATE)
- APY limits (must be ≤ MAX_APY)
- Duration limits (must be between MIN_FARM_DURATION and MAX_FARM_DURATION)
- Lock period must not exceed farm duration
- Maximum stake must be ≥ minimum stake

### State-Based Restrictions

- Cannot stake in inactive farms
- Cannot stake in paused farms
- Cannot stake in expired farms
- Cannot unstake from locked positions (before lock expires)
- Cannot close farms with active stakers
- Cannot harvest when no rewards are available

### Audit Logging

All farm operations are logged with:
- Timestamp
- Actor address
- Action type (created, updated, paused, resumed, closed, staked, unstaked, harvested)
- Action data (amounts, configuration changes)
- Farm ID

Audit logs are retained for `AUDIT_LOG_RETENTION_DAYS` (90 days).

## Storage Architecture

### localStorage Keys

```typescript
'dogepump_farms'                    // All farms
'dogepump_farm_positions'          // User staking positions
'dogepump_farm_audit_logs'           // Audit trail
'dogepump_farm_stats'               // Farm statistics
```

### Persistence Strategy

- **Farms**: Persisted on every create/update/delete operation
- **Positions**: Persisted on every stake/unstake/harvest operation
- **Audit Logs**: Persisted on every audit log creation
- **Statistics**: Updated in-memory, persisted on periodic intervals

### Error Recovery

The system implements graceful degradation when localStorage fails:
1. Quota exceeded → Clear audit logs → Retry save
2. Corrupted data → Use defaults → Log error
3. Parse errors → Skip loading → Log error

## Background Processes

### Reward Calculation Interval

Runs every 10 seconds (`REWARD_CALCULATION_INTERVAL`):
- Updates all positions with new rewards
- Distributes rewards from farm pools
- Pauses farms when reward pool is exhausted

### Statistics Update Interval

Runs every 1 minute (`STATS_UPDATE_INTERVAL`):
- Recalculates farm statistics
- Updates total staked amount
- Updates unique staker count
- Recalculates current APY

## Usage Examples

### Creating a Farm

```typescript
import { farmService } from './services/farmService';

const farm = farmService.createFarm({
  ownerTokenId: 'token-123',
  stakingTokenId: 'token-123',
  rewardTokenId: 'token-123',
  rewardDepositAmount: 100000,
  config: {
    rewardRate: 0.0001,           // ~315% APY
    duration: 2592000000,         // 30 days
    lockPeriod: 86400000,          // 1 day lock
    maxStakeAmount: 1000000,       // 1M max stake
    minStakeAmount: 1,            // 1 token minimum
    isPaused: false
  },
  description: 'My awesome farm'
});

console.log(`Created farm: ${farm.id}`);
console.log(`Pool APY: ${farm.stats.currentAPY}%`);
```

### Staking Tokens

```typescript
import { useStore } from './contexts/StoreContext';

const { stakeInFarm } = useStore();

// Stake 1000 tokens
const position = await stakeInFarm('farm-123', 1000);

console.log(`Staked: ${position.stakedAmount} tokens`);
console.log(`Position ID: ${position.id}`);
```

### Harvesting Rewards

```typescript
import { useStore } from './contexts/StoreContext';

const { harvestFarmRewards } = useStore();

// Harvest rewards
const rewards = await harvestFarmRewards('farm-123');

console.log(`Harvested: ${rewards} tokens`);
```

### Managing a Farm

```typescript
import { useStore } from './contexts/StoreContext';

const { pauseFarm, resumeFarm, closeFarm } = useStore();

// Pause the farm
await pauseFarm('farm-123');

// Resume the farm
await resumeFarm('farm-123');

// Close the farm (must have no active stakers)
const { farm, refundedAmount } = await closeFarm('farm-123');

console.log(`Refunded: ${refundedAmount} tokens`);
```

### Getting Farm Statistics

```typescript
import { useStore } from './contexts/StoreContext';

const { getFarmStats } = useStore();

const stats = getFarmStats('farm-123');

console.log(`Total Staked: ${stats.totalStaked}`);
console.log(`Unique Stakers: ${stats.uniqueStakers}`);
console.log(`Current APY: ${stats.currentAPY}%`);
```

### Handling Errors

```typescript
import { 
  FarmError, 
  FarmValidationError, 
  FarmAccessError, 
  FarmStateError 
} from './services/farmService';

try {
  const farm = farmService.createFarm(request);
} catch (error) {
  if (error instanceof FarmValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Details:', error.details);
  } else if (error instanceof FarmAccessError) {
    console.error('Access denied:', error.message);
  } else if (error instanceof FarmStateError) {
    console.error('State error:', error.message);
  } else if (error instanceof FarmStorageError) {
    console.error('Storage error:', error.message);
  }
}
```

## Testing

The farm system includes comprehensive test coverage:

### Test Suites

- **Component Rendering Tests**
  - Modal rendering and form validation
  - Card display and status indicators
  - Badge showing farm counts and APY
  - Discovery page with filtering and sorting
  - Staking modal with tabs
  - Analytics dashboard with charts

- **State Management Tests**
  - StoreContext integration
  - localStorage persistence
  - State updates and synchronization

- **Business Logic Tests**
  - Farm creation with validation
  - Configuration updates
  - Staking and unstaking operations
  - Reward harvesting
  - Reward calculations
  - Query operations

- **Integration Workflow Tests**
  - Complete farm creation flow
  - User staking workflow
  - Farm management workflow
  - Pause/resume cycles

- **Edge Cases and Error Handling**
  - Concurrent operations
  - localStorage quota limits
  - Reward pool exhaustion
  - Farm expiration
  - Lock period enforcement

- **Security Measures Tests**
  - Token ownership verification
  - Rate limit enforcement
  - Configuration validation
  - Audit logging

- **Performance Assessment**
  - Large farm handling (100+ farms)
  - Large position handling (1000+ positions)
  - Rapid reward calculations (10,000+ operations)
  - localStorage operation efficiency

### Running Tests

```bash
# Run all farm system tests
npm test -- tests/farm-system.test.ts

# Run with coverage report
npm test -- --coverage tests/farm-system.test.ts
```

## Best Practices

### For Token Owners

1. **Set Appropriate Reward Rates**
   - Consider your token's value and market conditions
   - Higher rates attract more stakers but deplete rewards faster
   - Use `calculateAPY()` to preview APY before creating

2. **Choose Reasonable Durations**
   - Short durations (1-7 days) for promotional farms
   - Medium durations (30-90 days) for standard farms
   - Long durations (180-365 days) for long-term incentives

3. **Implement Lock Periods**
   - No lock for maximum flexibility
   - Short locks (1-7 days) for commitment
   - Long locks (30-90 days) for stability

4. **Monitor Your Farms**
   - Check statistics regularly using `getFarmStats()`
   - Review audit logs with `getFarmAuditLogs()`
   - Pause if needed using `pauseFarm()`
   - Add more rewards using `depositRewards()`

5. **Close Farms Properly**
   - Ensure no active stakers before closing
   - All remaining rewards are refunded automatically
   - Farm status changes to 'closed'

### For Stakers

1. **Research Before Staking**
   - Check farm APY using `getFarmStats()`
   - Review reward token and staking token
   - Understand lock period and duration

2. **Start Small**
   - Stake minimum amount to test the farm
   - Monitor rewards accumulation
   - Harvest regularly to claim rewards

3. **Consider Lock Periods**
   - Locked positions cannot be unstaked early
   - Factor lock duration into your strategy
   - Use `getUserFarmPositions()` to check lock status

4. **Diversify Across Farms**
   - Don't stake all tokens in one farm
   - Spread risk across multiple farms
   - Monitor total rewards across all positions

5. **Harvest Regularly**
   - Rewards accumulate over time
   - Harvest periodically to claim and compound
   - Use `harvestFarmRewards()` to claim without unstaking

6. **Watch for Farm Expiration**
   - Expired farms stop reward distribution
   - Check `farm.config.expiresAt` before staking
   - Unstake before expiration if needed

### For Developers

1. **Initialize Service Properly**
   ```typescript
   import { initializeFarmService } from './services/farmService';
   
   // Call once at application startup
   initializeFarmService();
   ```

2. **Handle Errors Gracefully**
   ```typescript
   try {
     const farm = farmService.createFarm(request);
   } catch (error) {
     if (error instanceof FarmValidationError) {
       // Show validation errors to user
       showValidationError(error);
     } else if (error instanceof FarmStorageError) {
       // Show storage error and suggest clearing data
       showStorageError(error);
     } else {
       // Log unexpected errors
       logError(error);
     }
   }
   ```

3. **Use Type-Safe Operations**
   ```typescript
   // All functions are fully typed
   // Error classes provide detailed error information
   // TypeScript catches type errors at compile time
   ```

4. **Test with Real Data**
   ```typescript
   // Test with various farm configurations
   // Test edge cases (minimum/maximum amounts)
   // Test error scenarios (insufficient balance, expired farms)
   ```

## Migration Notes

### From Mock to Production

The current implementation uses mock token balance functions for demonstration:

```typescript
// Mock functions (PRODUCTION TODO)
function getTokenById(tokenId: string): Token | undefined
function getUserTokenBalance(tokenId: string): number
function deductTokenBalance(tokenId: string, amount: number): void
function addTokenBalance(tokenId: string, amount: number): void
```

**To migrate to production:**

1. Replace mock functions with StoreContext integration:
   ```typescript
   import { useStore } from '../contexts/StoreContext';
   
   const { getTokenById, getUserBalance } = useStore();
   ```

2. Update all function implementations to use real data

3. Remove mock data and comments

4. Test with real token balances and transactions

## Troubleshooting

### Common Issues

**Issue**: Farm not found
- **Cause**: Invalid farm ID or farm was deleted
- **Solution**: Verify farm ID with `getFarmById()` or `getAllFarms()`

**Issue**: Insufficient balance
- **Cause**: User doesn't have enough tokens for operation
- **Solution**: Check token balance before staking/depositing

**Issue**: Farm is paused
- **Cause**: Owner paused reward distribution
- **Solution**: Wait for owner to resume or check farm status

**Issue**: Position is locked
- **Cause**: Lock period hasn't expired
- **Solution**: Wait for lock to expire or check remaining time

**Issue**: No rewards to harvest
- **Cause**: Just harvested or insufficient time elapsed
- **Solution**: Wait longer before harvesting again

**Issue**: localStorage quota exceeded
- **Cause**: Browser storage limit reached
- **Solution**: Clear browser data or use storage management

### Debug Mode

Enable detailed logging by checking console:
```typescript
// All operations log to console with prefix '[FarmService]'
console.log('[FarmService] Created farm:', farmId);
console.log('[FarmService] Staked:', amount, 'in farm:', farmId);
```

### Performance Optimization

The farm system is optimized for:
- **Fast lookups**: O(1) array operations
- **Efficient calculations**: Minimal iterations in reward calculations
- **Lazy persistence**: Only save when data changes
- **Background updates**: Non-blocking interval operations

## API Reference

### Farm Service API

See [`services/farmService.ts`](../services/farmService.ts) for complete API documentation.

### Store Context API

See [`contexts/StoreContext.tsx`](../contexts/StoreContext.tsx) for React integration.

### Component Props

See individual component files for prop documentation:
- [`components/CreateFarmModal.tsx`](../components/CreateFarmModal.tsx)
- [`components/FarmCard.tsx`](../components/FarmCard.tsx)
- [`components/FarmBadge.tsx`](../components/FarmBadge.tsx)
- [`components/FarmDiscovery.tsx`](../components/FarmDiscovery.tsx)
- [`components/FarmStakingModal.tsx`](../components/FarmStakingModal.tsx)
- [`components/FarmManagementTab.tsx`](../components/FarmManagementTab.tsx)
- [`components/FarmAnalytics.tsx`](../components/FarmAnalytics.tsx)

## Version History

### Version 1.0.0 (Current)
- Initial release with core farm functionality
- Custom error types for better error handling
- Comprehensive JSDoc documentation
- Enhanced error messages with context
- Improved code organization with clear sections

### Future Enhancements (Planned)
- Multi-token reward pools
- Time-weighted reward distribution
- Farm templates and presets
- Advanced analytics and reporting
- Social features (leaderboards, achievements)
- Integration with external DeFi protocols

## License

This module is part of the Dogepump platform. See main project LICENSE for details.

## Support

For issues, questions, or contributions related to the Token Owner Farm System, please refer to the main project documentation and issue tracker.
