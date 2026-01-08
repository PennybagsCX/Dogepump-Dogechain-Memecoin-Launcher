# Token Owner Farm System - Integration Guide

## Overview

This guide explains how to integrate the new Token Owner Farm System into the existing DogePump Dogechain Memecoin Launcher codebase.

## Files Created

### Core Files
| File | Purpose |
|-------|---------|
| `types.ts` (modified) | Added farm-related TypeScript interfaces |
| `services/farmService.ts` (new) | Farm business logic and localStorage persistence |
| `contexts/StoreContext.tsx` (modified) | Integrated farm state and actions |

### Token Owner UI Components
| File | Purpose |
|-------|---------|
| `components/CreateFarmModal.tsx` (new) | Modal for token owners to create farms |
| `components/FarmCard.tsx` (new) | Display farm information with stats |
| `components/FarmManagementTab.tsx` (new) | Farm management dashboard for token owners |
| `components/CreatorAdmin.tsx` (modified) | Added "Farms" tab integration |

### User UI Components
| File | Purpose |
|-------|---------|
| `components/FarmDiscovery.tsx` (new) | Farm discovery page for users |
| `components/FarmStakingModal.tsx` (new) | Staking/harvesting modal for users |
| `components/FarmBadge.tsx` (new) | Badge component for token detail pages |

### Analytics Components
| File | Purpose |
|-------|---------|
| `components/FarmAnalytics.tsx` (new) | Farm performance analytics dashboard |

## Integration Points

### 1. Earn Page Integration

The existing Earn page should be extended to include community farms:

```tsx
// In components/Earn.tsx, add:
import { FarmDiscovery } from './FarmDiscovery';
import { FarmStakingModal } from './FarmStakingModal';
import { TokenOwnerFarm } from '../types';

// Add state for selected farm
const [selectedFarm, setSelectedFarm] = useState<TokenOwnerFarm | undefined>(null);

// In the JSX, add FarmDiscovery component below existing DC farms:
{selectedFarm && (
  <FarmStakingModal
    farm={selectedFarm}
    rewardToken={tokens.find(t => t.id === selectedFarm.rewardTokenId)}
    stakingToken={tokens.find(t => t.id === selectedFarm.stakingTokenId)}
    onClose={() => setSelectedFarm(undefined)}
  />
)}

<FarmDiscovery
  onFarmClick={(farm) => setSelectedFarm(farm)}
/>
```

### 2. TokenDetail Page Integration

Add farm badge to token detail pages:

```tsx
// In components/TokenDetail.tsx, add:
import { FarmBadge } from './FarmBadge';

// Add FarmBadge to the token header:
<FarmBadge
  farms={tokenOwnerFarms.filter(f => f.ownerTokenId === token.id)}
  onClick={() => setShowFarmsTab(true)}
/>
```

### 3. Navigation Integration

Add farm-related routes:

```tsx
// In App.tsx, add routes:
<Route path="/farms" element={<FarmDiscovery />} />
<Route path="/farm/:farmId" element={<FarmDetail />} />
```

## Data Flow

### Creating a Farm
1. Token owner opens CreatorAdmin → Farms tab
2. Clicks "Create New Farm"
3. Fills in farm configuration form
4. [`farmService.createFarm()`](services/farmService.ts:26) validates and creates farm
5. Farm is saved to localStorage
6. [`StoreContext.tokenOwnerFarms`](contexts/StoreContext.tsx:109) state updates
7. UI displays the new farm in FarmManagementTab

### Staking in a Farm
1. User opens FarmDiscovery
2. Selects a farm and clicks "Stake"
3. [`FarmStakingModal`](components/FarmStakingModal.tsx:1) opens
4. User enters stake amount
5. [`farmService.stakeInFarm()`](services/farmService.ts:126) validates and creates position
6. Position is saved to localStorage
7. Rewards accumulate based on [`rewardRate`](services/farmService.ts:329)

### Harvesting Rewards
1. User opens FarmStakingModal for their position
2. Clicks "Harvest" tab
3. [`farmService.harvestFarmRewards()`](services/farmService.ts:174) calculates rewards
4. Rewards are credited to user's balance
5. Position's [`lastHarvestTime`](services/farmService.ts:177) is updated

## State Management

### StoreContext Extensions

The following state fields were added to [`StoreContext`](contexts/StoreContext.tsx:109):

```typescript
tokenOwnerFarms: TokenOwnerFarm[];
tokenOwnerFarmPositions: TokenOwnerFarmPosition[];
```

The following actions were added:

