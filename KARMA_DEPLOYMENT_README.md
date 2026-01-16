# $KARMA Token System - Deployment Summary

**Date**: 2026-01-16
**Status**: Ready for Production Deployment
**Network**: DogeChain Mainnet (Chain ID: 2000)

---

## 🎯 Overview

The $KARMA token system has been fully implemented with the following components:

1. **Smart Contracts** (4 contracts)
2. **Backend API** (10 endpoints)
3. **Frontend Dashboard** (Staking interface)
4. **Deployment Scripts** (3 scripts)
5. **Database Integration** (Existing reputation points system)

---

## 📋 Tokenomics

### Supply
- **Max Supply**: `type(uint256).max` (maximum possible on DogeChain)
- **Initial Liquidity**: 1000 $DC paired with max supply $KARMA
- **Mint Cap**: `type(uint112).max` per transaction
- **Rationale**: Maximum volatility and "whale accessibility" for memecoin launchpad

### Fee Distribution
- **Platform Fee**: 2% of trading volume
- **Buyback Fund**: 1% (half of platform fee)
- **Platform Revenue**: 1% (other half)

### Staking Rewards
- **Dynamic APY**: Calculated based on 30-day reward history
- **Formula**: `APY = (Annual Rewards / Total Staked) × 100`
- **Frequency**: Updated every time rewards are distributed via buyback

### Early Adopter Bonus
- **First 30 days**: 2x rewards multiplier
- **Days 31-90**: 1.5x rewards multiplier
- **After 90 days**: 1x (normal)
- **Type**: Time-weighted (no extra tokens minted)

### Security
- **Time Lock**: 2-day timelock on critical contract operations
- **Single Owner**: Deployer wallet (user's wallet)
- **Emergency Pause**: Pause/unpause functionality
- **ReentrancyGuard**: On all state-changing functions

---

## 🏗️ Smart Contracts

### 1. KARMA Token (`contracts/contracts/KARMA.sol`)
**Address**: TBD (after deployment)

**Key Features**:
- ERC-20 token with maximum supply
- Timelocked contract configuration (2-day delay)
- Mint only by buyback contract or owner
- Burn functionality (optional, for future use)
- Event logging for transparency

**Functions**:
- `mint(address to, uint256 amount)` - Only authorized minters
- `burn(uint256 amount)` - Burn own tokens
- `setBuybackContract(address)` - Timelocked (2 days)
- `setStakingContract(address)` - Timelocked (2 days)
- `setMintingEnabled(bool)` - Immediate (emergency)
- `getTokenDetails()` - Get token information

### 2. KARMAStaking (`contracts/contracts/KARMAStaking.sol`)
**Address**: TBD (after deployment)

**Key Features**:
- Time-weighted bonus multipliers
- Stake-seconds reward model
- Dynamic APY calculation
- Reward distribution history
- Emergency pause functionality

**Functions**:
- `stake(uint256 amount)` - Stake tokens with bonus
- `unstake(uint256 amount)` - Unstake tokens
- `claimRewards()` - Claim pending rewards
- `calculateCurrentAPY()` - Get current APY (basis points)
- `getStakeInfo(address)` - Get user's stake information
- `getContractStats()` - Get global statistics
- `getAPYHistory(uint256 limit)` - Historical APY data

### 3. KARMABuyback (`contracts/contracts/KARMABuyback.sol`)
**Address**: TBD (after deployment)

**Key Features**:
- DEX integration for swapping fees → $KARMA
- Slippage protection (0.5% tolerance)
- Minimum liquidity threshold
- Auto-distribution to staking contract
- Enable/disable buyback toggle

**Functions**:
- `executeBuyback(uint256 feeAmount, uint256 minKarmaOut)` - Execute buyback
- `distributeToStakers(uint256 amount)` - Manual distribution
- `setBuybackEnabled(bool)` - Enable/disable
- `setStakingContract(address)` - Configure staking
- `getStatus()` - Get buyback status
- `recoverTokens(address, uint256)` - Recover tokens (non-$KARMA)

### 4. FeeCollector (`contracts/contracts/FeeCollector.sol`)
**Address**: TBD (after deployment)

**Key Features**:
- Splits fees 50/50 (buyback/revenue)
- Only buyback contract can withdraw buyback fees
- Owner can withdraw platform revenue

**Functions**:
- `withdrawBuybackFees(uint256 amount, address to)` - Buyback only
- `withdrawRevenue(uint256 amount)` - Owner only
- `getBuybackFees()` - Get available buyback fees
- `setBuybackContract(address)` - Owner only
- `setRevenueWallet(address)` - Owner only

---

## 🔧 Deployment Scripts

### 1. Mainnet Deployment
**File**: `contracts/scripts/deploy-karma-mainnet.js`

**Command**:
```bash
cd contracts
npm run deploy:karma:mainnet
```

**What it does**:
- Deploys all 4 contracts in correct order
- Configures contract addresses
- Approves DEX router
- Mints max supply to deployer
- Adds initial liquidity (1000 $DC + max $KARMA)
- Saves deployment addresses to JSON
- Prints verification commands

**Output**:
- `deployments/karma-mainnet.json` - Contract addresses & metadata

### 2. Execute Timelocked Calls
**File**: `contracts/scripts/execute-timelocked-calls.js`

**Command** (after 2 days):
```bash
npm run karma:execute-timelock
```

**What it does**:
- Executes queued timelocked calls
- Sets buyback contract address
- Sets staking contract address
- Verifies configuration

**Environment Variables**:
```bash
KARMA_ADDRESS=0x...
KARMA_BUYBACK_ADDRESS=0x...
KARMA_STAKING_ADDRESS=0x...
```

### 3. Check Status
**File**: `contracts/scripts/check-karma-status.js`

**Command**:
```bash
npm run karma:status
```

**What it does**:
- Displays all contract addresses
- Shows token supply and minting status
- Displays staking statistics
- Shows buyback status
- Health check on all contracts

---

## 🌐 Backend API Endpoints

### Base URL
- Production: `https://dogepump.com/api/karma`
- Development: `http://localhost:3001/api/karma`

### Endpoints

#### GET /api/karma/balance
Get user's $KARMA balance
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ balance, formattedBalance, totalSupply }`

#### GET /api/karma/stake-info
Get user's staking information
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ stakedAmount, pendingRewards, bonusMultiplier, bonusLabel }`

#### POST /api/karma/stake
Stake $KARMA tokens
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ amount: string }`
- **Response**: `{ transactionHash, amount, status }`

#### POST /api/karma/unstake
Unstake $KARMA tokens
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ amount: string }`
- **Response**: `{ transactionHash, amount, status }`

#### POST /api/karma/claim-rewards
Claim pending rewards
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ transactionHash, amountClaimed, status }`

#### POST /api/karma/approve
Approve $KARMA for staking
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ transactionHash, approvedAmount, status }`

#### GET /api/karma/stats
Get global $KARMA statistics
- **Response**: `{ token, staking, buyback }`

#### GET /api/karma/history
Get APY history (for chart)
- **Query**: `?limit=30`
- **Response**: `{ history: [{ timestamp, apy, totalStaked }] }`

#### GET /api/karma/buybacks
Get buyback history
- **Query**: `?limit=10&offset=0`
- **Response**: `{ buybacks, count }`

#### GET /api/karma/price
Get current $KARMA price
- **Response**: `{ priceInDC, priceInUSD, timestamp }`

---

## 🎨 Frontend Components

### 1. KarmaDashboard (`components/KarmaDashboard.tsx`)
**Features**:
- Real-time balance display
- Staking/unstaking interface
- Claim rewards button
- Current APY display with trend
- APY history chart (30 days)
- Bonus multiplier information
- Early adopter bonus countdown

**Route**: `/karma`
**Navigation**: Added to secondary nav (Award icon)

### 2. Karma Page (`pages/Karma.tsx`)
**Features**:
- SEO meta tags
- Wraps KarmaDashboard component
- Lazy-loaded for performance

---

## 📦 Files Modified/Created

### Smart Contracts (NEW)
- `contracts/contracts/KARMA.sol` (249 lines)
- `contracts/contracts/KARMAStaking.sol` (425 lines)
- `contracts/contracts/KARMABuyback.sol` (237 lines)
- `contracts/contracts/FeeCollector.sol` (127 lines)

### Deployment Scripts (NEW)
- `contracts/scripts/deploy-karma-mainnet.js` (300+ lines)
- `contracts/scripts/execute-timelocked-calls.js` (180+ lines)
- `contracts/scripts/check-karma-status.js` (250+ lines)
- `contracts/package.json` (updated with new scripts)

### Backend (NEW)
- `server/routes/karma.ts` (580+ lines)
- `server/index.ts` (registered karma routes)

### Frontend (NEW)
- `components/KarmaDashboard.tsx` (500+ lines)
- `pages/Karma.tsx` (25 lines)
- `App.tsx` (added route and lazy load)
- `components/Layout.tsx` (added nav link)

---

## 🚀 Deployment Steps

### Phase 1: Smart Contract Deployment

**Prerequisites**:
```bash
# Environment variables in contracts/.env
MAINNET_MNEMONIC="your twelve word mnemonic phrase"
DOGECHAIN_MAINNET_RPC="https://rpc.dogechain.dog"
DOGECHAIN_MAINNET_API_KEY="your_explorer_api_key"
DOGEPUMP_ROUTER="0x..." # Existing DEX router address
DOGEPUMP_FACTORY="0x..." # Existing DEX factory address
```

**Steps**:
1. Deploy contracts to DogeChain mainnet:
```bash
cd contracts
npm run deploy:karma:mainnet
```

2. Save the deployment addresses (output to console and JSON)

3. Verify contracts on explorer:
```bash
npx hardhat verify --network dogechain <KARMA_ADDRESS> "KARMA" "\\$KARMA"
npx hardhat verify --network dogechain <STAKING_ADDRESS> "<KARMA>" "<FEE_COLLECTOR>"
npx hardhat verify --network dogechain <BUYBACK_ADDRESS> "<KARMA>" "<DC_TOKEN>" "<ROUTER>"
npx hardhat verify --network dogechain <FEE_COLLECTOR_ADDRESS> "<DC_TOKEN>" "<REVENUE_WALLET>"
```