```typescript
createFarm(request: CreateFarmRequest): Promise<string>
depositRewards(farmId: string, amount: number): Promise<void>
updateFarmConfig(farmId: string, config: Partial<FarmConfiguration>): Promise<void>
pauseFarm(farmId: string): Promise<void>
resumeFarm(farmId: string): Promise<void>
closeFarm(farmId: string): Promise<void>
stakeInFarm(farmId: string, amount: number): Promise<void>
unstakeFromFarm(farmId: string, amount: number): Promise<void>
harvestFarmRewards(farmId: string): Promise<number>
getFarm(farmId: string): TokenOwnerFarm | undefined
getMyFarms(): TokenOwnerFarm[]
getFarmPositions(farmId?: string): TokenOwnerFarmPosition[]
getFarmStats(farmId: string): FarmStats | undefined
```

## Security Considerations

### Token Ownership Verification
- [`farmService.createFarm()`](services/farmService.ts:26) checks `creator === 'You'` before allowing farm creation
- Only token creators can manage their farms

### Reward Pool Protection
- Maximum reward rate capped at [`MAX_REWARD_RATE`](services/farmService.ts:15) (0.001)
- Maximum APY capped at [`MAX_APY`](services/farmService.ts:16) (50,000%)
- Maximum total rewards capped at [`MAX_TOTAL_REWARDS`](services/farmService.ts:17) (1B)

### Lock Period Enforcement
- Positions with lock period cannot be unstaked early
- [`farmService.unstakeFromFarm()`](services/farmService.ts:147) checks lock expiration

### Audit Logging
- All farm operations are logged to audit trail
- Logs retained for 90 days

## Testing Checklist

### Unit Tests
- [ ] Farm creation with valid parameters
- [ ] Farm creation with invalid parameters (should fail)
- [ ] Staking with sufficient balance
- [ ] Staking with insufficient balance (should fail)
- [ ] Unstaking after lock period
- [ ] Unstaking before lock period (should fail)
- [ ] Harvesting with pending rewards
- [ ] Reward calculation accuracy

### Integration Tests
- [ ] Farm creation flow end-to-end
- [ ] Staking flow end-to-end
- [ ] Unstaking flow end-to-end
- [ ] Harvesting flow end-to-end
- [ ] Farm discovery and filtering
- [ ] Analytics dashboard rendering
- [ ] State persistence across page reloads

### UI Tests
- [ ] CreatorAdmin Farms tab renders correctly
- [ ] CreateFarmModal validation works
- [ ] FarmCard displays correct information
- [ ] FarmDiscovery filters and search work
- [ ] FarmStakingModal tabs switch correctly
- [ ] FarmAnalytics charts render correctly

## Deployment Steps

1. **Review all created files** - Ensure they follow project conventions
2. **Run TypeScript compilation** - `npm run build` or `tsc --noEmit`
3. **Test in development** - `npm run dev`
4. **Test localStorage persistence** - Verify data persists across reloads
5. **Test all user flows** - Create, stake, unstake, harvest
6. **Check responsive design** - Test on mobile and desktop
7. **Verify accessibility** - Check keyboard navigation and screen readers
8. **Deploy to production** - Follow existing deployment process

## Known Limitations

1. **Demo Mode**: The current implementation uses localStorage for persistence. In production, this should be replaced with a proper backend API.

2. **Mock Analytics**: The [`FarmAnalytics`](components/FarmAnalytics.tsx:1) component generates mock data. In production, this should fetch real historical data from the backend.

3. **Token Balance Management**: The farm service uses mock token balance helpers. In production, this should integrate with the actual wallet/token balance system.

4. **Real-time Updates**: The current implementation uses polling intervals. In production, consider using WebSockets or server-sent events for real-time updates.

## Future Enhancements

1. **Multi-token staking**: Allow users to stake multiple token types in the same farm
2. **Compound staking**: Auto-reinvest harvested rewards
3. **Farm templates**: Pre-configured farm configurations for common use cases
4. **Farm marketplace**: Allow farms to be bought/sold between token owners
5. **Advanced analytics**: ROI calculations, risk metrics, performance comparisons
6. **Farm leaderboard**: Rank farms by various metrics
7. **Social features**: Comments, likes, shares for farms
8. **Farm notifications**: Alert users when rewards are available or farms are expiring

## Support

For issues or questions:
1. Check the [Architecture Document](token-owner-farm-architecture.md)
2. Review the [Farm Service](services/farmService.ts) implementation
3. Examine the [Component Examples](components/) for usage patterns
4. Check browser console for error messages
5. Verify localStorage data in DevTools → Application → Local Storage