### Phase 2: Execute Timelocked Calls (48 hours later)

**Prerequisites**:
```bash
# Environment variables
KARMA_ADDRESS=<deployed_karma_address>
KARMA_BUYBACK_ADDRESS=<deployed_buyback_address>
KARMA_STAKING_ADDRESS=<deployed_staking_address>
```

**Steps**:
```bash
npm run karma:execute-timelock
```

### Phase 3: Backend Configuration

**Prerequisites**:
```bash
# Environment variables in server/.env or production environment
KARMA_TOKEN_ADDRESS=<deployed_karma_address>
KARMA_STAKING_ADDRESS=<deployed_staking_address>
KARMA_BUYBACK_ADDRESS=<deployed_buyback_address>
FEE_COLLECTOR_ADDRESS=<deployed_fee_collector_address>
DOGEPUMP_ROUTER=<existing_router_address>
DC_TOKEN=<dc_token_address>
BACKEND_PRIVATE_KEY=<private_key_for_transactions>
DOGECHAIN_MAINNET_RPC=<rpc_url>
```

### Phase 4: Frontend Deployment

**Steps**:
1. Update production environment variables
2. Push to GitHub main branch
3. Vercel auto-deploys (verify deployment at Vercel dashboard)
4. Test all functionality privately

### Phase 5: Post-Deployment Testing

**Checklist**:
- [ ] Visit `/karma` route loads without errors
- [ ] Global stats display correctly
- [ ] Connect wallet and verify balance shows
- [ ] Approve $KARMA for staking
- [ ] Stake small test amount
- [ ] Verify stake appears in dashboard
- [ ] Claim rewards (if available)
- [ ] Unstake test amount
- [ ] Check APY calculation is dynamic
- [ ] Verify bonus multiplier shows correctly
- [ ] Check console for errors (Chrome DevTools)
- [ ] Test API endpoints with Postman/curl
- [ ] Monitor backend logs for errors
- [ ] Check database for correct data storage

---

## 📊 Success Metrics

### Technical
- [ ] All contracts deployed and verified
- [ ] All contract functions tested and working
- [ ] Backend API responding correctly
- [ ] Frontend rendering without errors
- [ ] No console errors on any page
- [ ] Database migrations applied successfully

### Functional
- [ ] Staking flow works end-to-end
- [ ] Dynamic APY calculates correctly
- [ ] Bonus multipliers apply correctly
- [ ] Buyback can execute (manual test)
- [ ] Rewards distribute to stakers
- [ ] Fee collection working

### Business
- [ ] Users can stake $KARMA
- [ ] Users can claim rewards
- [ ] APY updates based on market conditions
- [ ] Early adopter bonus visible
- [ ] Platform receives revenue share

---

## ⚠️ Important Notes

### Security
1. **Private Keys**: Never commit private keys to Git
2. **Mnemonics**: Store securely, use hardware wallet for production
3. **Time Lock**: 2-day delay on critical operations is intentional
4. **Owner**: Deployer wallet has full control (consider multi-sig for future)

### Gas Costs
- Initial deployment: ~$50-100 in gas fees
- Timelock execution: ~$5-10
- Adding liquidity: ~$10-20
- **Total**: ~$65-130 (estimate)

### Initial Liquidity
- $DC needed: 1000 DC
- $KARMA: Max supply (minted to deployer)
- **Action**: Ensure deployer wallet has 1000 DC before deployment

### Monitoring
After deployment, monitor:
- Buyback execution frequency
- APY fluctuations
- Total staked amount
- Number of stakers
- Gas costs for transactions
- Any unusual contract activity

---

## 🔄 Post-Launch Tasks

### Immediate (Day 1)
1. Monitor buyback execution
2. Verify APY calculation accuracy
3. Check reward distributions
4. Respond to user issues

### Short-term (Week 1)
1. Optimize buyback frequency if needed
2. Adjust slippage tolerance based on execution
3. Monitor gas costs
4. Gather user feedback

### Long-term (Month 1)
1. Analyze staking behavior
2. Review bonus effectiveness
3. Consider APY adjustments
4. Plan additional features

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Insufficient allowance" when staking
**Solution**: Click "Approve $KARMA" button first

**Issue**: "Too early" for timelock execution
**Solution**: Wait full 48 hours after deployment

**Issue**: Contracts not verified
**Solution**: Run verification commands from deployment output

**Issue**: APY shows 0%
**Solution**: Normal if no rewards distributed yet (wait for first buyback)

**Issue**: Can't stake tokens
**Solution**: Ensure you have $KARMA balance and have approved

### Debug Commands

```bash
# Check contract status
npm run karma:status

# View contract logs (using hardhat node)
npx hardhat node --fork https://rpc.dogechain.dog

# Test locally before deployment
npm test

# Check database migrations
psql -d dogepump -f server/database/migrations/002_rename_karma_to_reputation.sql
```

---

## 📝 License

All smart contracts and code are proprietary to Dogepump.
Deployed on DogeChain mainnet.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Status**: Production Ready
